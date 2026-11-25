import { BufferGeometry, CanvasTexture, Color, Float32BufferAttribute, LinearFilter, LineBasicMaterial, LineSegments, Material, NoColorSpace, RepeatWrapping } from "three";
import { GLOBE } from "./globe";

/**
 * The whole world under the Bathurst map.
 *
 * The engine's ground is one flat disc in metres round Toronto (toXZ: 111 km per degree of latitude, 80.3 km per degree
 * of longitude). That linear scale is only true near Toronto, so everything past the region is placed with an azimuthal
 * equidistant projection centred on the same point instead: distance and bearing from Toronto are exact. Near Toronto the
 * two agree to within a tenth of a percent, so the city, the region and the world line up.
 *
 * Why that projection: lib/bathurst/globe.ts curls the flat map over a sphere by distance from the camera's ground point.
 * Applied to an azimuthal equidistant map, with the sphere at Earth's radius and the camera over Toronto, that curl is
 * exactly the inverse projection: zoomed all the way out, the paper planet is the real planet.
 *
 * The data is Natural Earth 1:50m (public/map/world.json, public domain; baked from the GeoJSON by a script kept out of the
 * repo: coordinates rounded to 0.01° and thinned). Land and lakes are not geometry: they are painted once into an
 * equirectangular mask (red: land, green: lakes) that the ground disc's fragment shader reads through the inverse
 * projection, so nothing has to be triangulated across the dateline or the poles. The pen work (coasts and borders,
 * province and state lines, rivers) is line geometry, bent over the globe like every other line on the map.
 */

/** Earth's radius at the engine's own scale (111 km per degree). */
export const R_E = GLOBE.maxR;
const D2R = Math.PI / 180;

export type Geo = { lat: number; lon: number };
type Ring = number[];   // [lon, lat, lon, lat, …]
type Area = { n: string | null; r: number; at: [number, number] | null; p: Ring[][]; min?: number; c?: number };
export type WorldData = {
  countries: Area[]; lakes: Area[]; seas: Area[];
  rivers: { r: number; l: Ring[] }[]; states: Ring[];
  places: [name: string, lon: number, lat: number, rank: number, capital: 0 | 1][];
};

/** Flat world position (x east, z south, metres) of a point, azimuthal equidistant about `o`. */
export function geoXZ(o: Geo, lat: number, lon: number) {
  const p1 = o.lat * D2R, p = lat * D2R, dl = (lon - o.lon) * D2R;
  const cc = Math.min(1, Math.max(-1, Math.sin(p1) * Math.sin(p) + Math.cos(p1) * Math.cos(p) * Math.cos(dl)));
  const c = Math.acos(cc), k = c < 1e-9 ? 1 : c / Math.sin(c);
  const x = R_E * k * Math.cos(p) * Math.sin(dl);
  const y = R_E * k * (Math.cos(p1) * Math.sin(p) - Math.sin(p1) * Math.cos(p) * Math.cos(dl));
  return { x, z: -y };
}

/** The inverse: latitude and longitude of a flat world position. */
export function xzGeo(o: Geo, x: number, z: number): Geo {
  const y = -z, rho = Math.hypot(x, y);
  if (rho < 1e-6) return { lat: o.lat, lon: o.lon };
  const c = Math.min(rho / R_E, Math.PI), p1 = o.lat * D2R, sc = Math.sin(c), cc = Math.cos(c);
  const lat = Math.asin(Math.min(1, Math.max(-1, cc * Math.sin(p1) + (y * sc * Math.cos(p1)) / rho)));
  const lon = o.lon * D2R + Math.atan2(x * sc, rho * Math.cos(p1) * cc - y * Math.sin(p1) * sc);
  return { lat: lat / D2R, lon: ((((lon / D2R) + 540) % 360) - 180) };
}

export const worldUniforms = {
  uLand: { value: null as CanvasTexture | null },
  uTint: { value: null as CanvasTexture | null },   // each country's paper tint (Natural Earth's MAPCOLOR7: neighbours never share one)
  uTintK: { value: 0.75 },
  uHasLand: { value: 0 },
  uWorldK: { value: 0 },                 // 0: the region view, where the baked GTA map owns the ground; 1: the world's water everywhere
  uSea: { value: new Color(0x6d9ac4) },
  uGeo0: { value: [0, 0] as [number, number] },   // the projection centre, radians
  uRE: { value: R_E },
};

/**
 * Give the ground disc the world: oceans and lakes from the mask. Near Toronto the baked region (Lake Ontario, its own
 * shoreline) owns the ground until the camera is high, so the soft mask never sits over the crisp bake; everywhere past
 * it the world's water always shows, so a client in Montreal or Miami is on a real coast, not bare paper.
 * Call before the globe bend is added (bendMaterial wraps whatever onBeforeCompile is already there).
 */
export function worldGround(m: Material, o: Geo) {
  worldUniforms.uGeo0.value = [o.lat * D2R, o.lon * D2R];
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, worldUniforms);
    sh.vertexShader = "varying vec2 vGeo;\n" + sh.vertexShader.replace("#include <begin_vertex>",
      "#include <begin_vertex>\n vGeo = ( modelMatrix * vec4( transformed, 1.0 ) ).xz;");
    sh.fragmentShader = /* glsl */ `varying vec2 vGeo;
uniform sampler2D uLand; uniform sampler2D uTint; uniform float uTintK; uniform float uHasLand; uniform float uWorldK; uniform vec3 uSea; uniform vec2 uGeo0; uniform float uRE;
` + sh.fragmentShader.replace("#include <color_fragment>", /* glsl */ `
  if ( uHasLand > 0.5 ) {
    float rho = length( vGeo ), lat = uGeo0.x, lon = uGeo0.y;
    float k = max( uWorldK, smoothstep( 45000.0, 75000.0, rho ) );   // the region bake's own area, then the world
    if ( k > 0.001 ) {
      if ( rho > 1.0 ) {
        float c = min( rho / uRE, 3.14159 ), sc = sin( c ), cc = cos( c ), y = -vGeo.y;
        lat = asin( clamp( cc * sin( uGeo0.x ) + y * sc * cos( uGeo0.x ) / rho, -1.0, 1.0 ) );
        lon = uGeo0.y + atan( vGeo.x * sc, rho * cos( uGeo0.x ) * cc - y * sin( uGeo0.x ) * sc );
      }
      vec2 uv = vec2( fract( lon / 6.2831853 + 0.5 ), lat / 3.1415927 + 0.5 );
      vec4 m = texture2D( uLand, uv );
      float land = smoothstep( 0.3, 0.7, m.r ) * ( 1.0 - smoothstep( 0.3, 0.7, m.g ) );
      vec4 t = texture2D( uTint, uv );
      diffuseColor.rgb = mix( diffuseColor.rgb, t.rgb, uTintK * k * land * t.a );   // the countries in their paper tints
      diffuseColor.rgb = mix( diffuseColor.rgb, uSea, k * ( 1.0 - land ) );
    }
  }
#include <color_fragment>`);
  };
  m.customProgramCacheKey = () => "world-ground";
  m.needsUpdate = true;
}

/** Trace one polygon's rings onto an equirectangular canvas (a ring that crosses the dateline is unwrapped and drawn on both sides). */
function tracePoly(g: CanvasRenderingContext2D, poly: Ring[], Wd: number, Ht: number, shift: number) {
  const X = (lon: number) => ((lon + 180) / 360) * Wd, Y = (lat: number) => ((90 - lat) / 180) * Ht;
  for (const r of poly) {
    const first = r[0];
    let off = 0, prev = first;
    g.moveTo(X(r[0] + shift), Y(r[1]));
    for (let k = 2; k < r.length; k += 2) {
      const d = r[k] - prev; if (d > 180) off -= 360; else if (d < -180) off += 360;
      prev = r[k]; g.lineTo(X(r[k] + off + shift), Y(r[k + 1]));
    }
    // a ring that goes all the way round (Antarctica) closes along the pole, not back across the map
    if (off) { g.lineTo(X(r[r.length - 2] + off + shift), Y(-90)); g.lineTo(X(first + shift), Y(-90)); }
    g.closePath();
  }
}

/** Paint land (red) and lakes (green) into the mask and hand it to the ground. `big`: 4096 wide, else 2048. */
export function setLand(w: WorldData, big: boolean) {
  const Wd = big ? 4096 : 2048, Ht = Wd / 2, cv = document.createElement("canvas");
  cv.width = Wd; cv.height = Ht;
  const g = cv.getContext("2d");
  if (!g) return;
  g.fillStyle = "#000"; g.fillRect(0, 0, Wd, Ht);
  const paint = (areas: Area[], color: string) => {
    g.fillStyle = color;
    for (const a of areas) for (const poly of a.p) for (const shift of [-360, 0, 360]) { g.beginPath(); tracePoly(g, poly, Wd, Ht, shift); g.fill("evenodd"); }
  };
  paint(w.countries, "#f00");
  g.globalCompositeOperation = "lighter";   // lakes add green over the land's red
  paint(w.lakes, "#0f0");
  const tex = (c: HTMLCanvasElement) => { const t = new CanvasTexture(c); t.colorSpace = NoColorSpace; t.wrapS = RepeatWrapping; t.generateMipmaps = false; t.minFilter = LinearFilter; t.magFilter = LinearFilter; return t; };
  // the tints: a quarter the size (they are flat fills; the borders are drawn in pen over them)
  const tv = document.createElement("canvas"); tv.width = Wd / 2; tv.height = Ht / 2;
  const tg = tv.getContext("2d");
  if (tg) for (const a of w.countries) {
    tg.fillStyle = TINTS[((a.c ?? 1) - 1) % TINTS.length];
    for (const poly of a.p) for (const shift of [-360, 0, 360]) { tg.beginPath(); tracePoly(tg, poly, Wd / 2, Ht / 2, shift); tg.fill("evenodd"); }
  }
  worldUniforms.uLand.value?.dispose(); worldUniforms.uTint.value?.dispose();
  worldUniforms.uLand.value = tex(cv); worldUniforms.uTint.value = tex(tv); worldUniforms.uHasLand.value = 1;
}

/** Seven vintage atlas tints, warm and low in chroma so they sit on the cream paper under the blue pen. Slot 6 is the
 *  paper itself (#EDE5CB, the print style's land): it is Canada's, so home stays the brand cream and the neighbours take the colour. */
const TINTS = ["#EBD9AE", "#DCDDB0", "#EBCBBB", "#E7D2B6", "#E4CF9C", "#EDE5CB", "#E2D0D8"];   // none of them cool: a blue-grey land reads as water

/** A graticule: meridians and parallels every `step` degrees, as polylines (2° vertices so they follow the curve). */
export function graticule(step: number): Ring[] {
  const out: Ring[] = [];
  for (let lon = -180; lon < 180; lon += step) { const l: Ring = []; for (let lat = -80; lat <= 80; lat += 2) l.push(lon, lat); out.push(l); }
  for (let lat = -80; lat <= 80; lat += step) { const l: Ring = []; for (let lon = -180; lon <= 180; lon += 2) l.push(lon, lat); out.push(l); }
  return out;
}

export function disposeLand() {
  worldUniforms.uLand.value?.dispose(); worldUniforms.uLand.value = null; worldUniforms.uTint.value?.dispose(); worldUniforms.uTint.value = null; worldUniforms.uHasLand.value = 0;
}

/** One set of map lines (each polyline as segments), placed on the world projection about `o`. */
export function worldLines(o: Geo, lines: Ring[], color: Color, renderOrder: number) {
  const pos: number[] = [];
  for (const l of lines) {
    let px = 0, pz = 0;
    for (let k = 0; k < l.length; k += 2) {
      const { x, z } = geoXZ(o, l[k + 1], l[k]);
      if (k) pos.push(px, 0, pz, x, 0, z);
      px = x; pz = z;
    }
  }
  const geo = new BufferGeometry(); geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
  const m = new LineSegments(geo, new LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false }));
  m.renderOrder = renderOrder; m.frustumCulled = false;
  return m;
}

/** Every ring of a set of areas, closed, as polylines (a country's rings are its coast and its borders). */
export const outlines = (areas: Area[]) => areas.flatMap((a) => a.p.flatMap((poly) => poly.map((r) => [...r, r[0], r[1]])));

function inRing(r: Ring, x: number, y: number) {
  let inside = false;
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
type Indexed = Area & { box?: number[][] };
function inArea(a: Indexed, lon: number, lat: number) {
  a.box ??= a.p.map((poly) => { const r = poly[0]; let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (let k = 0; k < r.length; k += 2) { x0 = Math.min(x0, r[k]); x1 = Math.max(x1, r[k]); y0 = Math.min(y0, r[k + 1]); y1 = Math.max(y1, r[k + 1]); } return [x0, x1, y0, y1]; });
  return a.p.some((poly, i) => { const b = a.box![i]; if (lon < b[0] || lon > b[1] || lat < b[2] || lat > b[3]) return false; let n = 0; for (const r of poly) if (inRing(r, lon, lat)) n++; return n % 2 === 1; });
}
/** What is at a point: a named lake, else a country, else a named sea; null over open water with no name. */
export function placeAt(w: WorldData, lat: number, lon: number): { name: string; kind: "lake" | "country" | "sea" } | null {
  const lake = w.lakes.find((a) => a.n && inArea(a, lon, lat)); if (lake) return { name: lake.n!, kind: "lake" };
  const c = w.countries.find((a) => inArea(a, lon, lat)); if (c?.n) return { name: c.n, kind: "country" };
  const s = w.seas.find((a) => inArea(a, lon, lat)); if (s?.n) return { name: s.n, kind: "sea" };
  return null;
}
