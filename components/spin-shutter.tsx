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

export interface SpinShutterItem {
  src: string;
  alt: string;
  title?: string;
  subtitle?: string;
  href?: string;
}

export interface SpinShutterProps {
  items?: SpinShutterItem[];
  count?: number;
  startIndex?: number;
  aspect?: number;
  size?: number;
  radius?: number;
  tilt?: number;
  roll?: number;
  distance?: number;
  scale?: number;
  cluster?: number;
  spread?: number;
  speed?: number;
  aperture?: number;
  haze?: number;
  shadow?: number;
  intro?: boolean;
  pauseOnHover?: boolean;
  draggable?: boolean;
  wheel?: boolean;
  captions?: boolean;
  backgroundColor?: string;
  paused?: boolean;
  dpr?: number;
  ariaLabel?: string;
  onFocusChange?: (item: SpinShutterItem, index: number) => void;
  onSelect?: (item: SpinShutterItem, index: number) => void;
  className?: string;
  style?: CSSProperties;
}

export interface SpinShutterHandle {
  next: () => void;
  previous: () => void;
  show: (index: number) => void;
  release: () => void;
  replay: () => void;
}

type Settings = Required<
  Omit<
    SpinShutterProps,
    "className" | "style" | "onFocusChange" | "onSelect" | "ariaLabel" | "startIndex" | "items"
  >
> & {
  reduced: boolean;
  held: boolean;
};

interface Controller {
  sync: () => void;
  step: (direction: number) => void;
  show: (card: number) => void;
  release: () => void;
  replay: () => void;
  destroy: () => void;
}

interface Callbacks {
  onFeature: (item: number) => void;
  onPick: (item: number) => void;
  onSelect: (item: number) => void;
}

interface Overlay {
  caption: HTMLElement;
  title: HTMLElement;
  subtitle: HTMLElement;
}

interface Layer {
  image: HTMLImageElement;
  ready: boolean;
  drawn: boolean;
  shown: boolean;
  fade: number;
}

interface Card {
  alpha: number;
  phi: number;
  x: number;
  y: number;
  z: number;
  hw: number;
  hh: number;
  lift: number;
  order: number;
}

const MAX_CARDS = 48;
const MAX_LAYERS = 32;
const CAPTION_ROOM = 76;
const TAU = Math.PI * 2;

const defaultItems: SpinShutterItem[] = [
  {
    src: "https://pro.reactbits.dev/demo-media/architecture-courtyard.webp",
    alt: "Two round pines beside a white stone wall in soft, hazy light",
    title: "Courtyard",
    subtitle: "Two pines, one wall",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/architecture-whitewash.webp",
    alt: "Whitewashed plaster block against a soft cloudy sky",
    title: "Whitewash",
    subtitle: "Plaster against the sky",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/architecture-ribbons.webp",
    alt: "White facade ribbons flowing in parallel waves",
    title: "Ribbons",
    subtitle: "One continuous curve",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/architecture-monolith.webp",
    alt: "Stepped board-formed concrete towers against a pale teal sky",
    title: "Monolith",
    subtitle: "Concrete in rhythm",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/architecture-stair.webp",
    alt: "Cream stair rising along a sunlit courtyard wall under a slice of blue sky",
    title: "Sunlit stair",
    subtitle: "Light climbing a quiet wall",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/architecture-pool.webp",
    alt: "Figure in black crossing a shallow pool before a tall cream wall",
    title: "Reflecting pool",
    subtitle: "A figure crossing still water",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/architecture-twist.webp",
    alt: "White balconies twisting in an S-curve down a tiled facade against pale sky",
    title: "Twist",
    subtitle: "A facade in motion",
  },
  {
    src: "https://pro.reactbits.dev/demo-media/architecture-wave.webp",
    alt: "Navy and white striped towers curving together around a patch of blue sky",
    title: "Wave",
    subtitle: "Two towers leaning in",
  },
];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const smooth = (edge0: number, edge1: number, value: number) => {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const wrapPi = (angle: number) => {
  const a = (((angle + Math.PI) % TAU) + TAU) % TAU;
  return a - Math.PI;
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

const captionStyle: CSSProperties = {
  position: "absolute",
  left: "50%",
  bottom: 22,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  whiteSpace: "nowrap",
  textAlign: "center",
  pointerEvents: "none",
  opacity: 0,
  transform: "translateX(-50%)",
  willChange: "opacity",
};

const titleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  lineHeight: 1.25,
  letterSpacing: "-0.01em",
};

const subtitleStyle: CSSProperties = {
  fontSize: 13,
  lineHeight: 1.4,
  opacity: 0.55,
};

const vertexShader = `
attribute vec4 iRect;
attribute vec4 iLook;
attribute vec4 iShape;
uniform vec2 uView;
varying vec2 vLocal;
varying vec4 vRect;
varying vec4 vLook;
varying vec4 vShape;

void main() {
  float shadowReach = iShape.y > 0.001 ? iRect.w * 0.42 : 0.0;
  vec2 halfSize = iRect.zw + iLook.x * 1.4 + 2.0 + shadowReach;
  vec2 local = position.xy * halfSize;
  vec2 px = iRect.xy + local;
  gl_Position = vec4(px / uView * 2.0 - 1.0, 0.0, 1.0);
  vLocal = local;
  vRect = iRect;
  vLook = iLook;
  vShape = iShape;
}
`;

const fragmentShader = `
precision highp float;
precision highp sampler2DArray;

uniform sampler2DArray uImages;
uniform float uLayerSize;
uniform float uFade[${MAX_LAYERS}];
uniform vec3 uBackground;
uniform vec3 uPlaceholder;
uniform float uDpr;
varying vec2 vLocal;
varying vec4 vRect;
varying vec4 vLook;
varying vec4 vShape;

const vec2 DISC[8] = vec2[8](
  vec2(0.2500, 0.0000), vec2(-0.3193, 0.2925), vec2(0.0489, -0.5569), vec2(0.4024, 0.5249),
  vec2(-0.7385, -0.1306), vec2(0.6996, -0.4450), vec2(-0.2340, 0.8705), vec2(-0.4463, -0.8593)
);

float roundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  vec2 halfSize = vRect.zw;
  float radius = min(vShape.x, min(halfSize.x, halfSize.y));
  float blur = vLook.x;
  float alpha = vLook.y;
  int layer = int(vLook.z + 0.5);
  float soft = max(0.7 / uDpr, blur * 0.85);
  float sd = roundBox(vLocal, halfSize, radius);
  float coverage = 1.0 - smoothstep(-soft, soft, sd);

  vec2 uv = vLocal / (2.0 * halfSize);
  vec2 tuv = vec2(uv.x + 0.5, 0.5 - uv.y);
  vec2 gx = dFdx(tuv);
  vec2 gy = dFdy(tuv);
  vec3 color;
  if (blur < 0.45) {
    color = textureGrad(uImages, vec3(tuv, float(layer)), gx, gy).rgb;
  } else {
    vec2 reach = blur / (2.0 * halfSize);
    float texels = blur / (2.0 * halfSize.y) * uLayerSize;
    float lod = log2(max(texels * 0.55, 1.0));
    vec3 c = textureLod(uImages, vec3(tuv, float(layer)), lod).rgb;
    vec3 sum = c * c * 0.2;
    for (int k = 0; k < 8; k++) {
      vec3 s = textureLod(uImages, vec3(tuv + DISC[k] * reach * vec2(1.0, -1.0), float(layer)), lod).rgb;
      sum += s * s * 0.1;
    }
    color = sqrt(sum);
  }
  color = mix(uPlaceholder, color, uFade[layer]);
  color = mix(color, uBackground, vLook.w);

  vec4 result = vec4(color, 1.0) * coverage * alpha;
  if (vShape.y > 0.001) {
    float drop = halfSize.y * 0.1 + 2.0;
    float spread = halfSize.y * 0.22 + blur;
    float shadowDistance = roundBox(vLocal + vec2(0.0, drop), halfSize * vec2(0.9, 0.86), radius);
    float shade = vShape.y * (1.0 - smoothstep(-spread, spread, shadowDistance)) * alpha * 0.5;
    result += vec4(0.0, 0.0, 0.0, shade) * (1.0 - result.a);
  }
  if (result.a < 0.002) discard;
  gl_FragColor = result;
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

const createShutter = (
  root: HTMLElement,
  stage: HTMLElement,
  overlay: Overlay,
  settingsRef: { current: Settings },
  itemsRef: { current: SpinShutterItem[] },
  startCard: number,
  callbacks: Callbacks,
): Controller | null => {
  const doc = root.ownerDocument;
  const view = doc.defaultView ?? window;
  const canvas = doc.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }
  stage.appendChild(canvas);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
  const base = new THREE.PlaneGeometry(2, 2);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = base.index;
  geometry.setAttribute("position", base.getAttribute("position"));
  const rectData = new Float32Array(MAX_CARDS * 4);
  const lookData = new Float32Array(MAX_CARDS * 4);
  const shapeData = new Float32Array(MAX_CARDS * 4);
  const rectAttribute = new THREE.InstancedBufferAttribute(rectData, 4);
  const lookAttribute = new THREE.InstancedBufferAttribute(lookData, 4);
  const shapeAttribute = new THREE.InstancedBufferAttribute(shapeData, 4);
  rectAttribute.setUsage(THREE.DynamicDrawUsage);
  lookAttribute.setUsage(THREE.DynamicDrawUsage);
  shapeAttribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("iRect", rectAttribute);
  geometry.setAttribute("iLook", lookAttribute);
  geometry.setAttribute("iShape", shapeAttribute);
  geometry.instanceCount = 0;

  const background = new THREE.Color(0, 0, 0);
  const placeholder = new THREE.Color(0.5, 0.5, 0.5);
  const fades = new Array<number>(MAX_LAYERS).fill(0);
  let layerSize = 512;
  let layerCount = 0;
  let layerAspect = 1;
  let layerData = new Uint8Array(layerSize * layerSize * 4);
  let images = new THREE.DataArrayTexture(layerData, layerSize, layerSize, 1);
  const sampler = doc.createElement("canvas");
  const samplerContext = sampler.getContext("2d", { willReadFrequently: true });

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uImages: { value: images },
      uLayerSize: { value: layerSize },
      uFade: { value: fades },
      uBackground: { value: background },
      uPlaceholder: { value: placeholder },
      uDpr: { value: 1 },
      uView: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    premultipliedAlpha: true,
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  scene.add(mesh);

  const cards: Card[] = Array.from({ length: MAX_CARDS }, () => ({
    alpha: 1,
    phi: 0,
    x: 0,
    y: 0,
    z: 1,
    hw: 0,
    hh: 0,
    lift: 0,
    order: 0,
  }));
  const phi0 = new Float64Array(MAX_CARDS);
  const sorted: number[] = [];
  const projected = { x: 0, y: 0, z: 1, hw: 0, hh: 0 };

  let layers: Layer[] = [];
  let itemsKey = "";
  let captionsKey = "";
  let width = 0;
  let height = 0;
  let dpr = 1;
  let sized = false;
  let theta = 0;
  let omega = 0;
  let aimTarget: number | null = null;
  let aimVelocity = 0;
  let aimResponse = 0.9;
  let brake = 0;
  let tiltOffset = 0;
  let tiltVelocity = 0;
  let dragTilt = 0;
  let focusDepth = 0;
  let focusVelocity = 0;
  let focusReady = false;
  let selected: number | null = null;
  let hovered: number | null = null;
  let featured = -1;
  let reportedFeature = -1;
  let captionShown = -1;
  let captionAlpha = 0;
  let paintedAlpha = -1;
  let pointerInside = false;
  let holdUntil = 0;
  let wheelAt = 0;
  let wheeling = false;
  let introState: "waiting" | "running" | "done" = "waiting";
  let introAt = 0;
  let waitedSince = 0;
  let startTheta = 0;
  let consumed = false;
  let raf = 0;
  let last = 0;
  let visible = false;
  let destroyed = false;
  let lost = false;
  let backgroundAt = -10;
  let press: {
    id: number;
    x: number;
    y: number;
    theta: number;
    moved: boolean;
    samples: { t: number; v: number }[];
  } | null = null;

  const geo = {
    F: 300,
    cx: 0,
    cy: 0,
    D: 3.4,
    tilt: 0.4,
    roll: 0,
    s: 0.34,
    aspect: 1,
    zFront: 2.4,
    zMin: 2.4,
    zMax: 4.4,
    frontHalf: 40,
    key: "",
  };

  const clock = () => performance.now() / 1000;
  const itemCount = () => Math.max(Math.min(itemsRef.current.length, MAX_LAYERS), 1);
  const cardCount = () => {
    const wanted = Math.round(settingsRef.current.count);
    return clamp(wanted > 0 ? wanted : itemsRef.current.length, 1, MAX_CARDS);
  };
  const itemOf = (card: number) => card % itemCount();

  const layoutAngles = () => {
    const settings = settingsRef.current;
    const n = cardCount();
    const size = clamp(Math.round(settings.cluster), 1, n);
    const groups = Math.ceil(n / size);
    const even = TAU / n;
    const spread = clamp(settings.spread, 0.05, 1);
    for (let i = 0; i < n; i++) {
      const group = Math.floor(i / size);
      const slot = i % size;
      const members = Math.min(size, n - group * size);
      phi0[i] = -((group / groups) * TAU + (slot - (members - 1) / 2) * even * spread);
    }
    return n;
  };

  const ensureTexture = (n: number, wantedSize: number) => {
    const grow = wantedSize > layerSize * 1.25;
    if (layerCount === n && !grow) return false;
    layerSize = layerCount === 0 || grow ? wantedSize : layerSize;
    layerCount = n;
    layerData = new Uint8Array(layerSize * layerSize * 4 * n);
    images.dispose();
    images = new THREE.DataArrayTexture(layerData, layerSize, layerSize, n);
    images.format = THREE.RGBAFormat;
    images.type = THREE.UnsignedByteType;
    images.colorSpace = THREE.NoColorSpace;
    images.minFilter = THREE.LinearMipmapLinearFilter;
    images.magFilter = THREE.LinearFilter;
    images.wrapS = THREE.ClampToEdgeWrapping;
    images.wrapT = THREE.ClampToEdgeWrapping;
    images.generateMipmaps = true;
    images.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    images.needsUpdate = true;
    material.uniforms.uImages.value = images;
    material.uniforms.uLayerSize.value = layerSize;
    layers.forEach((layer) => {
      layer.drawn = false;
      layer.shown = false;
    });
    return true;
  };

  const drawLayer = (index: number) => {
    const layer = layers[index];
    if (!layer || !layer.ready || layer.drawn || !samplerContext) return false;
    const image = layer.image;
    const iw = image.naturalWidth;
    const ih = image.naturalHeight;
    if (!iw || !ih) return false;
    const aspect = layerAspect;
    let sw = iw;
    let sh = ih;
    if (iw / ih > aspect) sw = ih * aspect;
    else sh = iw / aspect;
    sampler.width = layerSize;
    sampler.height = layerSize;
    try {
      samplerContext.drawImage(image, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, layerSize, layerSize);
      const pixels = samplerContext.getImageData(0, 0, layerSize, layerSize).data;
      layerData.set(pixels, index * layerSize * layerSize * 4);
    } catch {
      return false;
    }
    layer.drawn = true;
    layer.shown = true;
    images.addLayerUpdate(index);
    images.needsUpdate = true;
    return true;
  };

  const loadImages = () => {
    const items = itemsRef.current.slice(0, MAX_LAYERS);
    const key = items.map((item) => item.src).join("\u0000");
    const captionKey = itemsRef.current.map((item) => `${item.title ?? item.alt}\u0001${item.subtitle ?? ""}`).join("\u0000");
    if (captionKey !== captionsKey) {
      captionsKey = captionKey;
      captionShown = -1;
    }
    if (key === itemsKey) return;
    itemsKey = key;
    layers.forEach((layer) => {
      layer.image.onload = null;
    });
    layers = items.map((item) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      const layer: Layer = { image, ready: false, drawn: false, shown: false, fade: 0 };
      image.onload = () => {
        if (destroyed) return;
        const finish = () => {
          if (destroyed || layer.ready) return;
          layer.ready = true;
          schedule();
        };
        image.decode().then(finish, finish);
      };
      image.src = item.src;
      return layer;
    });
    layerCount = 0;
    fades.fill(0);
  };

  const readSize = () => {
    const settings = settingsRef.current;
    const nextWidth = Math.round(root.clientWidth);
    const nextHeight = Math.round(root.clientHeight);
    if (nextWidth < 2 || nextHeight < 2) {
      sized = false;
      return false;
    }
    const nextDpr = Math.min(view.devicePixelRatio || 1, Math.max(settings.dpr, 0.5));
    if (sized && nextWidth === width && nextHeight === height && nextDpr === dpr) return false;
    sized = true;
    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    return true;
  };

  const syncColors = () => {
    const value = settingsRef.current.backgroundColor;
    if (parseColor(value)) {
      background.setStyle(value, THREE.NoColorSpace);
    } else {
      let node: HTMLElement | null = root;
      let found = false;
      while (node && !found) {
        const fill = toRgb(view.getComputedStyle(node).backgroundColor);
        if (fill && fill !== "transparent" && !/rgba\([^)]*,\s*0\)$/.test(fill)) {
          background.setStyle(fill, THREE.NoColorSpace);
          found = true;
        }
        node = node.parentElement;
      }
      if (!found) {
        const ink = new THREE.Color();
        ink.setStyle(toRgb(view.getComputedStyle(root).color) || "#fff", THREE.NoColorSpace);
        background.setHex(ink.r + ink.g + ink.b > 1.5 ? 0x0a0a0a : 0xffffff, THREE.NoColorSpace);
      }
    }
    const light = background.r * 0.2126 + background.g * 0.7152 + background.b * 0.0722 > 0.6;
    placeholder.copy(background).lerp(new THREE.Color(light ? 0x000000 : 0xffffff), 0.08);
  };

  const project = (phi: number, lift: number, tilt: number) => {
    const st = Math.sin(tilt);
    const ct = Math.cos(tilt);
    let rx = Math.sin(phi);
    let ry = -geo.D * st;
    let rz = Math.cos(phi) - geo.D * ct;
    if (lift) {
      const length = Math.hypot(rx, ry, rz);
      rx -= (rx / length) * lift;
      ry -= (ry / length) * lift;
      rz -= (rz / length) * lift;
    }
    const z = -(ry * st + rz * ct);
    const yc = ry * ct - rz * st;
    const inv = geo.F / Math.max(z, 0.05);
    const sx = rx * inv;
    const sy = yc * inv;
    const cr = Math.cos(geo.roll);
    const sr = Math.sin(geo.roll);
    projected.x = geo.cx + sx * cr - sy * sr;
    projected.y = geo.cy + sx * sr + sy * cr;
    projected.z = z;
    projected.hh = geo.s * 0.5 * inv;
    projected.hw = projected.hh * geo.aspect;
    return projected;
  };

  const measure = () => {
    const settings = settingsRef.current;
    const captionRoom = settings.captions ? CAPTION_ROOM : 0;
    const key = [
      width,
      height,
      captionRoom,
      settings.size,
      settings.aspect,
      settings.tilt,
      settings.roll,
      settings.distance,
      settings.scale,
    ].join("|");
    if (key === geo.key) return;
    geo.key = key;
    geo.s = clamp(settings.size, 0.08, 1.2);
    geo.aspect = clamp(settings.aspect, 0.4, 2.5);
    geo.D = Math.max(clamp(settings.distance, 1.5, 14), 1.25 + geo.s);
    geo.tilt = (clamp(settings.tilt, -80, 80) * Math.PI) / 180;
    geo.roll = (clamp(settings.roll, -90, 90) * Math.PI) / 180;
    geo.F = 1;
    geo.cx = 0;
    geo.cy = 0;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let zMin = Infinity;
    let zMax = -Infinity;
    for (let k = 0; k < 96; k++) {
      const p = project((k / 96) * TAU, 0, geo.tilt);
      minX = Math.min(minX, p.x - p.hw);
      maxX = Math.max(maxX, p.x + p.hw);
      minY = Math.min(minY, p.y - p.hh);
      maxY = Math.max(maxY, p.y + p.hh);
      zMin = Math.min(zMin, p.z);
      zMax = Math.max(zMax, p.z);
    }
    const margin = Math.min(width, height) * 0.06 + 8;
    const availableW = Math.max(width - margin * 2, 40);
    const availableH = Math.max(height - captionRoom - margin * 2, 40);
    const overflow = clamp((1.1 - availableW / availableH) * 0.6, 0, 0.4);
    const fit = Math.min((availableW * (1 + overflow)) / (maxX - minX), availableH / (maxY - minY));
    geo.F = fit * clamp(settings.scale, 0.2, 1.5);
    geo.cx = width / 2 - geo.F * ((minX + maxX) / 2);
    geo.cy = captionRoom + (height - captionRoom) / 2 - geo.F * ((minY + maxY) / 2);
    geo.zMin = zMin;
    geo.zMax = zMax;
    geo.zFront = project(0, 0, geo.tilt).z;
    geo.frontHalf = project(0, 0, geo.tilt).hh;
    if (!focusReady) {
      focusDepth = geo.zFront;
      focusReady = true;
    }
  };

  const schedule = () => {
    if (destroyed || lost || !visible || raf) return;
    raf = requestAnimationFrame(frame);
  };

  const hold = (seconds = 2.4) => {
    holdUntil = Math.max(holdUntil, clock() + seconds);
  };

  const aim = (value: number, response: number) => {
    if (aimTarget === null) aimVelocity = omega;
    aimTarget = value;
    aimResponse = response;
    schedule();
  };

  const frontCard = (angle: number) => {
    const n = cardCount();
    let best = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < n; i++) {
      const distance = Math.abs(wrapPi(phi0[i] + angle));
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    }
    return best;
  };

  const show = (card: number) => {
    const n = layoutAngles();
    const index = ((Math.round(card) % n) + n) % n;
    selected = index;
    callbacks.onPick(itemOf(index));
    const reference = aimTarget ?? theta;
    aim(reference - wrapPi(phi0[index] + reference), settingsRef.current.reduced ? 0.06 : 0.95);
    hold();
  };

  const step = (direction: number) => {
    const n = layoutAngles();
    const current = selected ?? frontCard(aimTarget ?? theta);
    show((current + (direction > 0 ? 1 : -1) + n) % n);
  };

  const release = () => {
    selected = null;
    hold(1.2);
    schedule();
  };

  const replay = () => {
    introState = "waiting";
    waitedSince = 0;
    selected = null;
    aimTarget = null;
    omega = 0;
    brake = 0;
    schedule();
  };

  const hitTest = (clientX: number, clientY: number) => {
    const rect = root.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = height - (clientY - rect.top);
    for (let k = sorted.length - 1; k >= 0; k--) {
      const card = cards[sorted[k]];
      if (Math.abs(x - card.x) <= card.hw && Math.abs(y - card.y) <= card.hh) return sorted[k];
    }
    return null;
  };

  function frame(time: number) {
    raf = 0;
    if (destroyed || lost) return;
    if (!sized) {
      readSize();
      if (!sized) return;
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
    readSize();
    measure();
    const n = layoutAngles();
    const itemTotal = Math.max(layers.length, 1);

    const aspect = clamp(settings.aspect, 0.4, 2.5);
    if (Math.abs(aspect - layerAspect) > 1e-3) {
      layerAspect = aspect;
      layers.forEach((layer) => {
        layer.drawn = false;
      });
    }
    const frontPixels = Math.max(geo.frontHalf * 2 * Math.max(aspect, 1), 1) * dpr;
    const wanted = clamp(Math.ceil(frontPixels / 128) * 128, 256, 1024);
    if (ensureTexture(itemTotal, wanted)) busy = true;
    const centreItem = itemOf(frontCard(theta));
    let drew = false;
    for (let offset = 0; offset < layers.length && !drew; offset++) {
      const index = (centreItem + (offset % 2 ? -(offset + 1) / 2 : offset / 2) + layers.length * 4) % layers.length;
      const layer = layers[index];
      if (layer && layer.ready && !layer.drawn) drew = drawLayer(index);
    }
    if (drew) busy = true;
    let allDrawn = true;
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (!layer.drawn) allDrawn = false;
      if (layer.shown && layer.fade < 1) {
        layer.fade = reduced || introState !== "done" ? 1 : Math.min(1, layer.fade + dt / 0.45);
        busy = true;
      }
      fades[i] = layer.shown ? layer.fade : 0;
    }

    if (introState === "waiting") {
      if (!waitedSince) waitedSince = now;
      busy = true;
      if (allDrawn || now - waitedSince > 2.2) {
        theta = -phi0[clamp(startCard, 0, n - 1)];
        startTheta = theta;
        omega = 0;
        brake = 0;
        if (reduced || !settings.intro) {
          introState = "done";
        } else {
          introState = "running";
          introAt = now;
        }
      }
    }
    let open = 1;
    let appear = 1;
    let appearTop = 1;
    if (introState === "running") {
      const elapsed = now - introAt;
      appearTop = smooth(0, 0.26, elapsed);
      appear = smooth(0.16, 0.46, elapsed);
      const x = clamp((elapsed - 0.22) / 1.9, 0, 1);
      open = x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      open = 1 - Math.pow(1 - open, 1.35);
      busy = true;
      if (elapsed > 2.15) {
        introState = "done";
        open = 1;
        appear = 1;
        appearTop = 1;
        hold(0.4);
      }
    } else if (introState === "waiting") {
      appear = 0;
      appearTop = 0;
    }

    const cruise = (settings.speed * TAU) / 60;
    const touching = !!press || (settings.pauseOnHover && pointerInside);
    const stopped = settings.paused || settings.held || reduced || introState !== "done";
    const holding = touching || selected !== null || now < holdUntil;
    const brakeTarget = stopped || holding ? 0 : 1;
    brake += (brakeTarget - brake) * (1 - Math.exp(-dt / (brakeTarget > brake ? 1.1 : 0.35)));
    if (Math.abs(brakeTarget - brake) > 1e-3) busy = true;
    else brake = brakeTarget;

    if (wheeling && now - wheelAt > 0.16) {
      wheeling = false;
      if (aimTarget !== null) {
        const card = frontCard(aimTarget);
        aimTarget -= wrapPi(phi0[card] + aimTarget);
      }
    }

    if (press && press.moved) {
      busy = true;
    } else if (aimTarget !== null) {
      [theta, aimVelocity] = springTo(theta, aimVelocity, aimTarget, dt, reduced ? 0.06 : aimResponse, 0.94);
      omega = aimVelocity;
      if (Math.abs(theta - aimTarget) < 1e-4 && Math.abs(aimVelocity) < 1e-3) {
        theta = aimTarget;
        aimTarget = null;
        omega = 0;
      } else {
        busy = true;
      }
    } else if (introState === "done") {
      const target = cruise * brake;
      omega += (target - omega) * (1 - Math.exp(-dt / 0.9));
      if (Math.abs(omega - target) < 1e-5) omega = target;
      theta += omega * dt;
      if (Math.abs(omega) > 1e-5 || Math.abs(target) > 1e-5) busy = true;
    }
    if (theta > 1e4 || theta < -1e4) {
      const shift = Math.round(theta / TAU) * TAU;
      theta -= shift;
      if (aimTarget !== null) aimTarget -= shift;
      if (press) press.theta -= shift;
    }

    const tiltGoal = press && press.moved ? dragTilt : 0;
    [tiltOffset, tiltVelocity] = springTo(tiltOffset, tiltVelocity, tiltGoal, dt, reduced ? 0.06 : 0.75, 0.96);
    if (Math.abs(tiltOffset - tiltGoal) < 1e-4 && Math.abs(tiltVelocity) < 1e-4) {
      tiltOffset = tiltGoal;
      tiltVelocity = 0;
    } else {
      busy = true;
    }
    const tilt = clamp(geo.tilt + (tiltOffset * Math.PI) / 180, -1.45, 1.45);

    const direction = settings.speed < 0 ? -1 : 1;
    const startIndex = clamp(startCard, 0, n - 1);
    const lifted = selected !== null && selected < n ? selected : -1;
    sorted.length = 0;
    for (let i = 0; i < n; i++) {
      const card = cards[i];
      let phi = phi0[i] + theta;
      let order = 0;
      if (introState !== "done") {
        const offset = phi0[i] - phi0[startIndex];
        const travel = direction > 0 ? ((offset % TAU) + TAU) % TAU : -((((-offset) % TAU) + TAU) % TAU);
        phi = startTheta + phi0[startIndex] + travel * open;
        order = Math.abs(travel) * 1e-4 * (1 - open);
      }
      const liftGoal = i === lifted ? 0.16 : 0;
      card.lift += (liftGoal - card.lift) * (reduced ? 1 : 1 - Math.exp(-dt / 0.22));
      if (Math.abs(card.lift - liftGoal) > 1e-4) busy = true;
      else card.lift = liftGoal;
      const p = project(phi, card.lift, tilt);
      const scaleIn = 0.94 + 0.06 * appearTop;
      card.phi = phi;
      card.x = p.x;
      card.y = p.y;
      card.z = p.z;
      card.hw = p.hw * scaleIn;
      card.hh = p.hh * scaleIn;
      card.order = p.z + order;
      card.alpha = i === startIndex ? appearTop : appear;
      sorted.push(i);
    }
    sorted.sort((a, b) => cards[b].order - cards[a].order);

    let candidate = selected !== null && selected < n ? selected : hovered !== null && hovered < n ? hovered : -1;
    if (candidate < 0) {
      candidate = frontCard(theta);
      if (featured >= 0 && featured < n && candidate !== featured) {
        const current = Math.abs(wrapPi(cards[featured].phi));
        const next = Math.abs(wrapPi(cards[candidate].phi));
        if (current - next < 0.04) candidate = featured;
      }
    }
    featured = candidate;
    const featuredItem = itemOf(featured);
    if (featuredItem !== reportedFeature && introState === "done") {
      reportedFeature = featuredItem;
      callbacks.onFeature(featuredItem);
    }

    const focusTarget =
      introState !== "done"
        ? geo.zFront
        : selected !== null && selected < n
          ? cards[selected].z
          : hovered !== null && hovered < n
            ? cards[hovered].z
            : geo.zFront;
    [focusDepth, focusVelocity] = springTo(focusDepth, focusVelocity, focusTarget, dt, reduced ? 0.04 : 0.42, 1);
    if (Math.abs(focusDepth - focusTarget) > 1e-4 || Math.abs(focusVelocity) > 1e-4) busy = true;

    const aperture = clamp(settings.aperture, 0, 1);
    const span = Math.max((geo.zMax - geo.zMin) / geo.zMax, 0.05);
    const frontHeight = geo.frontHalf * 2;
    const blurScale = (aperture * 0.17 * frontHeight) / span;
    const blurLimit = frontHeight * 0.2;
    const haze = clamp(settings.haze, 0, 1);
    const shadow = clamp(settings.shadow, 0, 1);
    const radius = Math.max(settings.radius, 0);
    const depthRange = Math.max(geo.zMax - geo.zMin, 1e-3);
    for (let k = 0; k < n; k++) {
      const index = sorted[k];
      const card = cards[index];
      const depth = clamp((card.z - geo.zMin) / depthRange, 0, 1);
      const blur = Math.min((blurScale * Math.abs(card.z - focusDepth)) / card.z, blurLimit);
      const o = k * 4;
      rectData[o] = card.x;
      rectData[o + 1] = card.y;
      rectData[o + 2] = card.hw;
      rectData[o + 3] = card.hh;
      lookData[o] = blur;
      lookData[o + 1] = card.alpha;
      lookData[o + 2] = itemOf(index) % itemTotal;
      lookData[o + 3] = haze * Math.pow(depth, 1.25) * 0.85;
      shapeData[o] = (radius * card.hh) / Math.max(geo.frontHalf, 1);
      shapeData[o + 1] = shadow * (1 - 0.55 * depth);
      shapeData[o + 2] = 0;
      shapeData[o + 3] = 0;
    }
    geometry.instanceCount = n;
    rectAttribute.needsUpdate = true;
    lookAttribute.needsUpdate = true;
    shapeAttribute.needsUpdate = true;

    const u = material.uniforms;
    u.uView.value.set(width, height);
    u.uDpr.value = dpr;

    const fast = Math.abs(omega) > 1.4 || (press !== null && press.moved);
    const showCaption = settings.captions && introState === "done" && !fast;
    if (captionShown !== featuredItem && captionAlpha < 0.02) {
      captionShown = featuredItem;
      const item = itemsRef.current[featuredItem];
      overlay.title.textContent = item ? item.title ?? item.alt : "";
      overlay.subtitle.textContent = item?.subtitle ?? "";
      overlay.subtitle.style.display = item?.subtitle ? "" : "none";
    }
    const captionGoal = showCaption && captionShown === featuredItem ? 1 : 0;
    captionAlpha += (captionGoal - captionAlpha) * (reduced ? 1 : 1 - Math.exp(-dt / (captionGoal > captionAlpha ? 0.2 : 0.09)));
    if (Math.abs(captionGoal - captionAlpha) < 0.003) captionAlpha = captionGoal;
    else busy = true;
    if (Math.abs(captionAlpha - paintedAlpha) > 0.002) {
      paintedAlpha = captionAlpha;
      overlay.caption.style.opacity = captionAlpha.toFixed(3);
    }

    renderer.render(scene, camera);

    if (busy || press || (holdUntil > now && introState === "done")) schedule();
  }

  const onMove = (event: PointerEvent) => {
    const settings = settingsRef.current;
    if (event.pointerType !== "touch") {
      pointerInside = true;
      if (!press) {
        const hit = hitTest(event.clientX, event.clientY);
        if (hit !== hovered) hovered = hit;
        const cursor = hit !== null ? "pointer" : settings.draggable ? "grab" : "";
        if (root.style.cursor !== cursor) root.style.cursor = cursor;
      }
    }
    if (press && press.id === event.pointerId) {
      const dx = event.clientX - press.x;
      const dy = press.y - event.clientY;
      if (!press.moved && Math.hypot(dx, dy) > 6 && settings.draggable) {
        press.moved = true;
        aimTarget = null;
        selected = null;
        hovered = null;
        omega = 0;
        root.style.cursor = "grabbing";
        try {
          stage.setPointerCapture(event.pointerId);
        } catch {}
      }
      if (press.moved) {
        const cr = Math.cos(geo.roll);
        const sr = Math.sin(geo.roll);
        const along = dx * cr + dy * sr;
        const across = -dx * sr + dy * cr;
        const radiusPixels = Math.max(geo.F / Math.max(geo.zFront, 0.1), 20);
        theta = press.theta + along / radiusPixels;
        dragTilt = clamp(-across / 5, -38, 38);
        const t = performance.now();
        press.samples.push({ t, v: theta });
        while (press.samples.length > 2 && t - press.samples[0].t > 110) press.samples.shift();
      }
    }
    schedule();
  };

  const onDown = (event: PointerEvent) => {
    if (!event.isPrimary || event.button > 0) return;
    consumed = false;
    press = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      theta,
      moved: false,
      samples: [{ t: performance.now(), v: theta }],
    };
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
        velocity = (recent[recent.length - 1].v - recent[0].v) / span;
      }
      const settings = settingsRef.current;
      omega = settings.reduced ? 0 : clamp(velocity, -5, 5);
      aimTarget = null;
      root.style.cursor = settings.draggable ? "grab" : "";
      hold();
    }
    schedule();
  };

  const onClick = (event: MouseEvent) => {
    if (consumed) {
      consumed = false;
      return;
    }
    const card = hitTest(event.clientX, event.clientY);
    if (card === null) {
      if (selected !== null) release();
      return;
    }
    const atFront = Math.abs(wrapPi(cards[card].phi)) < 0.06;
    if (card === selected && atFront) {
      callbacks.onSelect(itemOf(card));
    } else {
      show(card);
    }
  };

  const onLeave = (event: PointerEvent) => {
    if (press && press.id === event.pointerId) return;
    pointerInside = false;
    hovered = null;
    root.style.cursor = "";
    if (selected !== null) {
      selected = null;
      hold(1.6);
    } else {
      hold(0.6);
    }
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
    const n = layoutAngles();
    selected = null;
    aim((aimTarget ?? theta) + (delta / 100) * (TAU / n), settingsRef.current.reduced ? 0.06 : 0.55);
    wheeling = true;
    wheelAt = clock();
    hold();
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.target !== root) return;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      step(-1);
    } else if (event.key === "Home") {
      event.preventDefault();
      show(0);
    } else if (event.key === "End") {
      event.preventDefault();
      show(cardCount() - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const card = selected ?? frontCard(theta);
      callbacks.onSelect(itemOf(card));
    } else if (event.key === "Escape") {
      if (selected !== null) {
        event.preventDefault();
        release();
      }
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

  const resizer = new ResizeObserver(() => {
    if (readSize()) schedule();
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
    loadImages();
    schedule();
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  readSize();
  syncColors();
  loadImages();
  renderer.compile(scene, camera);
  schedule();

  return {
    sync: () => {
      readSize();
      syncColors();
      loadImages();
      geo.key = "";
      schedule();
    },
    step,
    show,
    release,
    replay,
    destroy: () => {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
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
      root.style.cursor = "";
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      layers.forEach((layer) => {
        layer.image.onload = null;
      });
      images.dispose();
      material.dispose();
      geometry.dispose();
      base.dispose();
      renderer.dispose();
      if (!renderer.getContext().isContextLost()) renderer.forceContextLoss();
      canvas.remove();
    },
  };
};

export const SpinShutter = forwardRef<SpinShutterHandle, SpinShutterProps>(function SpinShutter(
  {
    items = defaultItems,
    count = 0,
    startIndex = 0,
    aspect = 1,
    size = 0.38,
    radius = 14,
    tilt = 14,
    roll = -24,
    distance = 3.2,
    scale = 1,
    cluster = 1,
    spread = 0.6,
    speed = 1.2,
    aperture = 0.45,
    haze = 0.3,
    shadow = 0.35,
    intro = true,
    pauseOnHover = true,
    draggable = true,
    wheel = true,
    captions = true,
    backgroundColor = "transparent",
    paused = false,
    dpr = 2,
    ariaLabel = "Photo orbit. Point at a photo to focus on it, click to bring it forward, drag or scroll to turn the orbit.",
    onFocusChange,
    onSelect,
    className,
    style,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const subtitleRef = useRef<HTMLSpanElement>(null);
  const controllerRef = useRef<Controller | null>(null);
  const reduced = useSyncExternalStore(subscribeToMotion, readMotion, () => false);
  const list = items.length ? items : defaultItems;
  const itemsRef = useRef(list);
  const [initialCard] = useState(() => Math.max(Math.round(startIndex), 0));
  const [active, setActive] = useState(initialCard % list.length);
  const [picked, setPicked] = useState<number | null>(null);
  const [held, setHeld] = useState(false);
  const [failed, setFailed] = useState(false);

  const settings: Settings = {
    count,
    aspect,
    size,
    radius,
    tilt,
    roll,
    distance,
    scale,
    cluster,
    spread,
    speed,
    aperture,
    haze,
    shadow,
    intro,
    pauseOnHover,
    draggable,
    wheel,
    captions,
    backgroundColor,
    paused,
    dpr,
    reduced,
    held,
  };
  const settingsRef = useRef(settings);
  const callbacksRef = useRef({ onFocusChange, onSelect });

  useEffect(() => {
    settingsRef.current = settings;
    itemsRef.current = list;
    callbacksRef.current = { onFocusChange, onSelect };
    controllerRef.current?.sync();
  });

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const caption = captionRef.current;
    const title = titleRef.current;
    const subtitle = subtitleRef.current;
    if (!root || !stage || !caption || !title || !subtitle) return;
    const controller = createShutter(root, stage, { caption, title, subtitle }, settingsRef, itemsRef, initialCard, {
      onFeature: (index) => {
        setActive(index);
        const item = itemsRef.current[index];
        if (item) callbacksRef.current.onFocusChange?.(item, index);
      },
      onPick: (index) => setPicked(index),
      onSelect: (index) => {
        const item = itemsRef.current[index];
        if (!item) return;
        callbacksRef.current.onSelect?.(item, index);
        if (item.href) window.location.assign(item.href);
      },
    });
    if (!controller) {
      const frame = requestAnimationFrame(() => setFailed(true));
      return () => cancelAnimationFrame(frame);
    }
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [initialCard]);

  useImperativeHandle(
    ref,
    () => ({
      next: () => controllerRef.current?.step(1),
      previous: () => controllerRef.current?.step(-1),
      show: (index: number) => controllerRef.current?.show(index),
      release: () => controllerRef.current?.release(),
      replay: () => controllerRef.current?.replay(),
    }),
    [],
  );

  const backgroundValue = backgroundColor.trim().toLowerCase();
  const transparent = backgroundValue === "transparent" || backgroundValue === "";
  const light = !transparent && isLight(backgroundValue);
  const ink = transparent ? "currentColor" : light ? "#0a0a0a" : "#fafafa";
  const announced = picked !== null ? list[picked] : undefined;

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
      onKeyDown={(event) => {
        if (event.key === " " && event.target === event.currentTarget) {
          event.preventDefault();
          setHeld((value) => !value);
        }
      }}
    >
      <div ref={stageRef} style={stageStyle} />
      {failed ? (
        <div
          style={{
            position: "absolute",
            inset: "12% 8%",
            display: "flex",
            flexWrap: "wrap",
            alignContent: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          {list.slice(0, 8).map((item, index) => (
            <img
              key={`${item.src}-${index}`}
              src={item.src}
              alt={item.alt}
              style={{ width: 96, height: 96 / aspect, objectFit: "cover", borderRadius: radius }}
            />
          ))}
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
        {announced ? announced.title ?? announced.alt : ""}
      </div>
      <div ref={captionRef} aria-hidden="true" style={captionStyle}>
        <span ref={titleRef} style={titleStyle} />
        <span ref={subtitleRef} style={subtitleStyle} />
      </div>
    </div>
  );
});

SpinShutter.displayName = "SpinShutter";

export default SpinShutter;
