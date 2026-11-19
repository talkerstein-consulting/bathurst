"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export type GrainMassShape = "sweep" | "veil" | "dune" | "plume" | "loop";

export interface GrainMassHandle {
  scatter: (strength?: number) => void;
}

export interface GrainMassProps {
  colors?: [string, string];
  backgroundColor?: string;
  shape?: GrainMassShape;
  layers?: number;
  particles?: number;
  strands?: number;
  grainSize?: number;
  fuzz?: number;
  opacity?: number;
  size?: number;
  width?: number;
  curl?: number;
  twist?: number;
  billow?: number;
  folds?: number;
  tilt?: number;
  turn?: number;
  angle?: number;
  centerX?: number;
  centerY?: number;
  speed?: number;
  flow?: number;
  drift?: number;
  sway?: number;
  lightX?: number;
  lightY?: number;
  gradient?: number;
  depth?: number;
  faces?: number;
  sheen?: number;
  shade?: number;
  highlight?: number;
  contrast?: number;
  blur?: number;
  intro?: boolean;
  interactive?: boolean;
  stir?: number;
  scatter?: number;
  seed?: number;
  paused?: boolean;
  quality?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

interface Settings {
  colors: [string, string];
  backgroundColor: string;
  shape: GrainMassShape;
  layers: number;
  particles: number;
  strands: number;
  grainSize: number;
  fuzz: number;
  opacity: number;
  size: number;
  width: number;
  curl: number;
  twist: number;
  billow: number;
  folds: number;
  tilt: number;
  turn: number;
  angle: number;
  centerX: number;
  centerY: number;
  speed: number;
  flow: number;
  drift: number;
  sway: number;
  lightX: number;
  lightY: number;
  gradient: number;
  depth: number;
  faces: number;
  sheen: number;
  shade: number;
  highlight: number;
  contrast: number;
  blur: number;
  intro: boolean;
  interactive: boolean;
  stir: number;
  scatter: number;
  seed: number;
  paused: boolean;
  quality: number;
  reduced: boolean;
}

interface Controller {
  sync: () => void;
  scatter: (strength?: number) => void;
  destroy: () => void;
}

interface Stage {
  closed: boolean;
  layers: number;
  centred: boolean;
  extentX: number;
  extentY: number;
  billow: number;
}

interface Stir {
  x: number;
  y: number;
  fromX: number;
  fromY: number;
  target: number;
  level: number;
}

type Rgb = [number, number, number];

const DEFAULT_COLORS: [string, string] = ["#FF9FFC", "#5227FF"];
const RINGS = 256;
const RAMP = 256;
const STIRS = 10;
const MAX_LAYERS = 8;
const FOV = 30;
const INTRO_SECONDS = 2.4;
const MAX_PARTICLES = 2400000;
const LOOP_TILT = 52;
const TAU = Math.PI * 2;
const RAD = Math.PI / 180;
const DISTANCE = 1 / Math.tan((FOV * RAD) / 2);

const STAGES: Record<GrainMassShape, Stage> = {
  sweep: { closed: false, layers: 3, centred: false, extentX: 1, extentY: 1, billow: 1 },
  veil: { closed: false, layers: 4, centred: false, extentX: 1, extentY: 1, billow: 0.9 },
  dune: { closed: false, layers: 5, centred: false, extentX: 1, extentY: 1, billow: 0.7 },
  plume: { closed: false, layers: 3, centred: false, extentX: 1, extentY: 1, billow: 0.8 },
  loop: { closed: true, layers: 1, centred: true, extentX: 1.8, extentY: 1.25, billow: 0.22 },
};

const particleVertex = `
precision highp float;
precision highp int;

uniform sampler2D uCurve;
uniform sampler2D uRamp;
uniform float uRings;
uniform float uLayers;
uniform float uClosed;
uniform float uThreads;
uniform float uSamples;
uniform float uTime;
uniform float uCurrent;
uniform float uFlow;
uniform float uBillow;
uniform float uFolds;
uniform float uFuzz;
uniform float uPoint;
uniform float uSeed;
uniform vec3 uLight;
uniform float uGradient;
uniform float uLayerTone;
uniform float uToneScale;
uniform float uFaces;
uniform float uSheen;
uniform float uShift;
uniform float uOpacity;
uniform float uIntro;
uniform float uPuff;
uniform vec4 uStir[${STIRS}];
uniform float uLoose;
uniform float uAspect;
uniform float uFocus;
uniform float uBlur;

out vec4 vTint;
out float vWeight;

uvec3 scramble(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z;
  v.y += v.z * v.x;
  v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z;
  v.y += v.z * v.x;
  v.z += v.x * v.y;
  return v;
}

vec3 chance(uint salt) {
  return vec3(scramble(uvec3(uint(gl_VertexID), salt, uint(uSeed)))) * (1.0 / 4294967295.0);
}

vec3 lattice(vec3 cell) {
  return vec3(scramble(uvec3(ivec3(cell) + 65536))) * (2.0 / 4294967295.0) - 1.0;
}

vec3 corner(vec3 cell, vec3 offset) {
  vec3 g = lattice(cell);
  return vec3(dot(g, offset), dot(g.yzx, offset), dot(g.zxy, offset));
}

vec3 wander(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 w = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec3 a = mix(corner(i, f), corner(i + vec3(1.0, 0.0, 0.0), f - vec3(1.0, 0.0, 0.0)), w.x);
  vec3 b = mix(corner(i + vec3(0.0, 1.0, 0.0), f - vec3(0.0, 1.0, 0.0)), corner(i + vec3(1.0, 1.0, 0.0), f - vec3(1.0, 1.0, 0.0)), w.x);
  vec3 c = mix(corner(i + vec3(0.0, 0.0, 1.0), f - vec3(0.0, 0.0, 1.0)), corner(i + vec3(1.0, 0.0, 1.0), f - vec3(1.0, 0.0, 1.0)), w.x);
  vec3 d = mix(corner(i + vec3(0.0, 1.0, 1.0), f - vec3(0.0, 1.0, 1.0)), corner(i + vec3(1.0, 1.0, 1.0), f - vec3(1.0, 1.0, 1.0)), w.x);
  return mix(mix(a, b, w.y), mix(c, d, w.y), w.z) * 1.6;
}

vec3 billow(vec3 p) {
  vec3 q = p * (0.8 * uFolds) + vec3(uCurrent * 0.05, uCurrent * 0.032, uCurrent * 0.07);
  return (wander(q) + 0.36 * wander(q * 2.07 + vec3(5.2, 1.3, 7.7))) * uBillow * 0.2;
}

void main() {
  float id = float(gl_VertexID);
  float thread = floor(id / uSamples);
  float slot = id - thread * uSamples;
  float layer = min(floor(thread / uThreads), uLayers - 1.0);
  float local = thread - layer * uThreads;
  vec3 a = chance(11u);
  vec3 b = chance(23u);
  vec3 c = chance(37u);
  float base = (local + 0.5) / uThreads;
  float rim = 1.0 - smoothstep(0.0, 0.2, min(base, 1.0 - base));
  float v = clamp((local + 0.5 + (a.x - 0.5) * uFuzz * (1.0 + 6.0 * rim)) / uThreads, -0.03, 1.03);
  float pace = 0.85 + 0.3 * fract(thread * 0.6180339);
  float u = fract((slot + a.y) / uSamples + uTime * uFlow * 0.006 * pace);
  float steps = uClosed > 0.5 ? uRings : uRings - 1.0;
  float fu = u * steps;
  float i0 = floor(fu);
  float fr = fu - i0;
  int last = int(uRings) - 1;
  int j0 = uClosed > 0.5 ? int(mod(i0, uRings)) : min(int(i0), last);
  int j1 = uClosed > 0.5 ? int(mod(i0 + 1.0, uRings)) : min(int(i0) + 1, last);
  int row = int(layer) * 3;
  vec4 r0 = mix(texelFetch(uCurve, ivec2(j0, row), 0), texelFetch(uCurve, ivec2(j1, row), 0), fr);
  vec4 r1 = mix(texelFetch(uCurve, ivec2(j0, row + 1), 0), texelFetch(uCurve, ivec2(j1, row + 1), 0), fr);
  vec4 r2 = mix(texelFetch(uCurve, ivec2(j0, row + 2), 0), texelFetch(uCurve, ivec2(j1, row + 2), 0), fr);
  float span = max(r0.w, 1e-4);
  vec3 across = normalize(r1.xyz);
  vec3 up = normalize(r2.xyz);
  vec3 tangent = normalize(cross(across, up));
  float s = (v - 0.5) * span;
  float phi = s * r1.w / span;
  float bend = abs(phi) > 1e-3 ? sin(phi) / phi : 1.0;
  float lift = abs(phi) > 1e-3 ? (1.0 - cos(phi)) / phi : phi * 0.5;
  vec3 p0 = r0.xyz + across * s * bend + up * s * lift;
  vec3 dv = (cos(phi) * across + sin(phi) * up) * span * 0.012;
  vec3 du = tangent * max(r2.w, 1e-3) * 0.006;
  vec3 p = p0 + billow(p0);
  vec3 pu = p0 + du + billow(p0 + du);
  vec3 pv = p0 + dv + billow(p0 + dv);
  vec3 n = normalize(cross(pu - p, pv - p) + vec3(1e-7));
  float fade = smoothstep(-0.03, 0.18, v) * smoothstep(1.03, 0.82, v);
  if (uClosed < 0.5) fade *= smoothstep(0.0, 0.1, u) * smoothstep(1.0, 0.9, u);
  p += n * (b.x - 0.5) * 0.02 * uFuzz;
  p += n * uPuff * (0.06 + 0.22 * c.x) * (b.y > 0.5 ? 1.0 : -1.0) + (chance(43u) - 0.5) * uPuff * 0.22;
  float arrive = clamp(uIntro * 1.5 - c.x * 0.5, 0.0, 1.0);
  arrive = arrive * arrive * (3.0 - 2.0 * arrive);
  p += (chance(51u) * 2.0 - 1.0) * (1.0 - arrive) * 0.35;
  vec4 view = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * view;
  vec2 screen = clip.xy / max(clip.w, 1e-4);
  float stir = 0.0;
  for (int k = 0; k < ${STIRS}; k++) {
    vec2 d = (screen - uStir[k].xy) * vec2(uAspect, 1.0);
    stir += uStir[k].z * exp(-dot(d, d) / max(uStir[k].w * uStir[k].w, 1e-5));
  }
  stir = min(stir, 1.5);
  if (stir > 0.001) {
    vec3 loose = wander(vec3(c.yz * 31.0, uTime * 0.45)) + (chance(67u) - 0.5) * 0.8;
    view.xyz += loose * stir * uLoose * (0.4 + 0.6 * b.y);
    clip = projectionMatrix * view;
  }
  float range = max(-view.z, 0.2);
  float defocus = uBlur * abs(range - uFocus) * 4.0;
  gl_Position = clip;
  vec3 normal = normalize(normalMatrix * n);
  float facing = dot(normal, normalize(-view.xyz));
  float edgeOn = 1.0 - smoothstep(0.0, 0.5, abs(facing));
  gl_PointSize = clamp(uPoint * ${DISTANCE.toFixed(6)} / range * (1.0 + defocus) * (1.0 + 0.9 * edgeOn) * (0.85 + 0.3 * c.z), 1.0, 64.0);
  float front = smoothstep(-0.4, 0.4, facing);
  vec3 lightNormal = facing < 0.0 ? -normal : normal;
  float graze = 1.0 - abs(facing);
  float lit = 0.5 + 0.5 * dot(lightNormal, uLight);
  float along = 0.5 + 0.5 * sin(6.2831853 * u + uShift);
  float k = uLayers > 1.0 ? layer / (uLayers - 1.0) : 0.5;
  float t = 0.08 + 0.84 * mix(lit, along, uGradient) + (k - 0.5) * uLayerTone - uFaces * 0.32 * (1.0 - front) + uSheen * graze * graze * graze * 0.22 + (b.z - 0.5) * 0.03;
  vec4 tone = texture(uRamp, vec2(clamp(t * uToneScale, 0.0, 1.0) * ${((RAMP - 1) / RAMP).toFixed(6)} + ${(0.5 / RAMP).toFixed(6)}, 0.5));
  float alpha = uOpacity * tone.a * fade * (0.55 + 0.45 * a.z) * arrive * arrive * (1.0 - 0.8 * edgeOn) / ((1.0 + defocus) * (1.0 + defocus) * (1.0 + 0.9 * edgeOn)) / (1.0 + stir * 0.6);
  vTint = vec4(tone.rgb, alpha);
  vWeight = 1.0 / (1.0 + 3.0 * max(range - uFocus + 0.5, 0.0));
}
`;

const particleFragment = `
precision highp float;

uniform float uScale;

in vec4 vTint;
in float vWeight;

layout(location = 0) out vec4 fragColor;
layout(location = 1) out vec4 fragCover;

void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float a = vTint.a * exp(-3.2 * dot(q, q)) * uScale;
  fragColor = vec4(vTint.rgb * a * vWeight, a * vWeight);
  fragCover = vec4(a, 0.0, 0.0, a);
}
`;

const passVertex = `
out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const compositeFragment = `
precision highp float;

uniform sampler2D uAcc;
uniform sampler2D uCover;
uniform float uGain;
uniform float uScale;

in vec2 vUv;

out vec4 fragColor;

void main() {
  vec4 acc = texture(uAcc, vUv);
  float density = texture(uCover, vUv).r / uScale;
  vec3 color = clamp(acc.rgb / max(acc.a, 1e-6), 0.0, 1.0);
  float alpha = 1.0 - exp(-uGain * density);
  fragColor = vec4(color * alpha, alpha);
}
`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const finite = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);

const smooth = (from: number, to: number, value: number) => {
  const t = clamp((value - from) / (to - from), 0, 1);
  return t * t * (3 - 2 * t);
};

const toLinear = (value: number) => (value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4));

const toDisplay = (value: number) => {
  const v = clamp(value, 0, 1);
  return v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
};

const toLch = (color: Rgb): Rgb => {
  const r = toLinear(color[0]);
  const g = toLinear(color[1]);
  const b = toLinear(color[2]);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const greenRed = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const blueYellow = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [lightness, Math.hypot(greenRed, blueYellow), Math.atan2(blueYellow, greenRed)];
};

const fromLch = (color: Rgb): Rgb => {
  const greenRed = color[1] * Math.cos(color[2]);
  const blueYellow = color[1] * Math.sin(color[2]);
  const l = Math.pow(color[0] + 0.3963377774 * greenRed + 0.2158037573 * blueYellow, 3);
  const m = Math.pow(color[0] - 0.1055613458 * greenRed - 0.0638541728 * blueYellow, 3);
  const s = Math.pow(color[0] - 0.0894841775 * greenRed - 1.291485548 * blueYellow, 3);
  return [
    toDisplay(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toDisplay(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toDisplay(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
};

const blendLch = (from: Rgb, to: Rgb, amount: number): Rgb => {
  const fromHue = from[1] < 0.02 ? to[2] : from[2];
  const toHue = to[1] < 0.02 ? fromHue : to[2];
  let turn = toHue - fromHue;
  if (turn > Math.PI) turn -= TAU;
  if (turn < -Math.PI) turn += TAU;
  return [from[0] + (to[0] - from[0]) * amount, from[1] + (to[1] - from[1]) * amount, fromHue + turn * amount];
};

const isControl = (target: EventTarget | null) => {
  const element = target as Element | null;
  return (
    !!element &&
    typeof element.closest === "function" &&
    !!element.closest("a,button,input,textarea,select,label,summary,[role=button],[contenteditable=true]")
  );
};

const subscribeToMotion = (notify: () => void) => {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

const readMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const createMass = (root: HTMLDivElement, settingsRef: { current: Settings }): Controller | null => {
  const doc = root.ownerDocument;
  const view = doc.defaultView ?? window;
  const canvas = doc.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none";
  root.prepend(canvas);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
  } catch {
    canvas.remove();
    return null;
  }
  if (!renderer.capabilities.isWebGL2) {
    renderer.dispose();
    canvas.remove();
    return null;
  }
  renderer.autoClear = false;
  renderer.setClearColor(0x000000, 0);

  const floats = renderer.extensions.has("EXT_color_buffer_float") || renderer.extensions.has("EXT_color_buffer_half_float");
  const writeScale = floats ? 1 : 1 / 12;

  const probe = doc.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const colorCache = new Map<string, [number, number, number, number]>();

  const readColor = (value: string): [number, number, number, number] | null => {
    const cached = colorCache.get(value);
    if (cached) return cached;
    if (!probe || !value) return null;
    probe.fillStyle = "#010203";
    probe.fillStyle = value;
    if (String(probe.fillStyle) === "#010203" && value.trim().toLowerCase() !== "#010203") return null;
    probe.clearRect(0, 0, 1, 1);
    probe.fillRect(0, 0, 1, 1);
    const pixel = probe.getImageData(0, 0, 1, 1).data;
    const parsed: [number, number, number, number] = [pixel[0] / 255, pixel[1] / 255, pixel[2] / 255, pixel[3] / 255];
    if (colorCache.size > 32) colorCache.clear();
    colorCache.set(value, parsed);
    return parsed;
  };

  const readBackdrop = (): Rgb => {
    const own = readColor(settingsRef.current.backgroundColor);
    if (own && own[3] > 0.5) return [own[0], own[1], own[2]];
    let node: HTMLElement | null = root.parentElement;
    while (node) {
      const found = readColor(view.getComputedStyle(node).backgroundColor);
      if (found && found[3] > 0.5) return [found[0], found[1], found[2]];
      node = node.parentElement;
    }
    return [1, 1, 1];
  };

  const centres = new Float32Array(RINGS * 3);
  const guides = new Float32Array(RINGS * 3);
  const turns = new Float32Array(RINGS);
  const spans = new Float32Array(RINGS);
  const curls = new Float32Array(RINGS);
  const curveData = new Float32Array(RINGS * MAX_LAYERS * 3 * 4);
  const curve = new THREE.DataTexture(curveData, RINGS, MAX_LAYERS * 3, THREE.RGBAFormat, THREE.FloatType);
  curve.minFilter = THREE.NearestFilter;
  curve.magFilter = THREE.NearestFilter;

  const rampData = new Uint8Array(RAMP * 4);
  const ramp = new THREE.DataTexture(rampData, RAMP, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  ramp.minFilter = THREE.LinearFilter;
  ramp.magFilter = THREE.LinearFilter;
  let paletteKey = "";

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Int8Array(MAX_PARTICLES), 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);

  const slots: Stir[] = Array.from({ length: STIRS }, () => ({ x: 0, y: 0, fromX: 0, fromY: 0, target: 0, level: 0 }));
  const particleUniforms = {
    uCurve: { value: curve as THREE.Texture },
    uRamp: { value: ramp as THREE.Texture },
    uRings: { value: RINGS },
    uLayers: { value: 3 },
    uClosed: { value: 0 },
    uThreads: { value: 300 },
    uSamples: { value: 1000 },
    uTime: { value: 0 },
    uCurrent: { value: 0 },
    uFlow: { value: 1 },
    uBillow: { value: 1 },
    uFolds: { value: 1 },
    uFuzz: { value: 0.3 },
    uPoint: { value: 1.1 },
    uSeed: { value: 0 },
    uLight: { value: new THREE.Vector3(-0.4, 0.7, 0.6).normalize() },
    uGradient: { value: 0.4 },
    uLayerTone: { value: 0.2 },
    uToneScale: { value: 1 },
    uFaces: { value: 0.5 },
    uSheen: { value: 0.3 },
    uShift: { value: 0 },
    uOpacity: { value: 1 },
    uIntro: { value: 1 },
    uPuff: { value: 0 },
    uStir: { value: slots.map(() => new THREE.Vector4(0, 0, 0, 0.2)) },
    uLoose: { value: 0.3 },
    uAspect: { value: 1 },
    uFocus: { value: DISTANCE },
    uBlur: { value: 0.4 },
    uScale: { value: writeScale },
  };
  const particleMaterial = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: particleUniforms,
    vertexShader: particleVertex,
    fragmentShader: particleFragment,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneFactor,
  });
  const mass = new THREE.Points(geometry, particleMaterial);
  mass.frustumCulled = false;
  const massScene = new THREE.Scene();
  massScene.add(mass);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 50);
  camera.position.set(0, 0, DISTANCE);

  const compositeUniforms = {
    uAcc: { value: null as THREE.Texture | null },
    uCover: { value: null as THREE.Texture | null },
    uGain: { value: 3 },
    uScale: { value: writeScale },
  };
  const compositeMaterial = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: compositeUniforms,
    vertexShader: passVertex,
    fragmentShader: compositeFragment,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NoBlending,
  });
  const plane = new THREE.PlaneGeometry(2, 2);
  const quad = new THREE.Mesh(plane, compositeMaterial);
  quad.frustumCulled = false;
  const quadScene = new THREE.Scene();
  quadScene.add(quad);
  const flat = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  let accumulation: THREE.WebGLRenderTarget | null = null;
  const drawing = new THREE.Vector2();

  let destroyed = false;
  let lost = false;
  let visible = true;
  let raf = 0;
  let last = 0;
  let width = 1;
  let height = 1;
  let pixelRatio = 1;
  let governor = 1;
  let warmup = 40;
  let counted = 0;
  let slow = 0;
  let spent = 0;
  let before = 0;
  let adaptive = true;
  let clock = 0;
  let current = 0;
  let intro = settingsRef.current.intro && !settingsRef.current.reduced && !settingsRef.current.paused ? 0 : 1;
  let kick = 0;
  let puff = 0;
  let head = -1;
  let press: { id: number; x: number; y: number; t: number } | null = null;

  const rotation = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const tangent = new THREE.Vector3();
  const guide = new THREE.Vector3();
  const side = new THREE.Vector3();
  const lift = new THREE.Vector3();

  const now = () => view.performance.now() / 1000;

  const running = () => {
    const settings = settingsRef.current;
    return visible && !doc.hidden && !settings.paused && !settings.reduced;
  };

  const interactive = () => {
    const settings = settingsRef.current;
    return settings.interactive && !settings.reduced && !settings.paused && !destroyed && !lost;
  };

  const ratioFor = () =>
    Math.min(
      Math.min(view.devicePixelRatio || 1, 2) * clamp(finite(settingsRef.current.quality, 1), 0.25, 1) * governor,
      Math.sqrt(5e6 / Math.max(1, width * height)),
    );

  const budget = () => {
    const settings = settingsRef.current;
    const amount = 1.4 * width * height * clamp(finite(settings.particles, 1), 0.05, 3);
    return Math.round(clamp(amount * Math.sqrt(clamp(finite(settings.quality, 1), 0.25, 1)) * governor, 30000, MAX_PARTICLES));
  };

  const palette = (dark: boolean, low: number, high: number, sharp: number) => {
    const settings = settingsRef.current;
    const first = readColor(settings.colors?.[0] ?? DEFAULT_COLORS[0]) ?? [1, 0.62, 0.99, 1];
    const second = readColor(settings.colors?.[1] ?? DEFAULT_COLORS[1]) ?? [0.32, 0.15, 1, 1];
    const key = [first.join(","), second.join(","), dark ? 1 : 0, low.toFixed(3), high.toFixed(3), sharp.toFixed(3)].join("|");
    if (key === paletteKey) return;
    paletteKey = key;
    const body = toLch([first[0], first[1], first[2]]);
    const ink = toLch([second[0], second[1], second[2]]);
    const deep: Rgb = [ink[0] * 0.72, ink[1] * 0.95, ink[2]];
    const middle = blendLch(ink, body, 0.5);
    middle[1] = Math.max(middle[1], 0.85 * (ink[1] + body[1]) * 0.5);
    const pale: Rgb = dark ? [body[0] + (1 - body[0]) * 0.26, body[1] * 0.9, body[2]] : [body[0] + (1 - body[0]) * 0.72, body[1] * 0.45, body[2]];
    const paper: Rgb = dark ? [body[0] + (1 - body[0]) * 0.48, body[1] * 0.66, body[2]] : [body[0] + (1 - body[0]) * 0.93, body[1] * 0.12, body[2]];
    const w = 1 / sharp;
    const marks = [0, low - 0.12 * w, low + 0.06 * w, (low + high) / 2 + 0.06 * w, high + 0.06 * w, 1];
    for (let i = 1; i < marks.length - 1; i++) marks[i] = clamp(Math.max(marks[i], marks[i - 1] + 0.004), 0.004, 0.996);
    const tones = [deep, ink, middle, body, pale, paper];
    const alphas = dark ? [0.35, 0.8, 1, 1, 1, 1] : [1, 1, 1, 1, 0.8, 0.5];
    for (let i = 0; i < RAMP; i++) {
      const t = i / (RAMP - 1);
      let k = 0;
      while (k < marks.length - 2 && t > marks[k + 1]) k++;
      const f = marks[k + 1] > marks[k] ? smooth(marks[k], marks[k + 1], t) : 1;
      const color = fromLch(blendLch(tones[k], tones[k + 1], f));
      rampData[i * 4] = Math.round(color[0] * 255);
      rampData[i * 4 + 1] = Math.round(color[1] * 255);
      rampData[i * 4 + 2] = Math.round(color[2] * 255);
      rampData[i * 4 + 3] = Math.round((alphas[k] + (alphas[k + 1] - alphas[k]) * f) * 255);
    }
    ramp.needsUpdate = true;
  };

  const compose = (kind: GrainMassShape, layer: number, layers: number) => {
    const settings = settingsRef.current;
    const aspect = width / height;
    const t = clock;
    const k = layers > 1 ? layer / (layers - 1) : 0.5;
    const phase = layer * 2.39996 + 0.7 + clamp(finite(settings.seed, 0), 0, 9999) * 1.618;
    const spread = clamp(finite(settings.width, 1), 0.1, 3);
    const twist = clamp(finite(settings.twist, 1), 0, 3);
    const curl = clamp(finite(settings.curl, 1), 0, 3);
    const closed = STAGES[kind].closed;
    const ringTurns = Math.round(clamp(finite(settings.twist, 1), 0, 3));
    const lean = LOOP_TILT * RAD;
    for (let i = 0; i < RINGS; i++) {
      const u = closed ? i / RINGS : i / (RINGS - 1);
      let x = 0;
      let y = 0;
      let z = 0;
      let gx = 0;
      let gy = 1;
      let gz = 0;
      let theta = 0;
      let span = 0.5;
      let bend = 0;
      if (kind === "sweep") {
        x = (u - 0.5) * 2.9 * Math.max(aspect, 0.8);
        y = (k - 0.5) * 0.62 - 0.12 + 0.3 * Math.sin(Math.PI * (u - 0.5) * 1.2 + phase * 0.5 + 0.35 * Math.sin(t * 0.09 + phase)) - 0.24 * (u - 0.5);
        z = (0.5 - k) * 0.8 + 0.3 * Math.sin(Math.PI * u * 1.4 + phase + t * 0.06);
        theta = twist * (0.8 * Math.sin(Math.PI * u * 1.3 + phase + t * 0.08) + 0.25);
        span = spread * (0.98 - 0.08 * layer) * (0.82 + 0.18 * Math.sin(Math.PI * u * 1.7 + phase));
        bend = curl * 0.55 * Math.sin(Math.PI * u * 1.2 + phase * 1.3 + t * 0.07);
      } else if (kind === "veil") {
        x = (k - 0.5) * 1.55 * aspect + 0.2 * Math.sin(Math.PI * u * 1.2 + phase + t * 0.1);
        y = (0.5 - u) * 2.9;
        z = (layer % 2 ? 0.3 : -0.3) + 0.28 * Math.sin(Math.PI * u * 1.6 + phase + t * 0.07);
        gx = 1;
        gy = 0;
        theta = twist * 0.85 * Math.sin(Math.PI * u * 1.1 + phase + t * 0.08);
        span = spread * 0.56 * aspect * (0.85 + 0.15 * Math.sin(Math.PI * u * 2 + phase));
        bend = curl * 0.45 * Math.sin(Math.PI * u + phase + t * 0.06);
      } else if (kind === "dune") {
        x = (u - 0.5) * 2.9 * Math.max(aspect, 0.8);
        y = (k - 0.5) * 1.6 + 0.12 * Math.sin(Math.PI * u * 1.8 + phase + t * 0.08);
        z = -0.1 + 0.24 * Math.sin(Math.PI * u * 1.3 + phase * 1.7 + t * 0.05);
        theta = twist * 0.35 * Math.sin(Math.PI * u * 1.5 + phase + t * 0.07) - 0.75;
        span = spread * 0.62 * (0.85 + 0.15 * Math.sin(Math.PI * u * 2.3 + phase));
        bend = curl * 0.35 * Math.sin(Math.PI * u * 1.4 + phase + t * 0.05);
      } else if (kind === "plume") {
        const lane = (k - 0.5) * 0.5 * aspect;
        x = aspect * (-0.95 + 1.75 * u) + lane + 0.2 * Math.sin(Math.PI * u * 1.6 + phase + t * 0.09);
        y = -1.5 + 3.1 * u - 0.25 * u * u + 0.12 * Math.sin(Math.PI * u * 2.2 + phase + t * 0.07);
        z = 0.28 * Math.sin(Math.PI * u * 1.2 + phase + t * 0.06) + (k - 0.5) * 0.4;
        gx = -0.8;
        gy = 0.6;
        theta = twist * (1.3 * u + 0.35 * Math.sin(t * 0.08 + phase));
        span = spread * (0.45 + 0.75 * Math.sin(Math.PI * Math.min(1, u * 1.15))) * (0.9 + 0.1 * Math.sin(Math.PI * u * 3 + phase));
        bend = curl * 0.6 * Math.sin(Math.PI * u + phase);
      } else {
        const a = u * TAU;
        const shrink = 1 - 0.12 * layer;
        const r =
          (1 +
            0.07 * Math.sin(2 * a + 0.7 + phase) * (0.7 + 0.3 * Math.sin(t * 0.23)) +
            0.045 * Math.sin(3 * a + 2.1) * (0.6 + 0.4 * Math.sin(t * 0.17 + 1.4))) *
          shrink;
        const lx = 1.25 * Math.cos(a) * r;
        const ly = 1.0 * Math.sin(a) * r;
        const lz = 0.15 * Math.sin(2 * a + 1.3 + phase) * (0.65 + 0.35 * Math.sin(t * 0.19 + 0.6)) + (k - 0.5) * 0.3;
        x = lx;
        y = ly * Math.cos(lean) + lz * Math.sin(lean);
        z = -ly * Math.sin(lean) + lz * Math.cos(lean);
        gx = 0;
        gy = Math.sin(lean);
        gz = Math.cos(lean);
        theta = ringTurns * a + t * 0.25 + phase;
        const flank = Math.sin(a);
        span = spread * 0.95 * (0.62 + 0.38 * flank * flank) * shrink;
        bend = curl * 2.2;
      }
      centres[i * 3] = x;
      centres[i * 3 + 1] = y;
      centres[i * 3 + 2] = z;
      guides[i * 3] = gx;
      guides[i * 3 + 1] = gy;
      guides[i * 3 + 2] = gz;
      turns[i] = theta;
      spans[i] = Math.max(span, 0.005);
      curls[i] = bend;
    }
    const steps = closed ? RINGS : RINGS - 1;
    const rowBase = layer * 3 * RINGS * 4;
    const stride = RINGS * 4;
    for (let i = 0; i < RINGS; i++) {
      const next = closed ? (i + 1) % RINGS : Math.min(i + 1, RINGS - 1);
      const prev = closed ? (i + RINGS - 1) % RINGS : Math.max(i - 1, 0);
      tangent.set(
        centres[next * 3] - centres[prev * 3],
        centres[next * 3 + 1] - centres[prev * 3 + 1],
        centres[next * 3 + 2] - centres[prev * 3 + 2],
      );
      const run = tangent.length();
      const gap = (next - prev + (closed && next < prev ? RINGS : 0)) / steps;
      if (run < 1e-9) tangent.set(1, 0, 0);
      else tangent.multiplyScalar(1 / run);
      guide.set(guides[i * 3], guides[i * 3 + 1], guides[i * 3 + 2]);
      guide.addScaledVector(tangent, -guide.dot(tangent));
      if (guide.lengthSq() < 1e-8) guide.set(0, 0, 1).addScaledVector(tangent, -tangent.z);
      guide.normalize();
      side.crossVectors(tangent, guide);
      const ct = Math.cos(turns[i]);
      const st = Math.sin(turns[i]);
      const ax = guide.x * ct + side.x * st;
      const ay = guide.y * ct + side.y * st;
      const az = guide.z * ct + side.z * st;
      lift.set(ax, ay, az);
      lift.crossVectors(tangent, lift);
      const at = rowBase + i * 4;
      curveData[at] = centres[i * 3];
      curveData[at + 1] = centres[i * 3 + 1];
      curveData[at + 2] = centres[i * 3 + 2];
      curveData[at + 3] = spans[i];
      curveData[at + stride] = ax;
      curveData[at + stride + 1] = ay;
      curveData[at + stride + 2] = az;
      curveData[at + stride + 3] = curls[i];
      curveData[at + stride * 2] = lift.x;
      curveData[at + stride * 2 + 1] = lift.y;
      curveData[at + stride * 2 + 2] = lift.z;
      curveData[at + stride * 2 + 3] = gap > 0 ? run / gap : 1;
    }
  };

  const trace = () => {
    const settings = settingsRef.current;
    const kind: GrainMassShape = STAGES[settings.shape] ? settings.shape : "sweep";
    const stage = STAGES[kind];
    const layers = clamp(Math.round(finite(settings.layers, 0)) || stage.layers, 1, MAX_LAYERS);
    for (let layer = 0; layer < layers; layer++) compose(kind, layer, layers);
    curve.needsUpdate = true;
    particleUniforms.uLayers.value = layers;
    particleUniforms.uClosed.value = stage.closed ? 1 : 0;
    const aspect = width / height;
    const scaleValue = clamp(finite(settings.size, 1), 0.1, 4);
    const fit = scaleValue * (stage.centred ? Math.min(aspect / stage.extentX, 1 / stage.extentY) : 1);
    const sway = clamp(finite(settings.sway, 1), 0, 6);
    euler.set(
      (finite(settings.tilt, 0) + sway * 2.5 * Math.sin(clock * 0.21)) * RAD,
      (finite(settings.turn, 0) + sway * 3.5 * Math.sin(clock * 0.17)) * RAD,
      (finite(settings.angle, 0) + sway * 1.5 * Math.sin(clock * 0.13)) * RAD,
      "ZXY",
    );
    rotation.setFromEuler(euler);
    mass.quaternion.copy(rotation);
    mass.scale.setScalar(fit);
    mass.position.set(clamp(finite(settings.centerX, 0), -2, 2) * aspect, -clamp(finite(settings.centerY, 0), -2, 2), 0);
    mass.updateMatrixWorld(true);
    return layers;
  };

  const render = () => {
    if (destroyed || lost || !accumulation) return;
    const settings = settingsRef.current;
    const backdrop = readBackdrop();
    const dark = 0.2126 * toLinear(backdrop[0]) + 0.7152 * toLinear(backdrop[1]) + 0.0722 * toLinear(backdrop[2]) < 0.35;
    const low = 0.2 + 0.4 * clamp(finite(settings.shade, 0.6), 0, 1);
    const high = Math.max(low + 0.1, 0.9 - 0.5 * clamp(finite(settings.highlight, 0.2), 0, 1));
    palette(dark, low, high, clamp(finite(settings.contrast, 1), 0.2, 4));
    const layers = trace();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const count = budget();
    const threads = Math.round(clamp(Math.sqrt(count / layers / clamp(finite(settings.strands, 14), 1, 40)), 40, 1200));
    const samples = Math.max(64, Math.floor(count / (threads * layers)));
    particleUniforms.uThreads.value = threads;
    particleUniforms.uSamples.value = samples;
    particleUniforms.uTime.value = clock;
    particleUniforms.uCurrent.value = current;
    particleUniforms.uFlow.value = finite(settings.flow, 1);
    particleUniforms.uBillow.value = clamp(finite(settings.billow, 1), 0, 4) * STAGES[STAGES[settings.shape] ? settings.shape : "sweep"].billow;
    particleUniforms.uFolds.value = clamp(finite(settings.folds, 1), 0.2, 4);
    particleUniforms.uFuzz.value = clamp(finite(settings.fuzz, 0.3), 0, 3);
    particleUniforms.uPoint.value = clamp(finite(settings.grainSize, 1.1), 0.5, 8) * pixelRatio;
    particleUniforms.uSeed.value = Math.round(clamp(finite(settings.seed, 0), 0, 9999));
    particleUniforms.uLight.value
      .set(clamp(finite(settings.lightX, -0.4), -1, 1), clamp(finite(settings.lightY, 0.7), -1, 1), 0.6)
      .normalize();
    particleUniforms.uGradient.value = clamp(finite(settings.gradient, 0.4), 0, 1);
    particleUniforms.uLayerTone.value = clamp(finite(settings.depth, 0.2), 0, 1);
    particleUniforms.uToneScale.value = dark ? 0.84 : 1;
    particleUniforms.uFaces.value = clamp(finite(settings.faces, 0.5), 0, 1.5);
    particleUniforms.uSheen.value = clamp(finite(settings.sheen, 0.3), 0, 2);
    particleUniforms.uShift.value = clock * 0.05;
    particleUniforms.uOpacity.value = clamp(finite(settings.opacity, 1), 0, 3) * (dark ? 0.84 : 1.12);
    particleUniforms.uIntro.value = intro;
    particleUniforms.uPuff.value = puff;
    particleUniforms.uLoose.value = clamp(finite(settings.stir, 1), 0, 3) * 0.3;
    particleUniforms.uAspect.value = width / height;
    particleUniforms.uBlur.value = clamp(finite(settings.blur, 0.4), 0, 2);
    slots.forEach((slot, index) => particleUniforms.uStir.value[index].set(slot.x, slot.y, slot.level, 0.2));
    geometry.setDrawRange(0, threads * layers * samples);
    renderer.setRenderTarget(accumulation);
    renderer.clear();
    renderer.render(massScene, camera);
    compositeUniforms.uAcc.value = accumulation.textures[0];
    compositeUniforms.uCover.value = accumulation.textures[1];
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(quadScene, flat);
  };

  const settle = (dt: number) => {
    kick *= Math.exp(-dt / 0.45);
    puff += (kick - puff) * (1 - Math.exp(-dt / 0.16));
    const fade = Math.exp(-dt / 0.75);
    const follow = 1 - Math.exp(-dt / 0.12);
    for (const slot of slots) {
      slot.target *= fade;
      slot.level += (slot.target - slot.level) * follow;
    }
  };

  const advance = (dt: number) => {
    const settings = settingsRef.current;
    const pace = clamp(finite(settings.speed, 1), -8, 8);
    clock += dt * pace;
    current += dt * pace * clamp(finite(settings.drift, 1), 0, 6);
    if (intro < 1) intro = Math.min(1, intro + dt / INTRO_SECONDS);
  };

  const busy = () => puff > 0.002 || kick > 0.002 || slots.some((slot) => slot.level > 0.002 || slot.target > 0.002);

  function tick(time: number) {
    raf = 0;
    if (destroyed || lost) return;
    const pause = last ? Math.max(0, (time - last) / 1000) : 0;
    const dt = last ? Math.min(0.05, pause) : 1 / 60;
    last = time;
    const settings = settingsRef.current;
    if (!settings.paused && !settings.reduced) advance(dt);
    settle(dt);
    let rescale = false;
    if (warmup > 0) {
      warmup--;
    } else if (pause > 0 && adaptive) {
      counted++;
      spent += pause;
      if (pause > 0.024) slow++;
    }
    if (counted >= 60) {
      const average = spent / counted;
      const heavy = slow > 36;
      counted = 0;
      slow = 0;
      spent = 0;
      if (before > 0 && average > before * 0.9) {
        governor = Math.min(1, governor / 0.8);
        adaptive = false;
        rescale = true;
      } else if (heavy && governor > 0.45) {
        before = average;
        governor = Math.max(0.45, governor * 0.8);
        rescale = true;
      } else {
        before = 0;
      }
    }
    if (rescale) resize();
    else render();
    if ((running() || busy()) && !raf) raf = view.requestAnimationFrame(tick);
  }

  function wake() {
    if (destroyed || lost || raf) return;
    if (!running() && !busy()) return;
    last = 0;
    raf = view.requestAnimationFrame(tick);
  }

  const resize = () => {
    if (destroyed) return;
    const rect = root.getBoundingClientRect();
    width = Math.max(1, root.clientWidth || rect.width);
    height = Math.max(1, root.clientHeight || rect.height);
    pixelRatio = ratioFor();
    warmup = 24;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    renderer.getDrawingBufferSize(drawing);
    const w = Math.max(1, Math.floor(drawing.x));
    const h = Math.max(1, Math.floor(drawing.y));
    if (!accumulation) {
      accumulation = new THREE.WebGLRenderTarget(w, h, {
        count: 2,
        type: floats ? THREE.HalfFloatType : THREE.UnsignedByteType,
        format: THREE.RGBAFormat,
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        depthBuffer: false,
        stencilBuffer: false,
        generateMipmaps: false,
      });
    } else {
      accumulation.setSize(w, h);
    }
    render();
    wake();
  };

  const claim = (x: number, y: number, boost: number) => {
    let quiet = -1;
    slots.forEach((slot, index) => {
      if (index === head || slot.level > 0.04 || slot.target > 0.04) return;
      if (quiet < 0 || slot.level + slot.target < slots[quiet].level + slots[quiet].target) quiet = index;
    });
    if (quiet < 0) return false;
    head = quiet;
    const fresh = slots[quiet];
    fresh.x = x;
    fresh.y = y;
    fresh.fromX = x;
    fresh.fromY = y;
    fresh.target = Math.max(fresh.target, 0.15 * boost);
    return true;
  };

  const stirAt = (clientX: number, clientY: number, boost: number) => {
    const rect = root.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 || !interactive()) return;
    const x = clamp(((clientX - rect.left) / rect.width) * 2 - 1, -1.2, 1.2);
    const y = clamp(1 - ((clientY - rect.top) / rect.height) * 2, -1.2, 1.2);
    const aspect = rect.width / rect.height;
    const active = head >= 0 ? slots[head] : null;
    if (active) {
      const moved = Math.hypot((x - active.x) * aspect, y - active.y);
      active.x = x;
      active.y = y;
      active.target = Math.min(1, active.target + moved * 2.4 * boost);
      if (Math.hypot((x - active.fromX) * aspect, y - active.fromY) > 0.14) claim(x, y, boost);
    } else {
      claim(x, y, boost);
    }
    wake();
  };

  const breatheOut = (amount: number) => {
    if (amount <= 0) return;
    kick = Math.min(2, kick + amount);
    wake();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    stirAt(event.clientX, event.clientY, 1);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === "touch" || event.button !== 0 || isControl(event.target) || !interactive()) return;
    breatheOut(clamp(finite(settingsRef.current.scatter, 1), 0, 3));
  };

  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== "touch") head = -1;
  };

  const onTouchStart = (event: TouchEvent) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    press = { id: touch.identifier, x: touch.clientX, y: touch.clientY, t: now() };
    head = -1;
    stirAt(touch.clientX, touch.clientY, 1);
  };

  const onTouchMove = (event: TouchEvent) => {
    const touch = Array.from(event.touches).find((item) => !press || item.identifier === press.id) ?? event.touches[0];
    if (touch) stirAt(touch.clientX, touch.clientY, 1.2);
  };

  const onTouchEnd = (event: TouchEvent) => {
    const tap = press;
    press = null;
    head = -1;
    if (!tap || isControl(event.target) || !interactive()) return;
    const touch = Array.from(event.changedTouches).find((item) => item.identifier === tap.id);
    if (!touch) return;
    if (Math.hypot(touch.clientX - tap.x, touch.clientY - tap.y) > 10 || now() - tap.t > 0.5) return;
    breatheOut(clamp(finite(settingsRef.current.scatter, 1), 0, 3));
  };

  const onTouchCancel = () => {
    press = null;
    head = -1;
  };

  const onVisibility = () => {
    last = 0;
    if (!doc.hidden) wake();
  };

  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    view.cancelAnimationFrame(raf);
    raf = 0;
  };

  const onRestored = () => {
    lost = false;
    paletteKey = "";
    accumulation?.dispose();
    accumulation = null;
    curve.needsUpdate = true;
    resize();
  };

  const onTheme = () => {
    if (destroyed || lost) return;
    if (!raf) render();
  };

  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerdown", onPointerDown);
  root.addEventListener("pointerleave", onPointerLeave);
  root.addEventListener("touchstart", onTouchStart, { passive: true });
  root.addEventListener("touchmove", onTouchMove, { passive: true });
  root.addEventListener("touchend", onTouchEnd, { passive: true });
  root.addEventListener("touchcancel", onTouchCancel, { passive: true });
  doc.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);
  const intersection = new IntersectionObserver(
    (entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      last = 0;
      if (visible) wake();
    },
    { rootMargin: "80px" },
  );
  intersection.observe(root);
  const themes = new MutationObserver(onTheme);
  themes.observe(doc.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
  resize();

  return {
    sync: () => {
      if (destroyed || lost) return;
      if (Math.abs(ratioFor() - pixelRatio) > 1e-3) {
        resize();
        return;
      }
      if (!raf) render();
      wake();
    },
    scatter: (strength = 1) => {
      if (destroyed || lost) return;
      breatheOut(clamp(finite(strength, 1), 0, 3));
    },
    destroy: () => {
      destroyed = true;
      view.cancelAnimationFrame(raf);
      raf = 0;
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointerleave", onPointerLeave);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
      root.removeEventListener("touchcancel", onTouchCancel);
      doc.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      resizeObserver.disconnect();
      intersection.disconnect();
      themes.disconnect();
      accumulation?.dispose();
      curve.dispose();
      ramp.dispose();
      geometry.dispose();
      plane.dispose();
      [particleMaterial, compositeMaterial].forEach((item) => item.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
};

const GrainMass = forwardRef<GrainMassHandle, GrainMassProps>(function GrainMass(
  {
    colors = DEFAULT_COLORS,
    backgroundColor = "transparent",
    shape = "sweep",
    layers = 0,
    particles = 1,
    strands = 14,
    grainSize = 1.1,
    fuzz = 0.3,
    opacity = 1,
    size = 1,
    width = 1,
    curl = 1,
    twist = 1,
    billow = 1,
    folds = 1,
    tilt = 0,
    turn = 0,
    angle = 0,
    centerX = 0,
    centerY = 0,
    speed = 1,
    flow = 1,
    drift = 1,
    sway = 1,
    lightX = -0.4,
    lightY = 0.7,
    gradient = 0.4,
    depth = 0.2,
    faces = 0.5,
    sheen = 0.3,
    shade = 0.6,
    highlight = 0.2,
    contrast = 1,
    blur = 0.4,
    intro = true,
    interactive = true,
    stir = 1,
    scatter = 1,
    seed = 0,
    paused = false,
    quality = 1,
    className,
    style,
    children,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<Controller | null>(null);
  const reduced = useSyncExternalStore(subscribeToMotion, readMotion, () => false);
  const settings: Settings = {
    colors,
    backgroundColor,
    shape,
    layers,
    particles,
    strands,
    grainSize,
    fuzz,
    opacity,
    size,
    width,
    curl,
    twist,
    billow,
    folds,
    tilt,
    turn,
    angle,
    centerX,
    centerY,
    speed,
    flow,
    drift,
    sway,
    lightX,
    lightY,
    gradient,
    depth,
    faces,
    sheen,
    shade,
    highlight,
    contrast,
    blur,
    intro,
    interactive,
    stir,
    scatter,
    seed,
    paused,
    quality,
    reduced,
  };
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
    controllerRef.current?.sync();
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const controller = createMass(root, settingsRef);
    controllerRef.current = controller;
    return () => {
      controller?.destroy();
      controllerRef.current = null;
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      scatter: (strength?: number) => controllerRef.current?.scatter(strength),
    }),
    [],
  );

  return (
    <div
      ref={rootRef}
      className={cn("relative isolate h-full min-h-[240px] w-full overflow-hidden", className)}
      style={{ backgroundColor, ...style }}
    >
      {children && <div className="relative z-10 h-full w-full">{children}</div>}
    </div>
  );
});

GrainMass.displayName = "GrainMass";

export { GrainMass };
export default GrainMass;
