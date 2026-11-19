"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export interface AlbumRailItem {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  href?: string;
}

export interface AlbumRailProps {
  items?: AlbumRailItem[];
  startIndex?: number;
  aspect?: number;
  size?: number;
  spread?: number;
  stack?: number;
  fan?: number;
  turn?: number;
  depth?: number;
  visible?: number;
  radius?: number;
  dim?: number;
  shadow?: number;
  vinyl?: boolean;
  vinylColor?: string;
  accentColor?: string;
  rpm?: number;
  autoplay?: boolean;
  interval?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  draggable?: boolean;
  wheel?: boolean;
  captions?: boolean;
  controls?: boolean;
  backgroundColor?: string;
  paused?: boolean;
  dpr?: number;
  ariaLabel?: string;
  onIndexChange?: (index: number) => void;
  onSelect?: (item: AlbumRailItem, index: number) => void;
  onPlayChange?: (index: number, playing: boolean) => void;
  className?: string;
  style?: CSSProperties;
}

export interface AlbumRailHandle {
  next: () => void;
  previous: () => void;
  goTo: (index: number) => void;
  play: () => void;
  stop: () => void;
}

type Settings = Required<
  Omit<
    AlbumRailProps,
    | "className"
    | "style"
    | "onIndexChange"
    | "onSelect"
    | "onPlayChange"
    | "ariaLabel"
    | "startIndex"
    | "items"
  >
> & {
  reduced: boolean;
};

interface Controller {
  sync: () => void;
  step: (direction: number) => void;
  goTo: (index: number) => void;
  setPlaying: (playing: boolean) => void;
  destroy: () => void;
}

interface Callbacks {
  onActive: (index: number) => void;
  onSelect: (index: number) => void;
  onPlay: (index: number, playing: boolean) => void;
}

interface Overlay {
  caption: HTMLElement;
  title: HTMLElement;
  artist: HTMLElement;
  deck: HTMLElement;
  ruler: HTMLElement;
}

interface Picture {
  image: HTMLImageElement;
  texture: THREE.Texture;
  aspect: number;
  ready: boolean;
  uploaded: boolean;
  fade: number;
  tone: [number, number, number] | null;
}

interface Card {
  mesh: THREE.Mesh<THREE.ShapeGeometry, THREE.ShaderMaterial>;
  shade: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  index: number;
  order: number;
}

const SLOTS = 13;
const LABEL_GAP = 28;
const LABEL_HEIGHT = 42;
const CONTROL_GAP = 28;
const CONTROL_HEIGHT = 38;
const TICKS = 29;
const TICK_GAP = 18;
const NEEDLE_CLEAR = 27;
const TAU = Math.PI * 2;

const defaultItems: AlbumRailItem[] = [
  {
    src: "https://pro.reactbits.dev/demo-media/architecture-stair.webp",
    alt: "Sunlit stair cover: cream stair rising along a sunlit courtyard wall under a slice of blue sky",
    title: "Sunlit stair",
    subtitle: "Quiet Coast",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/architecture-pool.webp",
    alt: "Reflecting pool cover: figure in black crossing a shallow pool before a tall cream wall",
    title: "Reflecting pool",
    subtitle: "Iona Vale",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/architecture-courtyard.webp",
    alt: "Courtyard cover: two round pines beside a white stone wall in soft, hazy light",
    title: "Courtyard",
    subtitle: "Low Meridian",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/architecture-monolith.webp",
    alt: "Monolith cover: stepped board-formed concrete towers against a pale teal sky",
    title: "Monolith",
    subtitle: "Static Gardens",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/architecture-ribbons.webp",
    alt: "Ribbons cover: white facade ribbons flowing in parallel waves",
    title: "Ribbons",
    subtitle: "Mira Sol",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/architecture-whitewash.webp",
    alt: "Whitewash cover: whitewashed plaster block against a soft cloudy sky",
    title: "Whitewash",
    subtitle: "The Slow Hours",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/architecture-twist.webp",
    alt: "Twist cover: white balconies twisting in an S-curve down a tiled facade against pale sky",
    title: "Twist",
    subtitle: "Hollow North",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/architecture-wave.webp",
    alt: "Wave cover: navy and white striped towers curving together around a patch of blue sky",
    title: "Wave",
    subtitle: "June Atlas",
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smooth = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const subscribeToMotion = (notify: () => void) => {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

const readMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const parseColor = (value: string) => {
  const hex = value.trim().replace("#", "");
  if (!/^[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(hex)) return null;
  const full = hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex;
  return [0, 2, 4].map((offset) => Number.parseInt(full.slice(offset, offset + 2), 16) / 255);
};

const isLight = (value: string) => {
  const rgb = parseColor(value);
  if (!rgb) return false;
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2] > 0.6;
};

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

const toOklab = (r: number, g: number, b: number): [number, number, number] => {
  const lr = toLinear(r);
  const lg = toLinear(g);
  const lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};

const fromOklab = (L: number, a: number, b: number) => {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};

const sampleTone = (image: HTMLImageElement, canvas: HTMLCanvasElement): [number, number, number] | null => {
  const size = 28;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  let data: Uint8ClampedArray;
  try {
    context.drawImage(image, 0, 0, size, size);
    data = context.getImageData(0, 0, size, size).data;
  } catch {
    return null;
  }
  const bins = new Float64Array(36);
  const samples: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const [L, a, b] = toOklab(data[i] / 255, data[i + 1] / 255, data[i + 2] / 255);
    const chroma = Math.hypot(a, b);
    if (chroma < 0.04) continue;
    const weight = Math.pow(chroma, 1.5) * Math.max(0, 1 - Math.abs(L - 0.62) * 1.5);
    if (weight <= 0) continue;
    const hue = Math.atan2(b, a);
    const bin = Math.floor((((hue / TAU) % 1) + 1) % 1 * 36) % 36;
    bins[bin] += weight;
    samples.push(L, a, b, hue, weight);
  }
  if (!samples.length) return null;
  let peak = 0;
  let best = -1;
  for (let k = 0; k < 36; k++) {
    const score = bins[(k + 35) % 36] + 2 * bins[k] + bins[(k + 1) % 36];
    if (score > best) {
      best = score;
      peak = k;
    }
  }
  const centre = ((peak + 0.5) / 36) * TAU;
  let total = 0;
  let sumL = 0;
  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < samples.length; i += 5) {
    const apart = Math.atan2(Math.sin(samples[i + 3] - centre), Math.cos(samples[i + 3] - centre));
    if (Math.abs(apart) > 0.32) continue;
    const weight = samples[i + 4];
    total += weight;
    sumL += samples[i] * weight;
    sumA += samples[i + 1] * weight;
    sumB += samples[i + 2] * weight;
  }
  return total > 0 ? [sumL / total, sumA / total, sumB / total] : null;
};

const fallbackTone = toOklab(0x8b / 255, 0x5c / 255, 0xf6 / 255);

const toneColor = (tone: [number, number, number] | null, light: boolean) => {
  const [L0, a0, b0] = tone ?? fallbackTone;
  let hue = Math.atan2(b0, a0);
  const yellow = light ? Math.max(0, 1 - Math.abs(hue - 1.75) / 0.35) : 0;
  const lime = light ? Math.max(0, 1 - Math.abs(hue - 2.23) / 0.28) : 0;
  hue += (1.33 - hue) * yellow + (2.62 - hue) * lime;
  const L = light ? clamp(L0, 0.42, 0.56 + 0.08 * yellow) : clamp(L0, 0.74, 0.86);
  let chroma = clamp(Math.hypot(a0, b0) * 1.5, tone ? 0.1 : 0, 0.21);
  let rgb = fromOklab(L, chroma * Math.cos(hue), chroma * Math.sin(hue));
  for (let i = 0; i < 16 && rgb.some((c) => c < -0.001 || c > 1.001); i++) {
    chroma *= 0.88;
    rgb = fromOklab(L, chroma * Math.cos(hue), chroma * Math.sin(hue));
  }
  return `#${rgb
    .map((c) => Math.round(clamp(toGamma(clamp(c, 0, 1)), 0, 1) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
};

const springTo = (
  value: number,
  velocity: number,
  target: number,
  dt: number,
  response: number,
  ratio: number,
) => {
  const omega = TAU / Math.max(response, 0.02);
  const substeps = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = dt / substeps;
  let v = velocity;
  let x = value;
  for (let i = 0; i < substeps; i++) {
    v += (omega * omega * (target - x) - 2 * ratio * omega * v) * h;
    x += v * h;
  }
  return [x, v] as const;
};

const hiddenStyle: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

const stageStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  touchAction: "pan-y",
  userSelect: "none",
  WebkitUserSelect: "none",
  WebkitTouchCallout: "none",
};

const raised = "color-mix(in oklch, currentColor 10%, transparent)";
const tone = "var(--album-rail-tone, #8B5CF6)";

const toneFill = (amount: number) => `color-mix(in oklch, ${tone} ${amount}%, transparent)`;

const captionStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  padding: "0 16px",
  textAlign: "center",
  pointerEvents: "none",
  opacity: 0,
  willChange: "transform, opacity",
};

const titleStyle: CSSProperties = {
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: 16,
  fontWeight: 600,
  lineHeight: 1.25,
  letterSpacing: "-0.012em",
};

const artistStyle: CSSProperties = {
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: 13,
  lineHeight: 1.4,
  opacity: 0.55,
};

const deckStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  top: -100,
  height: 38,
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  padding: "0 16px",
  pointerEvents: "none",
};

const rulerFrameStyle: CSSProperties = {
  position: "relative",
  width: "min(296px, calc(100% - 80px))",
  height: 38,
  flex: "0 1 auto",
};

const rulerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  cursor: "ew-resize",
  touchAction: "none",
  pointerEvents: "auto",
  WebkitMaskImage: "linear-gradient(90deg, transparent, #000 20%, #000 80%, transparent)",
  maskImage: "linear-gradient(90deg, transparent, #000 20%, #000 80%, transparent)",
};

const needleStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: 0,
  width: 38,
  height: 38,
  marginLeft: -19,
  display: "grid",
  placeItems: "center",
  padding: 0,
  border: 0,
  borderRadius: 999,
  color: tone,
  cursor: "pointer",
  pointerEvents: "auto",
  transition: "background-color 420ms ease, color 420ms ease",
};

const iconStyle: CSSProperties = {
  gridArea: "1 / 1",
  transition: "opacity 200ms ease, transform 260ms cubic-bezier(0.22, 1, 0.36, 1)",
};

const markerStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  top: 10,
  width: 2,
  height: 18,
  marginLeft: -1,
  borderRadius: 2,
  background: tone,
  pointerEvents: "none",
  transition: "background-color 420ms ease",
};

const chevronStyle: CSSProperties = {
  width: 28,
  height: 28,
  flex: "0 0 auto",
  display: "grid",
  placeItems: "center",
  padding: 0,
  border: 0,
  borderRadius: 999,
  background: "transparent",
  color: "inherit",
  opacity: 0.55,
  cursor: "pointer",
  pointerEvents: "auto",
  transition: "opacity 160ms ease, background-color 160ms ease",
};

const cardVertex = `
uniform vec2 uSize;
varying vec2 vUv;

void main() {
  vUv = position.xy / uSize + 0.5;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const cardFragment = `
precision highp float;

uniform sampler2D uImage;
uniform float uImageAspect;
uniform vec2 uSize;
uniform float uLoaded;
uniform float uDim;
uniform vec3 uBackground;
uniform vec3 uPlaceholder;
varying vec2 vUv;

void main() {
  float cardAspect = uSize.x / uSize.y;
  vec2 uv = vUv - 0.5;
  if (cardAspect > uImageAspect) {
    uv.y *= uImageAspect / cardAspect;
  } else {
    uv.x *= cardAspect / uImageAspect;
  }
  uv += 0.5;
  vec3 color = texture2D(uImage, uv).rgb;
  color = mix(uPlaceholder, color, clamp(uLoaded, 0.0, 1.0));
  color = mix(color, uBackground, clamp(uDim, 0.0, 1.0));
  gl_FragColor = vec4(color, 1.0);
}
`;

const shadeVertex = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const shadeFragment = `
precision highp float;

uniform vec2 uSize;
uniform vec2 uBox;
uniform float uRadius;
uniform float uBlur;
uniform float uStrength;
uniform float uRound;
varying vec2 vUv;

float roundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 p = (vUv - 0.5) * uSize;
  float d = uRound > 0.5 ? length(p) - uBox.x : roundBox(p, uBox, uRadius);
  float a = 1.0 - smoothstep(-uBlur, uBlur, d);
  a *= a;
  float alpha = a * uStrength;
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
}
`;

const discVertex = `
varying vec2 vPos;

void main() {
  vPos = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const discFragment = `
precision highp float;

uniform sampler2D uImage;
uniform float uImageAspect;
uniform float uLoaded;
uniform float uSpin;
uniform vec3 uVinyl;
uniform vec3 uPlaceholder;
uniform vec3 uBackground;
uniform float uDim;
varying vec2 vPos;

float hash(float n) {
  return fract(sin(n * 12.9898) * 43758.5453);
}

void main() {
  float r = length(vPos);
  float px = max(fwidth(r), 1e-4);
  float theta = atan(vPos.y, vPos.x);
  float label = 0.33;

  vec3 color;
  if (r < label) {
    float c = cos(uSpin);
    float s = sin(uSpin);
    vec2 q = vec2(c * vPos.x + s * vPos.y, -s * vPos.x + c * vPos.y) / label;
    vec2 uv = q * 0.5;
    if (uImageAspect > 1.0) {
      uv.x /= uImageAspect;
    } else {
      uv.y *= uImageAspect;
    }
    uv += 0.5;
    vec3 art = texture2D(uImage, uv).rgb;
    art = mix(uPlaceholder, art, clamp(uLoaded, 0.0, 1.0));
    float edge = smoothstep(label - 0.018, label - 0.004, r);
    color = art * (1.0 - 0.32 * edge);
    float hole = 1.0 - smoothstep(0.026, 0.026 + px * 1.5, r);
    color = mix(color, uBackground, hole);
  } else {
    float lead = smoothstep(label, label + 0.05, r) * (1.0 - smoothstep(0.935, 0.95, r));
    float ring = (r - 0.4) * 6.0;
    float cell = floor(ring);
    float local = fract(ring);
    float separator = (1.0 - smoothstep(0.0, 0.035 + px * 6.0, local)) * step(0.4, r) * step(r, 0.935);
    float density = clamp(px * 140.0, 0.0, 1.0);
    float groove = mix(0.5 + 0.5 * sin(r * 880.0 + hash(cell) * 6.2831), 0.5, density);
    vec3 base = uVinyl * (0.92 + 0.12 * groove * lead);
    float light = 0.86;
    float facing = abs(cos(theta + uSpin * 0.0 - light));
    float sheen = pow(facing, 26.0) + 0.45 * pow(abs(cos(theta - light - 0.32)), 70.0);
    float sheenBand = smoothstep(label + 0.02, 0.46, r) * (1.0 - smoothstep(0.9, 0.95, r));
    vec3 highlight = vec3(1.0) * sheen * sheenBand * (0.13 + 0.08 * groove);
    float rim = smoothstep(0.955, 0.99, r) * (1.0 - smoothstep(0.99, 1.0, r));
    color = base + highlight + vec3(0.06) * separator * sheenBand + vec3(0.05) * rim;
  }
  float alpha = 1.0 - smoothstep(1.0 - px * 1.2, 1.0, r);
  color = mix(color, uBackground, clamp(uDim, 0.0, 1.0));
  gl_FragColor = vec4(color * alpha, alpha);
}
`;

let rgbContext: CanvasRenderingContext2D | null = null;

const toRgb = (value: string) => {
  if (!value || /^rgba?\(/i.test(value)) return value;
  if (!rgbContext) rgbContext = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!rgbContext) return value;
  rgbContext.fillStyle = "#010203";
  rgbContext.fillStyle = value;
  if (String(rgbContext.fillStyle) === "#010203" && value.trim().toLowerCase() !== "#010203") return value;
  rgbContext.clearRect(0, 0, 1, 1);
  rgbContext.fillRect(0, 0, 1, 1);
  const pixel = rgbContext.getImageData(0, 0, 1, 1).data;
  return pixel[3] === 255
    ? `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`
    : `rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${Math.round((pixel[3] / 255) * 1000) / 1000})`;
};

const createRail = (
  root: HTMLElement,
  stage: HTMLElement,
  overlay: Overlay,
  settingsRef: { current: Settings },
  itemsRef: { current: AlbumRailItem[] },
  startIndex: number,
  callbacks: Callbacks,
): Controller | null => {
  const doc = root.ownerDocument;
  const canvas = doc.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }
  stage.appendChild(canvas);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 10, 8000);
  const blank = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1);
  blank.needsUpdate = true;
  const background = new THREE.Color(0, 0, 0);
  const placeholder = new THREE.Color(0.5, 0.5, 0.5);
  const vinylTone = new THREE.Color(0.08, 0.075, 0.09);
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const cardSize = new THREE.Vector2(300, 300);
  let cardGeometry = new THREE.ShapeGeometry(new THREE.Shape(), 1);
  const plane = new THREE.PlaneGeometry(1, 1);
  const discGeometry = new THREE.CircleGeometry(1.01, 160);

  const shadeMaterial = (round: boolean) =>
    new THREE.ShaderMaterial({
      uniforms: {
        uSize: { value: new THREE.Vector2(1, 1) },
        uBox: { value: new THREE.Vector2(1, 1) },
        uRadius: { value: 12 },
        uBlur: { value: 24 },
        uStrength: { value: 0.3 },
        uRound: { value: round ? 1 : 0 },
      },
      vertexShader: shadeVertex,
      fragmentShader: shadeFragment,
      transparent: true,
      premultipliedAlpha: false,
      depthWrite: false,
      depthTest: false,
    });

  const cards: Card[] = Array.from({ length: SLOTS }, () => {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uImage: { value: blank as THREE.Texture },
        uImageAspect: { value: 1 },
        uSize: { value: cardSize },
        uLoaded: { value: 0 },
        uDim: { value: 0 },
        uBackground: { value: background },
        uPlaceholder: { value: placeholder },
      },
      vertexShader: cardVertex,
      fragmentShader: cardFragment,
      side: THREE.DoubleSide,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(cardGeometry, material);
    mesh.frustumCulled = false;
    mesh.visible = false;
    scene.add(mesh);
    const shade = new THREE.Mesh(plane, shadeMaterial(false));
    shade.frustumCulled = false;
    shade.visible = false;
    scene.add(shade);
    return { mesh, shade, index: 0, order: 0 };
  });

  const disc = new THREE.Mesh(
    discGeometry,
    new THREE.ShaderMaterial({
      uniforms: {
        uImage: { value: blank as THREE.Texture },
        uImageAspect: { value: 1 },
        uLoaded: { value: 0 },
        uSpin: { value: 0 },
        uVinyl: { value: vinylTone },
        uPlaceholder: { value: placeholder },
        uDim: { value: 0 },
        uBackground: { value: background },
      },
      vertexShader: discVertex,
      fragmentShader: discFragment,
      side: THREE.DoubleSide,
      transparent: true,
      premultipliedAlpha: true,
      depthTest: false,
      depthWrite: false,
    }),
  );
  disc.frustumCulled = false;
  disc.visible = false;
  scene.add(disc);
  const discShade = new THREE.Mesh(plane, shadeMaterial(true));
  discShade.frustumCulled = false;
  discShade.visible = false;
  scene.add(discShade);

  let pictures: Picture[] = [];
  let itemsKey = "";
  let width = 0;
  let height = 0;
  let dpr = 1;
  let sized = false;
  let pos = startIndex;
  let posV = 0;
  let target = startIndex;
  let wheelAt = 0;
  let wheeling = false;
  let nextStepAt = 0;
  let holdUntil = 0;
  let open = 0;
  let openV = 0;
  let started = false;
  let waitedSince = 0;
  let peek = 0;
  let peekV = 0;
  let out = 0;
  let outV = 0;
  let playing = false;
  let playingIndex = -1;
  let spin = 0;
  let spinRate = 0;
  let discOwner = startIndex;
  let toneKey = "";
  const sampler = doc.createElement("canvas");
  let raf = 0;
  let timer = 0;
  let last = 0;
  let visible = false;
  let destroyed = false;
  let lost = false;
  let consumed = false;
  let pointerInside = false;
  let overActive = false;
  let pointerX = 0;
  let pointerY = 0;
  let hovered: number | null = null;
  let reportedActive = Number.NaN;
  let shownCaption = Number.NaN;
  let captionX = Number.NaN;
  let captionOpacity = -1;
  let captionTop = Number.NaN;
  let deckTop = Number.NaN;
  let rulerWidth = 0;
  let rulerPos = Number.NaN;
  let scrub: {
    id: number;
    x: number;
    origin: number;
    moved: boolean;
    samples: { t: number; p: number }[];
  } | null = null;
  const ticks = Array.from({ length: TICKS }, () => {
    const node = doc.createElement("span");
    node.style.cssText =
      "position:absolute;left:0;top:50%;width:1px;height:9px;margin-top:-4.5px;border-radius:1px;background:currentColor;opacity:0;will-change:transform";
    overlay.ruler.appendChild(node);
    return { node, x: Number.NaN, on: false };
  });
  let shapeKey = "";
  let backgroundAt = 0;
  const hoverMix = new Map<number, number>();
  let press: {
    id: number;
    x: number;
    lastX: number;
    origin: number;
    moved: boolean;
    samples: { t: number; p: number }[];
  } | null = null;

  const geo = {
    cardW: 300,
    cardH: 300,
    step: 180,
    lift: 0,
    labelGap: LABEL_GAP,
    controlsTop: LABEL_GAP,
    distance: 1200,
  };

  const count = () => Math.max(itemsRef.current.length, 1);
  const wrap = (index: number) => ((index % count()) + count()) % count();
  const clock = () => performance.now() / 1000;
  const clampTarget = (value: number) =>
    settingsRef.current.loop ? value : clamp(value, 0, count() - 1);

  const loadPictures = () => {
    const items = itemsRef.current;
    const key = items.map((item) => item.src).join("\u0000");
    if (key === itemsKey) return;
    itemsKey = key;
    pictures.forEach((picture) => {
      picture.image.onload = null;
      picture.texture.dispose();
    });
    const n = Math.max(items.length, 1);
    const centre = wrap(Math.round(pos));
    pictures = items.map((item, index) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      const apart = Math.abs(index - centre) % n;
      image.fetchPriority = Math.min(apart, n - apart) <= 2 ? "high" : "low";
      const texture = new THREE.Texture(image);
      texture.colorSpace = THREE.NoColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.anisotropy = anisotropy;
      const picture: Picture = {
        image,
        texture,
        aspect: 1,
        ready: false,
        uploaded: false,
        fade: 0,
        tone: null,
      };
      image.onload = () => {
        if (destroyed) return;
        const finish = () => {
          if (destroyed || picture.ready) return;
          picture.aspect = image.naturalWidth / Math.max(image.naturalHeight, 1);
          picture.ready = true;
          picture.tone = sampleTone(image, sampler);
          toneKey = "";
          texture.needsUpdate = true;
          schedule();
        };
        image.decode().then(finish, finish);
      };
      image.src = item.src;
      return picture;
    });
  };

  const readSize = () => {
    const settings = settingsRef.current;
    const nextWidth = Math.round(root.clientWidth);
    const nextHeight = Math.round(root.clientHeight);
    if (nextWidth < 2 || nextHeight < 2) {
      sized = false;
      return false;
    }
    const nextDpr = Math.min(window.devicePixelRatio || 1, Math.max(settings.dpr, 0.5));
    if (sized && nextWidth === width && nextHeight === height && nextDpr === dpr) return false;
    sized = true;
    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    return true;
  };

  const readBackground = () => {
    const value = settingsRef.current.backgroundColor;
    if (parseColor(value)) {
      background.setStyle(value, THREE.NoColorSpace);
      return;
    }
    let node: HTMLElement | null = root;
    const view = doc.defaultView ?? window;
    while (node) {
      const fill = toRgb(view.getComputedStyle(node).backgroundColor);
      if (fill && fill !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(fill)) {
        background.setStyle(fill, THREE.NoColorSpace);
        return;
      }
      node = node.parentElement;
    }
    const ink = toRgb(view.getComputedStyle(root).color);
    const tone = new THREE.Color();
    tone.setStyle(ink || "#000", THREE.NoColorSpace);
    background.setHex(tone.r + tone.g + tone.b > 1.5 ? 0x0a0a0a : 0xffffff, THREE.NoColorSpace);
  };

  const syncColors = () => {
    readBackground();
    const light = background.r * 0.2126 + background.g * 0.7152 + background.b * 0.0722 > 0.6;
    placeholder.copy(background).lerp(new THREE.Color(light ? 0x000000 : 0xffffff), 0.08);
    const vinylValue = settingsRef.current.vinylColor;
    if (parseColor(vinylValue)) vinylTone.setStyle(vinylValue, THREE.NoColorSpace);
  };

  const measure = () => {
    const settings = settingsRef.current;
    const rhythm = clamp(height / 620, 0.72, 1.15);
    const labelGap = LABEL_GAP * rhythm;
    const controlsTop = settings.captions ? labelGap + LABEL_HEIGHT + CONTROL_GAP * rhythm : labelGap;
    const reserve = settings.controls
      ? controlsTop + CONTROL_HEIGHT
      : settings.captions
        ? labelGap + LABEL_HEIGHT
        : 0;
    rulerWidth = overlay.ruler.clientWidth;
    geo.labelGap = labelGap;
    geo.controlsTop = controlsTop;
    const room = Math.max(height - reserve, height * 0.5);
    const aspect = clamp(settings.aspect, 0.5, 2);
    let cardH = clamp(settings.size, 0.2, 0.95) * room;
    const share = 0.46 + 0.3 * smooth(900, 360, width);
    if (cardH * aspect > width * share) cardH = (width * share) / aspect;
    const cardW = cardH * aspect;
    geo.cardW = cardW;
    geo.cardH = cardH;
    geo.step = cardW * clamp(settings.spread, 0.1, 1.4);
    const distance = Math.max(cardH * 3.1, 600);
    geo.distance = distance;
    camera.fov = (2 * Math.atan(height / 2 / distance) * 180) / Math.PI;
    camera.aspect = width / height;
    camera.near = distance * 0.05;
    camera.far = distance * 6;
    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    geo.lift = reserve / 2;
    camera.setViewOffset(width, height, 0, geo.lift, width, height);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const radius = clamp(settings.radius, 0, Math.min(cardW, cardH) / 2);
    const key = `${cardW.toFixed(2)}|${cardH.toFixed(2)}|${radius.toFixed(2)}`;
    if (key !== shapeKey) {
      shapeKey = key;
      const shape = new THREE.Shape();
      const w = cardW / 2;
      const h = cardH / 2;
      const r = Math.max(radius, 0.001);
      shape.moveTo(-w + r, -h);
      shape.lineTo(w - r, -h);
      shape.absarc(w - r, -h + r, r, -Math.PI / 2, 0, false);
      shape.lineTo(w, h - r);
      shape.absarc(w - r, h - r, r, 0, Math.PI / 2, false);
      shape.lineTo(-w + r, h);
      shape.absarc(-w + r, h - r, r, Math.PI / 2, Math.PI, false);
      shape.lineTo(-w, -h + r);
      shape.absarc(-w + r, -h + r, r, Math.PI, Math.PI * 1.5, false);
      const next = new THREE.ShapeGeometry(shape, 12);
      cards.forEach((card) => {
        card.mesh.geometry = next;
      });
      cardGeometry.dispose();
      cardGeometry = next;
      cardSize.set(cardW, cardH);
    }
  };

  const reach = () => {
    const settings = settingsRef.current;
    const side = clamp(Math.round(settings.visible), 1, 5);
    return settings.loop ? Math.min(side, Math.max(1, Math.floor((count() - 1) / 2))) : side;
  };

  const place = (d: number, openness: number) => {
    const settings = settingsRef.current;
    const a = Math.abs(d) * openness;
    const sign = Math.sign(d);
    const pack = 1 - 0.85 * clamp(settings.stack, 0, 1);
    const along = pack * a + ((1 - pack) * Math.tanh(1.5 * a)) / Math.tanh(1.5);
    const soft = Math.sqrt(a * a + 0.09) - 0.3;
    const depth = clamp(settings.depth, 0, 1);
    const fan = (clamp(settings.fan, 0, 30) * Math.PI) / 180;
    const turn = (clamp(settings.turn, 0, 70) * Math.PI) / 180;
    const ry = Math.tanh(1.4 * d * openness) * turn;
    const scale = 1 - (0.04 + 0.12 * depth) * Math.tanh(soft * 1.2);
    const passing = a < 1 ? Math.pow(Math.sin(Math.PI * a), 2) : 0;
    const middle = pack * 0.5 + ((1 - pack) * Math.tanh(0.75)) / Math.tanh(1.5);
    const clearance = Math.max(0, geo.cardW * 0.5 * 1.04 - geo.step * middle);
    return {
      x: sign * (geo.step * along + clearance * passing),
      y: -geo.cardH * 0.035 * along * along,
      z: -geo.cardH * (0.24 + 0.46 * depth) * soft,
      rz: -sign * fan * along,
      ry,
      scale,
    };
  };

  const schedule = () => {
    if (destroyed || lost || !visible || raf) return;
    if (timer) {
      window.clearTimeout(timer);
      timer = 0;
    }
    raf = requestAnimationFrame(frame);
  };

  const hold = (seconds = 2.6) => {
    const at = clock();
    holdUntil = Math.max(holdUntil, at + seconds);
    nextStepAt = Math.max(nextStepAt, at + Math.max(settingsRef.current.interval, seconds));
  };

  const setPlaying = (next: boolean) => {
    if (!settingsRef.current.vinyl && next) return;
    const index = wrap(Math.round(target));
    if (next === playing && index === playingIndex) return;
    playing = next;
    playingIndex = next ? index : -1;
    callbacks.onPlay(index, next);
    hold();
    schedule();
  };

  const goTo = (index: number) => {
    const settings = settingsRef.current;
    if (settings.loop) {
      const n = count();
      const base = Math.round(target);
      const offset = ((((index - wrap(base)) % n) + n + Math.floor(n / 2)) % n) - Math.floor(n / 2);
      target = base + offset;
    } else {
      target = clamp(index, 0, count() - 1);
    }
    hold();
    schedule();
  };

  const step = (direction: number) => {
    target = clampTarget(Math.round(target) + direction);
    hold();
    schedule();
  };

  const uploadOne = () => {
    const n = pictures.length;
    const centre = wrap(Math.round(pos));
    let best: Picture | null = null;
    let bestDistance = Infinity;
    for (let i = 0; i < n; i++) {
      const picture = pictures[i];
      if (!picture.ready || picture.uploaded) continue;
      const apart = Math.abs(i - centre) % n;
      const distance = Math.min(apart, n - apart);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = picture;
      }
    }
    if (!best) return false;
    renderer.initTexture(best.texture);
    best.uploaded = true;
    return true;
  };

  const euler = new THREE.Euler();
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const ownerQuaternion = new THREE.Quaternion();
  const offsetVector = new THREE.Vector3();
  const scaleVector = new THREE.Vector3();
  const positionVector = new THREE.Vector3();

  function frame(time: number) {
    raf = 0;
    if (destroyed || lost) return;
    if (!sized) {
      readSize();
      if (!sized) return;
      measure();
    }
    const settings = settingsRef.current;
    const dt = last && time - last < 100 ? Math.min(Math.max((time - last) / 1000, 0), 0.05) : 1 / 60;
    last = time;
    const now = clock();
    const reduced = settings.reduced;
    let busy = false;

    if (now - backgroundAt > 1.2) {
      backgroundAt = now;
      syncColors();
    }

    if (uploadOne()) busy = true;
    for (const picture of pictures) {
      if (picture.uploaded && picture.fade < 1) {
        picture.fade = reduced || !started ? 1 : Math.min(1, picture.fade + dt / 0.45);
        busy = true;
      }
    }

    if (!started) {
      if (!waitedSince) waitedSince = now;
      let ready = true;
      for (let offset = -2; offset <= 2; offset++) {
        const picture = pictures[wrap(Math.round(pos) + offset)];
        if (picture && !picture.uploaded) ready = false;
      }
      if (ready || reduced || now - waitedSince > 1.6) {
        started = true;
        open = reduced ? 1 : 0;
      } else {
        busy = true;
      }
    }
    if (started && open < 1) {
      [open, openV] = springTo(open, openV, 1, dt, reduced ? 0.05 : 1.5, 0.92);
      if (Math.abs(1 - open) < 1e-4 && Math.abs(openV) < 1e-4) {
        open = 1;
        openV = 0;
      } else {
        busy = true;
      }
    }

    const interval = Math.max(settings.interval, 1);
    const touching = !!press || !!scrub || (settings.pauseOnHover && pointerInside);
    const holding = touching || now < holdUntil || playing;
    if (settings.autoplay && !settings.paused && !reduced && count() > 1) {
      if (holding || nextStepAt === 0) nextStepAt = Math.max(nextStepAt, now + interval * (touching || playing ? 0.6 : 1));
      else if (now >= nextStepAt) {
        nextStepAt = now + interval;
        if (!settings.loop && Math.round(target) >= count() - 1) target = 0;
        else target = clampTarget(Math.round(target) + 1);
      }
    } else {
      nextStepAt = 0;
    }

    if (wheeling && now - wheelAt > 0.14) {
      wheeling = false;
      target = clampTarget(Math.round(target));
    }

    if ((press && press.moved) || (scrub && scrub.moved)) {
      busy = true;
    } else {
      [pos, posV] = springTo(pos, posV, target, dt, reduced ? 0.06 : wheeling ? 0.6 : 0.85, 0.88);
      if (Math.abs(pos - target) < 1e-4 && Math.abs(posV) < 1e-4) {
        pos = target;
        posV = 0;
      } else {
        busy = true;
      }
    }

    const activeIndex = wrap(Math.round(pos));
    if (activeIndex !== reportedActive) {
      reportedActive = activeIndex;
      callbacks.onActive(activeIndex);
    }

    const settled = Math.abs(pos - Math.round(pos)) < 0.04 && !press?.moved && !scrub?.moved;
    if (playing && (playingIndex !== wrap(Math.round(target)) || !settings.vinyl)) {
      playing = false;
      callbacks.onPlay(playingIndex, false);
      playingIndex = -1;
    }
    const focus = Math.round(target);
    const handing = discOwner !== focus;
    if (handing && out < 0.01 && peek < 0.01) {
      discOwner = focus;
      out = 0;
      outV = 0;
      peek = 0;
      peekV = 0;
    }
    const owned = discOwner === focus;
    const dragging = !!press?.moved || !!scrub?.moved;
    const outTarget = owned && playing && settled ? 1 : 0;
    const retract = dragging ? 0.14 : 0.45;
    [out, outV] = springTo(out, outV, outTarget, dt, reduced ? 0.05 : outTarget > out ? 0.7 : retract, outTarget > out ? 0.74 : 1);
    if (Math.abs(out - outTarget) > 1e-4 || Math.abs(outV) > 1e-4) busy = true;
    else {
      out = outTarget;
      outV = 0;
    }
    const peekTarget = owned && settings.vinyl && overActive && settled && !playing ? 1 : 0;
    [peek, peekV] = springTo(peek, peekV, peekTarget, dt, reduced ? 0.05 : dragging ? 0.14 : 0.42, dragging ? 1 : 0.95);
    if (Math.abs(peek - peekTarget) > 1e-4 || Math.abs(peekV) > 1e-4) busy = true;
    else {
      peek = peekTarget;
      peekV = 0;
    }
    const rate = playing && !reduced ? (clamp(settings.rpm, 0, 90) * TAU) / 60 : 0;
    spinRate += (rate - spinRate) * (1 - Math.exp(-dt / (rate > spinRate ? 0.7 : 1.1)));
    if (Math.abs(spinRate) > 1e-3) {
      spin = (spin + spinRate * dt) % TAU;
      busy = true;
    } else {
      spinRate = 0;
    }

    readSize();
    measure();

    if (pointerInside && !press) refreshHover();

    const reachSide = reach();
    const dimAmount = clamp(settings.dim, 0, 1);
    const shadowAmount = clamp(settings.shadow, 0, 1);
    const centre = Math.round(pos);
    const discRadius = Math.min(geo.cardW, geo.cardH) * 0.47;
    const pull = clamp(out, -0.2, 1.2);
    const travel = discRadius * 2 * (0.15 * peek + 0.56 * pull);
    const ownerD = discOwner - pos;
    const pairShift = -discRadius * 0.62 * pull;
    let used = 0;
    let focused: { x: number; y: number; z: number; scale: number; order: number; dim: number } | null = null;
    for (let offset = -SLOTS; offset <= SLOTS && used < SLOTS; offset++) {
      const index = centre + offset;
      if (!settings.loop && (index < 0 || index >= count())) continue;
      const d = index - pos;
      if (Math.abs(d) > reachSide + 0.6) continue;
      const card = cards[used++];
      card.index = index;
      const spot = place(d, open);
      const make = smooth(0, 0.6, d - ownerD) * pull;
      const shiftX = pairShift + discRadius * 1.25 * make;
      const vanish = smooth(reachSide - 0.4, reachSide + 0.55, Math.abs(d));
      const reveal = smooth(0, 0.5, open * (1.4 - Math.abs(d) * 0.18));
      let hover = hoverMix.get(index) ?? 0;
      const hoverTarget = hovered === index ? 1 : 0;
      hover += (hoverTarget - hover) * (1 - Math.exp(-dt / 0.16));
      if (Math.abs(hover - hoverTarget) > 1e-3) busy = true;
      else hover = hoverTarget;
      hoverMix.set(index, hover);
      const dimNow = Math.max(vanish, dimAmount * smooth(0.35, 3.2, Math.abs(d)) * (1 - 0.6 * hover), 1 - reveal);

      euler.set(0, spot.ry, spot.rz, "YXZ");
      quaternion.setFromEuler(euler);
      positionVector.set(spot.x + shiftX, spot.y, spot.z);
      scaleVector.set(spot.scale, spot.scale, 1);
      matrix.compose(positionVector, quaternion, scaleVector);
      card.mesh.matrixAutoUpdate = false;
      card.mesh.matrix.copy(matrix);
      card.mesh.matrixWorldNeedsUpdate = true;
      card.mesh.visible = dimNow < 0.999;
      card.order = 1000 - Math.abs(d) * 100 + (d > 0 ? 0.01 : 0);
      card.mesh.renderOrder = card.order;
      const picture = pictures[wrap(index)];
      const u = card.mesh.material.uniforms;
      u.uDim.value = dimNow;
      if (picture) {
        u.uImage.value = picture.uploaded ? picture.texture : blank;
        u.uImageAspect.value = picture.aspect;
        u.uLoaded.value = picture.uploaded ? picture.fade : 0;
      }

      offsetVector.set(0, -geo.cardH * 0.03, 0).applyQuaternion(quaternion).multiplyScalar(spot.scale);
      positionVector.set(spot.x + shiftX + offsetVector.x, spot.y + offsetVector.y, spot.z + offsetVector.z);
      scaleVector.set(spot.scale * (geo.cardW * 1.5), spot.scale * (geo.cardH * 1.5), 1);
      matrix.compose(positionVector, quaternion, scaleVector);
      card.shade.matrixAutoUpdate = false;
      card.shade.matrix.copy(matrix);
      card.shade.matrixWorldNeedsUpdate = true;
      card.shade.visible = card.mesh.visible && shadowAmount > 0.001;
      card.shade.renderOrder = card.order - 0.5;
      const s = card.shade.material.uniforms;
      s.uSize.value.set(geo.cardW * 1.5, geo.cardH * 1.5);
      s.uBox.value.set(geo.cardW * 0.49, geo.cardH * 0.49);
      s.uRadius.value = clamp(settings.radius, 0, geo.cardH / 2);
      s.uBlur.value = geo.cardH * 0.075;
      s.uStrength.value = shadowAmount * 0.55 * (1 - dimNow * 0.85);

      if (index === discOwner) {
        focused = { x: spot.x + shiftX, y: spot.y, z: spot.z, scale: spot.scale, order: card.order, dim: dimNow };
        ownerQuaternion.copy(quaternion);
      }
    }
    for (let i = used; i < SLOTS; i++) {
      cards[i].mesh.visible = false;
      cards[i].shade.visible = false;
    }
    for (const key of Array.from(hoverMix.keys())) {
      if (Math.abs(key - pos) > SLOTS) hoverMix.delete(key);
    }

    const discShown = settings.vinyl && focused && (travel > 0.5 || out > 0.001);
    disc.visible = !!discShown;
    discShade.visible = !!discShown && shadowAmount > 0.001;
    if (discShown && focused) {
      const picture = pictures[wrap(discOwner)];
      const r = discRadius * focused.scale;
      offsetVector.set(travel, 0, -0.5).applyQuaternion(ownerQuaternion).multiplyScalar(focused.scale);
      positionVector.set(focused.x + offsetVector.x, focused.y + offsetVector.y, focused.z + offsetVector.z);
      scaleVector.set(r, r, 1);
      disc.matrixAutoUpdate = false;
      disc.matrix.compose(positionVector, ownerQuaternion, scaleVector);
      disc.matrixWorldNeedsUpdate = true;
      disc.renderOrder = focused.order - 0.7;
      const u = disc.material.uniforms;
      u.uSpin.value = spin;
      u.uDim.value = focused.dim;
      if (picture) {
        u.uImage.value = picture.uploaded ? picture.texture : blank;
        u.uImageAspect.value = picture.aspect;
        u.uLoaded.value = picture.uploaded ? 1 : 0;
      }
      offsetVector.set(travel, -discRadius * 0.05, -0.75).applyQuaternion(ownerQuaternion).multiplyScalar(focused.scale);
      positionVector.set(focused.x + offsetVector.x, focused.y + offsetVector.y, focused.z + offsetVector.z);
      scaleVector.set(r * 3, r * 3, 1);
      discShade.matrixAutoUpdate = false;
      discShade.matrix.compose(positionVector, ownerQuaternion, scaleVector);
      discShade.matrixWorldNeedsUpdate = true;
      discShade.renderOrder = focused.order - 0.8;
      const s = discShade.material.uniforms;
      s.uSize.value.set(r * 3, r * 3);
      s.uBox.value.set(r * 0.98, r * 0.98);
      s.uBlur.value = r * 0.16;
      s.uStrength.value = shadowAmount * 0.5 * smooth(0, 0.3, peek + pull) * (1 - focused.dim * 0.85);
    }

    const accentSetting = settings.accentColor.trim();
    const toneIndex = wrap(Math.round(pos));
    const lightBg = background.r * 0.2126 + background.g * 0.7152 + background.b * 0.0722 > 0.6;
    const nextToneKey =
      accentSetting && accentSetting !== "auto"
        ? `fixed|${accentSetting}`
        : `${toneIndex}|${pictures[toneIndex]?.tone ? 1 : 0}|${lightBg ? 1 : 0}`;
    if (nextToneKey !== toneKey) {
      toneKey = nextToneKey;
      root.style.setProperty(
        "--album-rail-tone",
        accentSetting && accentSetting !== "auto" ? accentSetting : toneColor(pictures[toneIndex]?.tone ?? null, lightBg),
      );
    }

    paintOverlay(reduced);

    renderer.render(scene, camera);

    if (busy || press || scrub) {
      schedule();
    } else if (settings.autoplay && !settings.paused && !reduced && !touching && !playing && count() > 1) {
      timer = window.setTimeout(() => {
        timer = 0;
        last = 0;
        schedule();
      }, Math.max(Math.max(nextStepAt, holdUntil) - now, 0.02) * 1000 + 16);
    }
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const pick = (clientX: number, clientY: number) => {
    const rect = root.getBoundingClientRect();
    pointer.set(
      ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
      1 - ((clientY - rect.top) / Math.max(rect.height, 1)) * 2,
    );
    raycaster.setFromCamera(pointer, camera);
    const targets: THREE.Object3D[] = cards.filter((card) => card.mesh.visible).map((card) => card.mesh);
    if (disc.visible) targets.push(disc);
    const hits = raycaster.intersectObjects(targets, false);
    let best: THREE.Object3D | null = null;
    for (const hit of hits) {
      if (!best || hit.object.renderOrder > best.renderOrder) best = hit.object;
    }
    if (!best) return null;
    if (best === disc) return { kind: "disc" as const, index: discOwner };
    const card = cards.find((entry) => entry.mesh === best);
    return card ? { kind: "card" as const, index: card.index } : null;
  };

  function paintOverlay(reduced: boolean) {
    const settings = settingsRef.current;
    const cardBottom = height / 2 - geo.lift + geo.cardH / 2;
    const nextCaptionTop = cardBottom + geo.labelGap;
    if (Number.isNaN(captionTop) || Math.abs(nextCaptionTop - captionTop) > 0.25) {
      captionTop = nextCaptionTop;
      overlay.caption.style.top = `${captionTop.toFixed(2)}px`;
    }
    const nextDeckTop = cardBottom + geo.controlsTop;
    if (Number.isNaN(deckTop) || Math.abs(nextDeckTop - deckTop) > 0.25) {
      deckTop = nextDeckTop;
      overlay.deck.style.top = `${deckTop.toFixed(2)}px`;
    }

    if (settings.captions) {
      const nearest = Math.round(pos);
      if (nearest !== shownCaption) {
        shownCaption = nearest;
        const item = itemsRef.current[wrap(nearest)];
        overlay.title.textContent = item ? item.title ?? item.alt : "";
        overlay.artist.textContent = item?.subtitle ?? "";
        overlay.artist.style.display = item?.subtitle ? "" : "none";
      }
      const frac = pos - nearest;
      const reveal = !started ? 0 : reduced ? 1 : smooth(0.35, 0.9, open);
      const speed = Math.abs(press?.moved || scrub?.moved ? 0 : posV);
      const opacity =
        (1 - smooth(0.08, 0.42, Math.abs(frac))) * (1 - smooth(2.5, 7, speed)) * reveal;
      const x = reduced ? 0 : -frac * 46;
      if (Number.isNaN(captionX) || Math.abs(x - captionX) > 0.02) {
        captionX = x;
        overlay.caption.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
      }
      if (Math.abs(opacity - captionOpacity) > 0.002) {
        captionOpacity = opacity;
        overlay.caption.style.opacity = opacity.toFixed(3);
      }
    }

    if (settings.controls && rulerWidth > 0 && (pos !== rulerPos || Number.isNaN(rulerPos))) {
      rulerPos = pos;
      const centre = rulerWidth / 2;
      const clear = settings.vinyl ? NEEDLE_CLEAR : 3;
      const base = Math.round(pos);
      const half = Math.floor(TICKS / 2);
      for (let k = 0; k < TICKS; k++) {
        const tick = ticks[k];
        const index = base - half + k;
        const x = centre + (index - pos) * TICK_GAP;
        const valid = settings.loop || (index >= 0 && index < count());
        const on = valid && x > 0 && x < rulerWidth && Math.abs(x - centre) > clear;
        if (on !== tick.on) {
          tick.on = on;
          tick.node.style.opacity = on ? "0.34" : "0";
        }
        if (on && (Number.isNaN(tick.x) || Math.abs(x - tick.x) > 0.01)) {
          tick.x = x;
          tick.node.style.transform = `translate3d(${(x - 0.5).toFixed(2)}px, 0, 0)`;
        }
      }
    }
  }

  const stopForDrag = () => {
    overActive = false;
    if (!playing) return;
    const index = playingIndex;
    playing = false;
    playingIndex = -1;
    callbacks.onPlay(index, false);
  };

  const onScrubDown = (event: PointerEvent) => {
    if (!event.isPrimary || event.button > 0) return;
    event.stopPropagation();
    scrub = {
      id: event.pointerId,
      x: event.clientX,
      origin: pos,
      moved: false,
      samples: [{ t: performance.now(), p: pos }],
    };
    posV = 0;
    hold();
    try {
      overlay.ruler.setPointerCapture(event.pointerId);
    } catch {}
    schedule();
  };

  const onScrubMove = (event: PointerEvent) => {
    if (!scrub || scrub.id !== event.pointerId) return;
    const dx = event.clientX - scrub.x;
    if (!scrub.moved && Math.abs(dx) > 3) {
      scrub.moved = true;
      stopForDrag();
    }
    if (!scrub.moved) return;
    const settings = settingsRef.current;
    let next = scrub.origin - dx / TICK_GAP;
    if (!settings.loop) {
      const max = count() - 1;
      if (next < 0) next *= 0.35;
      else if (next > max) next = max + (next - max) * 0.35;
    }
    pos = next;
    target = next;
    const t = performance.now();
    scrub.samples.push({ t, p: pos });
    while (scrub.samples.length > 2 && t - scrub.samples[0].t > 110) scrub.samples.shift();
    schedule();
  };

  const onScrubUp = (event: PointerEvent) => {
    if (!scrub || scrub.id !== event.pointerId) return;
    const ended = scrub;
    scrub = null;
    try {
      if (overlay.ruler.hasPointerCapture(event.pointerId)) overlay.ruler.releasePointerCapture(event.pointerId);
    } catch {}
    if (ended.moved) {
      const t = performance.now();
      const recent = ended.samples.filter((sample) => t - sample.t < 110);
      let velocity = 0;
      if (recent.length > 1 && t - recent[recent.length - 1].t < 60) {
        const span = Math.max((recent[recent.length - 1].t - recent[0].t) / 1000, 1 / 120);
        velocity = (recent[recent.length - 1].p - recent[0].p) / span;
      }
      velocity = settingsRef.current.reduced ? 0 : clamp(velocity, -14, 14);
      posV = velocity;
      target = clampTarget(Math.round(pos + velocity * 0.2));
    } else {
      const rect = overlay.ruler.getBoundingClientRect();
      const offset = Math.round((event.clientX - rect.left - rect.width / 2) / TICK_GAP);
      target = clampTarget(Math.round(target) + offset);
    }
    hold();
    schedule();
  };

  function refreshHover() {
    const hit = pick(pointerX, pointerY);
    const focus = Math.round(target);
    hovered = hit && hit.kind === "card" && hit.index !== focus ? hit.index : null;
    overActive = !!hit && hit.index === focus;
    const cursor = hit ? "pointer" : settingsRef.current.draggable ? "grab" : "";
    if (root.style.cursor !== cursor) root.style.cursor = cursor;
  }

  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== "touch" && !press) {
      pointerInside = true;
      pointerX = event.clientX;
      pointerY = event.clientY;
      refreshHover();
    }
    if (press && press.id === event.pointerId) {
      if (!press.moved && Math.abs(event.clientX - press.x) > 6) {
        press.moved = true;
        stopForDrag();
        hovered = null;
        overActive = false;
        root.style.cursor = "grabbing";
        try {
          stage.setPointerCapture(event.pointerId);
        } catch {}
      }
      if (press.moved) {
        const settings = settingsRef.current;
        let next = press.origin - (event.clientX - press.x) / Math.max(geo.step, 1);
        if (!settings.loop) {
          const max = count() - 1;
          if (next < 0) next = next * 0.35;
          else if (next > max) next = max + (next - max) * 0.35;
        }
        pos = next;
        const t = performance.now();
        press.samples.push({ t, p: pos });
        while (press.samples.length > 2 && t - press.samples[0].t > 110) press.samples.shift();
      }
      press.lastX = event.clientX;
    }
    schedule();
  };

  const onDown = (event: PointerEvent) => {
    if (!event.isPrimary || event.button > 0) return;
    consumed = false;
    if (!settingsRef.current.draggable) return;
    press = {
      id: event.pointerId,
      x: event.clientX,
      lastX: event.clientX,
      origin: pos,
      moved: false,
      samples: [{ t: performance.now(), p: pos }],
    };
    posV = 0;
    hold();
    schedule();
  };

  const finish = (event: PointerEvent) => {
    if (!press || press.id !== event.pointerId) return;
    const ended = press;
    press = null;
    try {
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    } catch {}
    if (ended.moved) {
      consumed = true;
      const t = performance.now();
      const recent = ended.samples.filter((sample) => t - sample.t < 110);
      let velocity = 0;
      if (recent.length > 1 && t - recent[recent.length - 1].t < 60) {
        const span = Math.max((recent[recent.length - 1].t - recent[0].t) / 1000, 1 / 120);
        velocity = (recent[recent.length - 1].p - recent[0].p) / span;
      }
      velocity = settingsRef.current.reduced ? 0 : clamp(velocity, -16, 16);
      posV = velocity;
      target = clampTarget(Math.round(pos + velocity * 0.22));
      hold();
      root.style.cursor = settingsRef.current.draggable ? "grab" : "";
    }
    schedule();
  };

  const onClick = (event: MouseEvent) => {
    if (consumed) {
      consumed = false;
      return;
    }
    const hit = pick(event.clientX, event.clientY);
    if (!hit) {
      if (playing) setPlaying(false);
      return;
    }
    const current = Math.round(target);
    if (hit.index === current) {
      callbacks.onSelect(wrap(current));
      if (settingsRef.current.vinyl) setPlaying(!playing);
    } else {
      target = clampTarget(hit.index);
      hold();
      schedule();
    }
  };

  const onLeave = (event: PointerEvent) => {
    if (press && press.id === event.pointerId) return;
    pointerInside = false;
    hovered = null;
    overActive = false;
    root.style.cursor = "";
    schedule();
  };

  const onWheel = (event: WheelEvent) => {
    if (!settingsRef.current.wheel) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1;
    const delta = clamp(
      (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) * unit,
      -240,
      240,
    );
    target = clampTarget((wheeling ? target : Math.round(target)) + delta / 100);
    wheeling = true;
    wheelAt = clock();
    hold();
    schedule();
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.target !== root) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goTo(count() - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      callbacks.onSelect(wrap(Math.round(target)));
      if (settingsRef.current.vinyl) setPlaying(!playing);
    } else if (event.key === "Escape" && playing) {
      event.preventDefault();
      setPlaying(false);
    }
  };

  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerup", finish);
  stage.addEventListener("pointercancel", finish);
  stage.addEventListener("pointerleave", onLeave);
  stage.addEventListener("click", onClick);
  stage.addEventListener("wheel", onWheel, { passive: false });
  root.addEventListener("keydown", onKey);
  overlay.ruler.addEventListener("pointerdown", onScrubDown);
  overlay.ruler.addEventListener("pointermove", onScrubMove);
  overlay.ruler.addEventListener("pointerup", onScrubUp);
  overlay.ruler.addEventListener("pointercancel", onScrubUp);

  const resizer = new ResizeObserver(() => {
    if (readSize()) {
      measure();
      schedule();
    }
  });
  resizer.observe(root);

  const observer =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver(
          ([entry]) => {
            visible = entry.isIntersecting;
            if (visible) {
              last = 0;
              schedule();
            } else {
              if (raf) cancelAnimationFrame(raf);
              raf = 0;
              if (timer) window.clearTimeout(timer);
              timer = 0;
            }
          },
          { rootMargin: "80px" },
        );
  if (observer) observer.observe(root);
  else visible = true;

  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };
  const onRestored = () => {
    lost = false;
    itemsKey = "";
    loadPictures();
    schedule();
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  readSize();
  if (sized) measure();
  syncColors();
  cards[0].mesh.visible = true;
  cards[0].shade.visible = true;
  disc.visible = true;
  discShade.visible = true;
  renderer.compile(scene, camera);
  cards[0].mesh.visible = false;
  cards[0].shade.visible = false;
  disc.visible = false;
  discShade.visible = false;
  loadPictures();
  schedule();

  return {
    sync: () => {
      if (readSize() || sized) measure();
      syncColors();
      loadPictures();
      shownCaption = Number.NaN;
      rulerPos = Number.NaN;
      if (!settingsRef.current.loop) target = clampTarget(target);
      schedule();
    },
    step,
    goTo,
    setPlaying,
    destroy: () => {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      if (timer) window.clearTimeout(timer);
      observer?.disconnect();
      resizer.disconnect();
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerup", finish);
      stage.removeEventListener("pointercancel", finish);
      stage.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("click", onClick);
      stage.removeEventListener("wheel", onWheel);
      root.removeEventListener("keydown", onKey);
      overlay.ruler.removeEventListener("pointerdown", onScrubDown);
      overlay.ruler.removeEventListener("pointermove", onScrubMove);
      overlay.ruler.removeEventListener("pointerup", onScrubUp);
      overlay.ruler.removeEventListener("pointercancel", onScrubUp);
      ticks.forEach((tick) => tick.node.remove());
      root.style.cursor = "";
      root.style.removeProperty("--album-rail-tone");
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      pictures.forEach((picture) => {
        picture.image.onload = null;
        picture.texture.dispose();
      });
      cards.forEach((card) => {
        card.mesh.material.dispose();
        card.shade.material.dispose();
      });
      disc.material.dispose();
      discShade.material.dispose();
      hoverMix.clear();
      blank.dispose();
      cardGeometry.dispose();
      plane.dispose();
      discGeometry.dispose();
      renderer.dispose();
      if (!renderer.getContext().isContextLost()) renderer.forceContextLoss();
      canvas.remove();
    },
  };
};

export const AlbumRail = forwardRef<AlbumRailHandle, AlbumRailProps>(function AlbumRail(
  {
    items = defaultItems,
    startIndex = 0,
    aspect = 1,
    size = 0.62,
    spread = 0.58,
    stack = 0.5,
    fan = 6,
    turn = 22,
    depth = 0.5,
    visible = 3,
    radius = 14,
    dim = 0.45,
    shadow = 0.6,
    vinyl = true,
    vinylColor = "#131116",
    accentColor = "auto",
    rpm = 33,
    autoplay = true,
    interval = 4,
    pauseOnHover = true,
    loop = true,
    draggable = true,
    wheel = true,
    captions = true,
    controls = true,
    backgroundColor = "transparent",
    paused = false,
    dpr = 2,
    ariaLabel = "Album rail. Scroll, drag or use the arrow keys to browse. Press Enter to play the focused album.",
    onIndexChange,
    onSelect,
    onPlayChange,
    className,
    style,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const artistRef = useRef<HTMLSpanElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<Controller | null>(null);
  const reduced = useSyncExternalStore(subscribeToMotion, readMotion, () => false);
  const list = items.length ? items : defaultItems;
  const itemsRef = useRef(list);
  const [initialIndex] = useState(() => clamp(Math.round(startIndex), 0, Math.max(list.length - 1, 0)));
  const [active, setActive] = useState(initialIndex);
  const [playing, setPlayingState] = useState(false);
  const [failed, setFailed] = useState(false);

  const settings: Settings = {
    aspect,
    size,
    spread,
    stack,
    fan,
    turn,
    depth,
    visible,
    radius,
    dim,
    shadow,
    vinyl,
    vinylColor,
    accentColor,
    rpm,
    autoplay,
    interval,
    pauseOnHover,
    loop,
    draggable,
    wheel,
    captions,
    controls,
    backgroundColor,
    paused,
    dpr,
    reduced,
  };
  const settingsRef = useRef(settings);
  const callbacksRef = useRef({ onIndexChange, onSelect, onPlayChange });

  useEffect(() => {
    settingsRef.current = settings;
    itemsRef.current = list;
    callbacksRef.current = { onIndexChange, onSelect, onPlayChange };
    controllerRef.current?.sync();
  });

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const caption = captionRef.current;
    const title = titleRef.current;
    const artist = artistRef.current;
    const deck = deckRef.current;
    const ruler = rulerRef.current;
    if (!root || !stage || !caption || !title || !artist || !deck || !ruler) return;
    const controller = createRail(
      root,
      stage,
      { caption, title, artist, deck, ruler },
      settingsRef,
      itemsRef,
      initialIndex,
      {
        onActive: (index) => {
          setActive(index);
          callbacksRef.current.onIndexChange?.(index);
        },
        onSelect: (index) => {
          const item = itemsRef.current[index];
          if (!item) return;
          callbacksRef.current.onSelect?.(item, index);
          if (item.href && !settingsRef.current.vinyl) window.location.assign(item.href);
        },
        onPlay: (index, next) => {
          setPlayingState(next);
          callbacksRef.current.onPlayChange?.(index, next);
        },
      },
    );
    if (!controller) {
      const frame = requestAnimationFrame(() => setFailed(true));
      return () => cancelAnimationFrame(frame);
    }
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [initialIndex]);

  useImperativeHandle(
    ref,
    () => ({
      next: () => controllerRef.current?.step(1),
      previous: () => controllerRef.current?.step(-1),
      goTo: (index: number) => controllerRef.current?.goTo(index),
      play: () => controllerRef.current?.setPlaying(true),
      stop: () => controllerRef.current?.setPlaying(false),
    }),
    [],
  );

  const backgroundValue = backgroundColor.trim().toLowerCase();
  const transparent = backgroundValue === "transparent" || backgroundValue === "";
  const light = !transparent && isLight(backgroundValue);
  const ink = transparent ? "currentColor" : light ? "#0a0a0a" : "#fafafa";
  const current = list[active] ?? list[0];

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative h-full min-h-[420px] w-full overflow-hidden outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[color-mix(in_oklch,currentColor_35%,transparent)]",
        className,
      )}
      style={{ backgroundColor: transparent ? undefined : backgroundColor, color: ink, ...style }}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
    >
      <div ref={stageRef} style={stageStyle} />
      {failed && current ? (
        <div style={{ position: "absolute", inset: "16%", display: "grid", placeItems: "center" }}>
          <img
            src={current.src}
            alt={current.alt}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "cover", borderRadius: radius }}
          />
        </div>
      ) : null}
      <ul style={hiddenStyle}>
        {list.map((item, index) => (
          <li key={`${item.src}-${index}`} aria-current={index === active ? "true" : undefined}>
            {item.title ? `${item.title}${item.subtitle ? `, ${item.subtitle}` : ""}` : item.alt}
          </li>
        ))}
      </ul>
      <div aria-live="polite" style={hiddenStyle}>
        {current ? `${current.title ?? current.alt}${playing ? ", playing" : ""}` : ""}
      </div>
      <div ref={captionRef} aria-hidden="true" style={{ ...captionStyle, display: captions ? "flex" : "none" }}>
        <span ref={titleRef} style={titleStyle} />
        <span ref={artistRef} style={artistStyle} />
      </div>
      <div ref={deckRef} style={{ ...deckStyle, display: controls ? "flex" : "none" }}>
        <button
          type="button"
          aria-label="Previous album"
          onClick={() => controllerRef.current?.step(-1)}
          onPointerEnter={(event) => {
            event.currentTarget.style.opacity = "1";
            event.currentTarget.style.background = raised;
          }}
          onPointerLeave={(event) => {
            event.currentTarget.style.opacity = "0.55";
            event.currentTarget.style.background = "transparent";
          }}
          style={chevronStyle}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div style={rulerFrameStyle}>
          <div
            ref={rulerRef}
            role="slider"
            aria-label="Albums"
            aria-valuemin={1}
            aria-valuemax={list.length}
            aria-valuenow={active + 1}
            aria-valuetext={current ? current.title ?? current.alt : undefined}
            style={rulerStyle}
          />
          {vinyl ? (
            <button
              type="button"
              aria-label={playing ? "Pause" : `Play ${current?.title ?? "album"}`}
              aria-pressed={playing}
              onClick={() => controllerRef.current?.setPlaying(!playing)}
              onPointerEnter={(event) => {
                if (!playing) event.currentTarget.style.background = toneFill(30);
              }}
              onPointerLeave={(event) => {
                event.currentTarget.style.background = toneFill(playing ? 34 : 22);
              }}
              style={{ ...needleStyle, background: toneFill(playing ? 34 : 22) }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                style={{ ...iconStyle, opacity: playing ? 0 : 1, transform: playing ? "scale(0.6)" : "scale(1)" }}
              >
                <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
              </svg>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                style={{ ...iconStyle, opacity: playing ? 1 : 0, transform: playing ? "scale(1)" : "scale(0.6)" }}
              >
                <rect x="6.5" y="5" width="3.6" height="14" rx="1.2" />
                <rect x="13.9" y="5" width="3.6" height="14" rx="1.2" />
              </svg>
            </button>
          ) : (
            <span aria-hidden="true" style={markerStyle} />
          )}
        </div>
        <button
          type="button"
          aria-label="Next album"
          onClick={() => controllerRef.current?.step(1)}
          onPointerEnter={(event) => {
            event.currentTarget.style.opacity = "1";
            event.currentTarget.style.background = raised;
          }}
          onPointerLeave={(event) => {
            event.currentTarget.style.opacity = "0.55";
            event.currentTarget.style.background = "transparent";
          }}
          style={chevronStyle}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
});

AlbumRail.displayName = "AlbumRail";

export default AlbumRail;
