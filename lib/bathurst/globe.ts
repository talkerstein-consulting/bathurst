import { Color, Material, Object3D, Plane, Ray, Sphere, Vector3 } from "three";

/**
 * The paper planet: the flat city is curled over a sphere in the vertex shader, so the far map drops away like
 * the curvature of the earth and the pins, streets and buildings all ride the same curve. No new geometry, no
 * textures, no extra draws: every material the scene already has gets a few lines of shader, which is why it
 * costs nothing on a phone. The sphere sits under the camera's ground point (the camera is always on top of the
 * world), so panning rolls the planet and the limb stays a clean circle.
 *
 * Mapping, per vertex (world space): a point at surface distance d from the camera's ground point and height y
 * goes to angle θ = d / R round a sphere of radius R, at R + y along the local normal.
 *
 * The radius grows with the camera's altitude (rAt): a horizon only bends on screen when the planet is small next
 * to the camera's height, so the street gets a diorama-sized planet (the horizon curves a kilometre out) and the
 * overview a near-earth one, and at every height the limb sits at about the same depression, in the top corners
 * of the frame. The same mapping runs here in JavaScript (bendPoint, facing, groundHit) for the DOM pins and
 * labels the engine projects, the camera fits and the zoom-at-pointer raycast.
 */
export const GLOBE = {
  /** Off: nothing is patched and the world stays flat (dev: ?globe=off, to compare). */
  on: true,
  /** Radius = slope × altitude, between minR and maxR (metres). slope sets where the limb falls: the depression of the
   *  limb below the horizontal is acos(slope / (slope + 1)), 44° at 2.6. On the overview (the camera 17° off vertical) that
   *  puts the arc through the top corners of a wide screen and just under the top edge of a phone's. Dev: ?globe=<slope>. */
  slope: 2.6,
  minR: 4000,
  maxR: 150000,
};

export const uniforms = {
  uRe: { value: GLOBE.minR },
  uK: { value: 0 },
  uSun: { value: new Vector3(-0.55, 0.7, 0.45).normalize() },
  uShadeK: { value: 0.14 },                      // how much the far side darkens (a soft sphere shading, never a gradient near the camera)
  uRim: { value: new Color(0xffffff) },          // the bright rim just inside the limb (the atmosphere seen edge-on)
  uRimK: { value: 0.85 },
  uRimW: { value: 0.1 },                         // width of that rim, in facing cosine
  uEdge: { value: 0.003 },                       // the limb itself fades out over about three pixels, so its edge is smooth
  uLimb: { value: Math.PI / 2 },                 // angle from straight down to the limb, for the sky dome's halo
  uGlow: { value: new Color(0xffffff) },         // the halo beyond the limb
  uGlowW: { value: 0.05 },                       // its width in radians
  uGlowK: { value: 0 },
};

const VERT_HEAD = /* glsl */ `
uniform float uRe; uniform float uK; uniform vec3 uSun; uniform float uShadeK;
varying float vFace; varying float vShade;
vec3 globeBend( vec3 w, out float face, out float shade ) {
  vec2 d = w.xz - cameraPosition.xz;
  float dist = length( d );
  float th = dist / uRe;
  vec2 dir = dist > 1e-3 ? d / dist : vec2( 0.0 );
  float s = sin( th ), c = cos( th );
  vec3 n = vec3( dir.x * s, c, dir.y * s );
  vec3 sph = vec3( cameraPosition.x, -uRe, cameraPosition.z ) + n * ( uRe + w.y );
  vec3 p = mix( w, sph, uK );
  vec3 nb = normalize( mix( vec3( 0.0, 1.0, 0.0 ), n, uK ) );
  vec3 toCam = cameraPosition - p;
  face = mix( 1.0, dot( nb, toCam ) / max( 1.0, length( toCam ) ), uK );
  shade = 1.0 - uShadeK * max( 0.0, uSun.y - dot( nb, uSun ) );
  return p;
}
`;
const FRAG_HEAD = /* glsl */ `
uniform vec3 uRim; uniform float uRimK; uniform float uRimW; uniform float uEdge;
varying float vFace; varying float vShade;
`;
const FRAG_BODY = /* glsl */ `
  if ( vFace < 0.0 ) discard;
  diffuseColor.rgb *= vShade;
  diffuseColor.rgb = mix( diffuseColor.rgb, uRim, uRimK * ( 1.0 - smoothstep( 0.0, uRimW, vFace ) ) );
  diffuseColor.a *= smoothstep( 0.0, uEdge, vFace );
`;

type Shader = Parameters<Material["onBeforeCompile"]>[0];

function must(src: string, token: string, what: string) {
  if (!src.includes(token)) console.warn(`globe: ${what} has no "${token}" to patch`);
  return src.includes(token);
}

/** Standard three materials (MeshBasic, LineBasic): bend in place of project_vertex, shade and cut in color_fragment. */
function patchStandard(sh: Shader) {
  Object.assign(sh.uniforms, uniforms);
  if (must(sh.vertexShader, "#include <project_vertex>", "vertex shader")) {
    sh.vertexShader = VERT_HEAD + sh.vertexShader.replace("#include <project_vertex>", /* glsl */ `
  vec4 mvPosition = vec4( globeBend( ( modelMatrix * vec4( transformed, 1.0 ) ).xyz, vFace, vShade ), 1.0 );
  mvPosition = viewMatrix * mvPosition;
  gl_Position = projectionMatrix * mvPosition;`);
  }
  if (must(sh.fragmentShader, "#include <color_fragment>", "fragment shader")) {
    sh.fragmentShader = FRAG_HEAD + sh.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>" + FRAG_BODY);
  }
}

/** three's fat lines (LineMaterial, examples/jsm/lines): both ends of each segment are bent, the vertex takes its own end's values. */
function patchFatLine(sh: Shader) {
  Object.assign(sh.uniforms, uniforms);
  const S = "vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );", E = "vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );";
  if (must(sh.vertexShader, S, "fat line vertex shader") && must(sh.vertexShader, E, "fat line vertex shader")) {
    sh.vertexShader = VERT_HEAD + sh.vertexShader
      .replace(S, "float fS, sS, fE, sE;\n vec4 start = viewMatrix * vec4( globeBend( ( modelMatrix * vec4( instanceStart, 1.0 ) ).xyz, fS, sS ), 1.0 );")
      .replace(E, "vec4 end = viewMatrix * vec4( globeBend( ( modelMatrix * vec4( instanceEnd, 1.0 ) ).xyz, fE, sE ), 1.0 );\n vFace = position.y < 0.5 ? fS : fE; vShade = position.y < 0.5 ? sS : sE;");
  }
  if (must(sh.fragmentShader, "#include <color_fragment>", "fat line fragment shader")) {
    sh.fragmentShader = FRAG_HEAD + sh.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>" + FRAG_BODY);
  }
}

/** Give one material the bend (once). Materials flagged userData.noBend (the sky, the skyline backdrop) are left alone. */
export function bendMaterial(m: Material) {
  if (!GLOBE.on || m.userData.noBend || m.userData.globe) return;
  m.userData.globe = true;
  const prev = m.onBeforeCompile, prevSrc = prev.toString();
  const fat = (m as Material & { isLineMaterial?: boolean }).isLineMaterial === true;
  m.onBeforeCompile = (sh, r) => { prev.call(m, sh, r); (fat ? patchFatLine : patchStandard)(sh); };
  // the program cache keys on the hook's source, which every patched material now shares: say what was wrapped
  m.customProgramCacheKey = () => prevSrc + "|globe" + (fat ? "F" : "");
  m.needsUpdate = true;
}

/** Bend everything under a scene node that is not already bent (call again after adding objects, before they render). */
export function bendObject(root: Object3D) {
  root.traverse((o) => {
    const mat = (o as Object3D & { material?: Material | Material[] }).material;
    if (!mat) return;
    for (const m of Array.isArray(mat) ? mat : [mat]) bendMaterial(m);
  });
}

/** The sky dome: no bend (it rides with the camera), but a soft atmosphere halo just outside the planet's limb. */
export function haloMaterial(m: Material) {
  m.userData.noBend = true;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = "varying vec3 vDir;\n" + sh.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\n vDir = normalize( position );");
    sh.fragmentShader = "uniform float uLimb; uniform vec3 uGlow; uniform float uGlowW; uniform float uGlowK; varying vec3 vDir;\n" +
      sh.fragmentShader.replace("#include <color_fragment>", /* glsl */ `#include <color_fragment>
  { float ang = acos( clamp( -vDir.y, -1.0, 1.0 ) );
    float g = exp( -max( 0.0, ang - uLimb ) / uGlowW ) * uGlowK;
    diffuseColor.rgb = mix( diffuseColor.rgb, uGlow, g * 0.9 ); }`);
  };
  m.customProgramCacheKey = () => "globe-halo";
  m.needsUpdate = true;
}

/** The planet's radius for a camera at this altitude (metres). */
export const rAt = (altitude: number) => Math.min(GLOBE.maxR, Math.max(GLOBE.minR, GLOBE.slope * Math.max(0, altitude)));
/** How bent the world is: fully, unless the globe is off. */
export const kAt = () => (GLOBE.on ? 1 : 0);
/** Surface distance from the camera's ground point to the limb, for a camera at this altitude. */
export function limbAt(altitude: number) {
  const R = rAt(altitude);
  return R * Math.acos(R / (R + Math.max(0, altitude)));
}

/** Per frame: set the radius and bend for the camera's altitude, and where its limb falls. */
export function setGlobe(altitude: number) {
  const k = kAt(), R = rAt(altitude);
  uniforms.uK.value = k;
  uniforms.uRe.value = R;
  uniforms.uLimb.value = Math.asin(R / (R + Math.max(0, altitude)));
  uniforms.uGlowK.value = k;
  return k;
}

/** Where a flat world point lands on the globe seen from `cam` (the same mapping as the shader). The bend and radius
 *  default to what is drawn now; a camera fit for another altitude passes kAt() and rAt(that altitude). */
export function bendPoint(out: Vector3, w: { x: number; y: number; z: number }, cam: Vector3, K = uniforms.uK.value, R = uniforms.uRe.value): Vector3 {
  if (K <= 0) return out.set(w.x, w.y, w.z);
  const dx = w.x - cam.x, dz = w.z - cam.z, dist = Math.hypot(dx, dz), th = dist / R;
  const ux = dist > 1e-3 ? dx / dist : 0, uz = dist > 1e-3 ? dz / dist : 0;
  const s = Math.sin(th), c = Math.cos(th), r = R + w.y;
  const sx = cam.x + ux * s * r, sy = -R + c * r, sz = cam.z + uz * s * r;
  return out.set(w.x + (sx - w.x) * K, w.y + (sy - w.y) * K, w.z + (sz - w.z) * K);
}

const _n = new Vector3(), _p = new Vector3();
/** Facing cosine of the bent surface at a world point toward the camera: below zero it is round the back of the planet. */
export function facing(w: { x: number; y: number; z: number }, cam: Vector3, K = uniforms.uK.value, R = uniforms.uRe.value): number {
  if (K <= 0) return 1;
  const dx = w.x - cam.x, dz = w.z - cam.z, dist = Math.hypot(dx, dz), th = dist / R;
  const ux = dist > 1e-3 ? dx / dist : 0, uz = dist > 1e-3 ? dz / dist : 0, s = Math.sin(th), c = Math.cos(th);
  _n.set(ux * s * K, 1 - K + c * K, uz * s * K).normalize();
  bendPoint(_p, w, cam, K, R); _p.subVectors(cam, _p);
  const L = _p.length();
  return 1 - K + K * (_n.dot(_p) / Math.max(1, L));
}

const _sphere = new Sphere(), _plane = new Plane(new Vector3(0, 1, 0), 0), _hit = new Vector3(), _flat = new Vector3();
/** Where a ray from the camera meets the ground, as a flat world point (unbent). false when it misses the planet. */
export function groundHit(ray: Ray, cam: Vector3, out: Vector3): boolean {
  const K = uniforms.uK.value, R = uniforms.uRe.value;
  const flat = !!ray.intersectPlane(_plane, _flat);
  if (K < 0.5) { if (flat) out.copy(_flat); return flat; }
  _sphere.center.set(cam.x, -R, cam.z); _sphere.radius = R;
  if (!ray.intersectSphere(_sphere, _hit)) return false;
  _n.subVectors(_hit, _sphere.center).divideScalar(R);
  const th = Math.acos(Math.min(1, Math.max(-1, _n.y))), d = R * th, hl = Math.hypot(_n.x, _n.z) || 1;
  out.set(cam.x + (_n.x / hl) * d, 0, cam.z + (_n.z / hl) * d);
  return true;
}
