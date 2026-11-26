"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export interface ArcListItem {
  title: string;
  /**
   * Drawn in place of the title text. The arc measures each label from its own
   * box (offsetWidth/offsetHeight), so anything that lays out — a logo sized in
   * `em` against the wheel's font-size — rides the curve exactly as type does.
   * `title` is still required: it is what the listbox and the live region say.
   */
  logo?: ReactNode;
  image?: string;
  alt?: string;
  subtitle?: string;
  href?: string;
}

export type ArcListOrientation = "auto" | "vertical" | "horizontal";

export type ArcListImageSide = "left" | "right" | "none";

export type ArcListTransition = "blur" | "fade" | "slide";

export interface ArcListHandle {
  next: () => void;
  previous: () => void;
  goTo: (index: number) => void;
}

export interface ArcListProps {
  items?: ArcListItem[];
  startIndex?: number;
  orientation?: ArcListOrientation;
  imageSide?: ArcListImageSide;
  curve?: number;
  spacing?: number;
  visible?: number;
  fade?: number;
  shrink?: number;
  blur?: number;
  fontSize?: number;
  fontWeight?: number;
  textColor?: string;
  activeColor?: string;
  backgroundColor?: string;
  indicator?: boolean;
  subtitles?: boolean;
  autoplay?: boolean;
  interval?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
  wheel?: boolean;
  draggable?: boolean;
  smoothing?: number;
  inertia?: number;
  imageWidth?: number;
  imageAspect?: number;
  imageRadius?: number;
  gap?: number;
  transition?: ArcListTransition;
  imageBlur?: number;
  onChange?: (index: number, item: ArcListItem) => void;
  onSelect?: (index: number, item: ArcListItem) => void;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

interface Settings {
  orientation: ArcListOrientation;
  imageSide: ArcListImageSide;
  curve: number;
  spacing: number;
  visible: number;
  fade: number;
  shrink: number;
  blur: number;
  fontSize: number;
  autoplay: boolean;
  interval: number;
  pauseOnHover: boolean;
  loop: boolean;
  wheel: boolean;
  draggable: boolean;
  smoothing: number;
  inertia: number;
  imageWidth: number;
  imageAspect: number;
  imageRadius: number;
  gap: number;
  transition: ArcListTransition;
  imageBlur: number;
  reduced: boolean;
}

interface Controller {
  sync: () => void;
  step: (direction: number) => void;
  goTo: (index: number) => void;
  destroy: () => void;
}

interface Callbacks {
  onActive: (index: number) => void;
  onSelect: (index: number) => void;
}

interface Label {
  el: HTMLElement;
  title: HTMLElement | null;
  fill: HTMLElement | null;
  sub: HTMLElement | null;
  hover: number;
  lit: number;
  shown: boolean;
  width: number;
  height: number;
}

interface Layer {
  el: HTMLElement;
  plate: HTMLElement | null;
  shade: HTMLElement | null;
  shown: boolean;
}

interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface Geometry {
  horizontal: boolean;
  dir: number;
  anchorX: number;
  anchorY: number;
  spacing: number;
  step: number;
  radius: number;
  fontSize: number;
  wheelX: number;
  wheelY: number;
  half: number;
  rootWidth: number;
  rootHeight: number;
  frame: Box | null;
  frameSize: number;
  centers: number[];
  total: number;
}

interface Drag {
  id: number;
  x: number;
  y: number;
  start: number;
  moved: boolean;
  lastPos: number;
  lastTime: number;
  velocity: number;
  hit: number;
}

const DEFAULT_ITEMS: ArcListItem[] = [
  {
    title: "Sunlit Stair",
    subtitle: "Lena Ortiz",
    image: "https://pro.reactbits.dev/demo-media/architecture-stair.webp",
    alt: "Cream stair rising along a sunlit courtyard wall under a slice of blue sky",
  },
  {
    title: "Reflecting Pool",
    subtitle: "Iona Vale",
    image: "https://pro.reactbits.dev/demo-media/architecture-pool.webp",
    alt: "Figure in black crossing a shallow pool before a tall cream wall",
  },
  {
    title: "Courtyard",
    subtitle: "Theo Marsh",
    image: "https://pro.reactbits.dev/demo-media/architecture-courtyard.webp",
    alt: "Two round pines beside a white stone wall in soft, hazy light",
  },
  {
    title: "Monolith",
    subtitle: "Mira Sol",
    image: "https://pro.reactbits.dev/demo-media/architecture-monolith.webp",
    alt: "Stepped board-formed concrete towers against a pale teal sky",
  },
  {
    title: "Ribbons",
    subtitle: "Kenji Ara",
    image: "https://pro.reactbits.dev/demo-media/architecture-ribbons.webp",
    alt: "White facade ribbons flowing in parallel waves",
  },
  {
    title: "Whitewash",
    subtitle: "June Atlas",
    image: "https://pro.reactbits.dev/demo-media/architecture-whitewash.webp",
    alt: "Whitewashed plaster block against a soft cloudy sky",
  },
  {
    title: "Twist",
    subtitle: "Ada Brenner",
    image: "https://pro.reactbits.dev/demo-media/architecture-twist.webp",
    alt: "White balconies twisting in an S-curve down a tiled facade against pale sky",
  },
  {
    title: "Wave",
    subtitle: "Sami Okoro",
    image: "https://pro.reactbits.dev/demo-media/architecture-wave.webp",
    alt: "Navy and white striped towers curving together around a patch of blue sky",
  },
  {
    title: "Drum",
    subtitle: "Nora Quist",
    image: "https://pro.reactbits.dev/demo-media/architecture-drum.webp",
    alt: "Rounded white concrete drum against a bright blue sky",
  },
  {
    title: "Spires",
    subtitle: "Felix Ward",
    image: "https://pro.reactbits.dev/demo-media/architecture-spires.webp",
    alt: "Tapering white spires rising against a clear blue sky",
  },
];

const ARC_STEP = (26 * Math.PI) / 180;
const ARC_EDGE = 0.8;
const TAU = Math.PI * 2;

const layoutStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
};

const frameStyle: CSSProperties = {
  position: "relative",
  flex: "none",
  overflow: "hidden",
  isolation: "isolate",
  backgroundColor: "rgba(127, 127, 127, 0.12)",
  boxShadow: "0 18px 40px -26px rgba(0, 0, 0, 0.4)",
  transform: "translateZ(0)",
};

const layerStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  overflow: "hidden",
  visibility: "hidden",
};

const plateStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const shadeStyle: CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundColor: "#000",
  opacity: 0,
  pointerEvents: "none",
};

const wheelStyle: CSSProperties = {
  position: "relative",
  minWidth: 0,
  minHeight: 0,
  outline: "none",
  userSelect: "none",
  WebkitUserSelect: "none",
  WebkitTapHighlightColor: "transparent",
};

const itemStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  whiteSpace: "nowrap",
  lineHeight: 1.15,
  letterSpacing: "-0.02em",
  transformOrigin: "0 0",
  visibility: "hidden",
  cursor: "pointer",
  willChange: "transform, opacity",
};

const titleStyle: CSSProperties = {
  position: "relative",
  display: "inline-block",
};

const fillStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  opacity: 0,
  pointerEvents: "none",
};

const subStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: "100%",
  marginTop: "0.32em",
  fontSize: "0.44em",
  fontWeight: 500,
  letterSpacing: "0.01em",
  opacity: 0,
  whiteSpace: "nowrap",
  pointerEvents: "none",
};

const indicatorStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  width: "0.6em",
  height: "0.6em",
  opacity: 0.8,
  pointerEvents: "none",
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const finite = (value: number, fallback: number) => (Number.isFinite(value) ? value : fallback);

const smooth = (value: number) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

const springTo = (value: number, velocity: number, target: number, dt: number, response: number, ratio: number) => {
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

const subscribeToMotion = (notify: () => void) => {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

const readMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const createArc = (
  root: HTMLDivElement,
  settingsRef: { current: Settings },
  countRef: { current: number },
  callbacks: Callbacks,
  startIndex: number,
): Controller => {
  const doc = root.ownerDocument;
  const view = doc.defaultView ?? window;
  const S = () => settingsRef.current;
  const count = () => Math.max(countRef.current, 1);
  const wrap = (index: number) => ((index % count()) + count()) % count();
  const now = () => view.performance.now() / 1000;

  let layoutNode: HTMLElement | null = null;
  let frameNode: HTMLElement | null = null;
  let wheelNode: HTMLElement | null = null;
  let indicatorNode: HTMLElement | null = null;
  let labels: Label[] = [];
  let layers: Layer[] = [];

  const collect = () => {
    layoutNode = root.querySelector<HTMLElement>("[data-arc-layout]");
    frameNode = root.querySelector<HTMLElement>("[data-arc-frame]");
    wheelNode = root.querySelector<HTMLElement>("[data-arc-wheel]");
    indicatorNode = root.querySelector<HTMLElement>("[data-arc-indicator]");
    const before = labels;
    labels = Array.from(root.querySelectorAll<HTMLElement>("[data-arc-item]")).map((el, index) => {
      const same = before[index]?.el === el ? before[index] : null;
      return {
        el,
        title: el.querySelector<HTMLElement>("[data-arc-title]"),
        fill: el.querySelector<HTMLElement>("[data-arc-fill]"),
        sub: el.querySelector<HTMLElement>("[data-arc-sub]"),
        hover: same ? same.hover : 0,
        lit: same ? same.lit : 1,
        shown: same ? same.shown : false,
        width: same ? same.width : 0,
        height: same ? same.height : 0,
      };
    });
    const previous = layers;
    layers = Array.from(root.querySelectorAll<HTMLElement>("[data-arc-layer]")).map((el, index) => ({
      el,
      plate: el.querySelector<HTMLElement>("[data-arc-plate]"),
      shade: el.querySelector<HTMLElement>("[data-arc-shade]"),
      shown: previous[index]?.el === el ? previous[index].shown : false,
    }));
  };

  collect();

  const limit = (value: number) => (S().loop ? value : clamp(value, 0, count() - 1));

  let pos = limit(Math.round(finite(startIndex, 0)));
  let target = pos;
  let velocity = 0;
  let elapsed = 0;
  let raf = 0;
  let last = 0;
  let visible = true;
  let hovering = false;
  let hoverIndex = -1;
  let reported = wrap(Math.round(target));
  let snapTimer = 0;
  let destroyed = false;
  let drag: Drag | null = null;
  let g: Geometry = {
    horizontal: false,
    dir: 1,
    anchorX: 0,
    anchorY: 0,
    spacing: 76,
    step: 0,
    radius: Infinity,
    fontSize: 30,
    wheelX: 0,
    wheelY: 0,
    half: 1,
    rootWidth: 1,
    rootHeight: 1,
    frame: null,
    frameSize: 1,
    centers: [0, 1],
    total: 1,
  };

  const autoplayOn = () => {
    const settings = S();
    return settings.autoplay && !settings.reduced && count() > 1 && visible && !doc.hidden;
  };

  const interval = () => clamp(finite(S().interval, 3.5), 0.5, 60);

  const offset = (index: number) => {
    const d = index - pos;
    if (!S().loop) return d;
    const n = count();
    return d - n * Math.round(d / n);
  };

  const gapAt = (index: number) => {
    const n = count();
    if (n < 2) return g.fontSize * 4;
    const i = clamp(index, 0, n - 2);
    return Math.max(g.centers[i + 1] - g.centers[i], 1);
  };

  const arcAt = (p: number) => {
    const n = count();
    if (!g.horizontal) return p * g.spacing;
    if (S().loop) {
      const cycles = Math.floor(p / n);
      const rest = p - cycles * n;
      const k = Math.min(Math.floor(rest), n - 1);
      const a = g.centers[k];
      return cycles * g.total + a + (g.centers[k + 1] - a) * (rest - k);
    }
    if (p <= 0) return p * gapAt(0);
    if (p >= n - 1) return g.centers[n - 1] + (p - (n - 1)) * gapAt(n - 2);
    const k = Math.floor(p);
    return g.centers[k] + (g.centers[k + 1] - g.centers[k]) * (p - k);
  };

  const posAt = (s: number) => {
    const n = count();
    if (!g.horizontal) return s / g.spacing;
    if (S().loop) {
      const cycles = Math.floor(s / g.total);
      const rest = s - cycles * g.total;
      let k = 0;
      while (k < n - 1 && g.centers[k + 1] <= rest) k++;
      return cycles * n + k + (rest - g.centers[k]) / Math.max(g.centers[k + 1] - g.centers[k], 1e-6);
    }
    if (s <= 0) return s / gapAt(0);
    if (s >= g.centers[n - 1]) return n - 1 + (s - g.centers[n - 1]) / gapAt(n - 2);
    let k = 0;
    while (k < n - 2 && g.centers[k + 1] <= s) k++;
    return k + (s - g.centers[k]) / Math.max(g.centers[k + 1] - g.centers[k], 1e-6);
  };

  const measure = () => {
    const settings = S();
    const width = Math.max(1, root.clientWidth);
    const height = Math.max(1, root.clientHeight);
    const hasImage = settings.imageSide !== "none" && !!frameNode;
    const narrow = width < 640;
    const horizontal = settings.orientation === "horizontal" || (settings.orientation === "auto" && narrow);
    const pad = clamp(Math.min(width, height) * 0.06, 16, 56);
    const scale = clamp(Math.min(width / 960, height / 560), 0.62, 1.25);
    const typeScale = horizontal ? clamp(Math.min(width / 440, height / 520), 0.66, 1.15) : scale * (narrow ? 0.85 : 1);
    const fontSize = clamp(finite(settings.fontSize, 30), 8, 160) * typeScale;
    const spacing = clamp(finite(settings.spacing, 76), 12, 400) * typeScale;
    const gap = clamp(finite(settings.gap, 64), 0, 400) * scale * (horizontal || narrow ? 0.5 : 1);
    const dialHeight = fontSize * 2.6;
    if (layoutNode) {
      layoutNode.style.flexDirection = horizontal || narrow ? "column" : settings.imageSide === "right" ? "row-reverse" : "row";
      layoutNode.style.padding = `${pad}px`;
      layoutNode.style.gap = `${gap}px`;
    }
    let frameSize = 1;
    if (frameNode && hasImage) {
      const aspect = clamp(finite(settings.imageAspect, 0.78), 0.3, 3);
      const cap = clamp(finite(settings.imageWidth, 340), 60, 1600) * scale;
      let frameWidth: number;
      let frameHeight: number;
      if (horizontal) {
        frameHeight = Math.min(height - pad * 2 - gap - dialHeight, (width - pad * 2) / aspect, cap / aspect);
        frameWidth = frameHeight * aspect;
      } else if (narrow) {
        frameHeight = Math.min(height * 0.46, (width - pad * 2) / aspect);
        frameWidth = frameHeight * aspect;
      } else {
        frameWidth = Math.min(cap, (width - pad * 2) * 0.46);
        frameHeight = frameWidth / aspect;
        if (frameHeight > height - pad * 2) {
          frameHeight = height - pad * 2;
          frameWidth = frameHeight * aspect;
        }
      }
      frameWidth = Math.max(frameWidth, 1);
      frameHeight = Math.max(frameHeight, 1);
      frameSize = Math.min(frameWidth, frameHeight);
      frameNode.style.width = `${frameWidth.toFixed(1)}px`;
      frameNode.style.height = `${frameHeight.toFixed(1)}px`;
      frameNode.style.borderRadius = `${clamp(finite(settings.imageRadius, 14), 0, 400)}px`;
    }
    if (!wheelNode) return;
    wheelNode.style.fontSize = `${fontSize.toFixed(2)}px`;
    let widest = 0;
    labels.forEach((label) => {
      label.width = label.el.offsetWidth;
      label.height = label.el.offsetHeight;
      widest = Math.max(widest, label.width);
    });
    if (horizontal) {
      wheelNode.style.flex = "none";
      wheelNode.style.alignSelf = "stretch";
      wheelNode.style.height = `${dialHeight.toFixed(1)}px`;
    } else if (narrow && hasImage) {
      wheelNode.style.flex = "1 1 0";
      wheelNode.style.alignSelf = "stretch";
      wheelNode.style.height = "auto";
    } else {
      const lean = clamp(finite(settings.curve, 0.5), 0, 1) * ARC_STEP * 1.1;
      const sweep = lean > 1e-4 ? (spacing / (lean / 1.1)) * (1 - Math.cos(lean)) : 0;
      const extent = fontSize * 1.25 + widest * Math.cos(lean) - sweep;
      wheelNode.style.flex = hasImage ? `0 1 ${Math.max(extent, fontSize * 3).toFixed(1)}px` : "1 1 0";
      wheelNode.style.alignSelf = "stretch";
      wheelNode.style.height = "auto";
    }
    wheelNode.style.touchAction = settings.draggable && !horizontal ? "none" : "pan-y";
    const rootRect = root.getBoundingClientRect();
    const wheelRect = wheelNode.getBoundingClientRect();
    const ratioX = rootRect.width > 0 ? width / rootRect.width : 1;
    const ratioY = rootRect.height > 0 ? height / rootRect.height : 1;
    const wheelX = (wheelRect.left - rootRect.left) * ratioX;
    const wheelY = (wheelRect.top - rootRect.top) * ratioY;
    const wheelWidth = wheelNode.clientWidth;
    const wheelHeight = wheelNode.clientHeight;
    let frame: Box | null = null;
    if (frameNode && hasImage) {
      const rect = frameNode.getBoundingClientRect();
      frame = {
        left: (rect.left - rootRect.left) * ratioX,
        top: (rect.top - rootRect.top) * ratioY,
        right: (rect.right - rootRect.left) * ratioX,
        bottom: (rect.bottom - rootRect.top) * ratioY,
      };
    }
    const dir = horizontal || !hasImage || narrow || settings.imageSide !== "right" ? 1 : -1;
    const curve = clamp(finite(settings.curve, 0.5), 0, 1);
    const n = count();
    const centers: number[] = [0];
    const word = spacing * 0.45;
    for (let i = 1; i <= n; i++) {
      const previous = labels[i - 1]?.width ?? fontSize * 4;
      const next = labels[i % n]?.width ?? fontSize * 4;
      centers.push(centers[i - 1] + (previous + next) / 2 + word);
    }
    let anchorX = wheelWidth / 2;
    let anchorY = fontSize * 0.75;
    let step = 0;
    let radius = Infinity;
    const half = Math.max(wheelWidth / 2, 1);
    if (horizontal) {
      const edge = curve * ARC_EDGE;
      radius = edge > 1e-4 ? half / edge : Infinity;
    } else {
      const inset =
        narrow && frame
          ? Math.max(fontSize * 0.9, frame.left - wheelX + fontSize * 0.72)
          : hasImage
            ? fontSize * 1.25
            : Math.max(fontSize * 1.25, (wheelWidth - widest) / 2 + fontSize * 0.6);
      anchorX = dir > 0 ? inset : wheelWidth - inset;
      anchorY = wheelHeight / 2;
      step = curve * ARC_STEP;
      radius = step > 1e-4 ? spacing / step : Infinity;
    }
    g = {
      horizontal,
      dir,
      anchorX,
      anchorY,
      spacing,
      step,
      radius,
      fontSize,
      wheelX,
      wheelY,
      half,
      rootWidth: width,
      rootHeight: height,
      frame,
      frameSize,
      centers,
      total: centers[n],
    };
    labels.forEach((label) => {
      if (!label.sub) return;
      if (horizontal) {
        label.sub.style.left = "50%";
        label.sub.style.right = "auto";
        label.sub.style.transform = "translateX(-50%)";
      } else {
        label.sub.style.left = dir > 0 ? "0" : "auto";
        label.sub.style.right = dir > 0 ? "auto" : "0";
        label.sub.style.transform = "none";
      }
    });
    if (indicatorNode) indicatorNode.style.display = horizontal ? "none" : "block";
  };

  const clearance = (x: number, y: number, theta: number, size: number, label: Label) => {
    const w = label.width;
    const h = label.height;
    const x0 = g.horizontal ? -w / 2 : g.dir > 0 ? 0 : -w;
    const x1 = x0 + w;
    const cos = Math.cos(theta) * size;
    const sin = Math.sin(theta) * size;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (let c = 0; c < 4; c++) {
      const lx = c & 1 ? x1 : x0;
      const ly = c & 2 ? h / 2 : -h / 2;
      const px = g.wheelX + x + lx * cos - ly * sin;
      const py = g.wheelY + y + lx * sin + ly * cos;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
    const band = g.fontSize * 1.6;
    let value = smooth((Math.min(minY, g.rootHeight - maxY) - 2) / band);
    if (!g.horizontal) value *= smooth((Math.min(minX, g.rootWidth - maxX) - 2) / band);
    if (g.frame) {
      const apart = Math.max(g.frame.left - maxX, minX - g.frame.right, g.frame.top - maxY, minY - g.frame.bottom);
      value *= g.horizontal ? smooth((apart + 4) / (g.fontSize * 0.5)) : smooth((apart - g.fontSize * 0.35) / band);
    }
    return value;
  };

  const render = (dt: number) => {
    const settings = S();
    const n = count();
    let busy = false;
    const visibleCount = clamp(Math.round(finite(settings.visible, 3)), 1, 12);
    const span = visibleCount + 1;
    const exponent = 0.6 + clamp(finite(settings.fade, 0.35), 0, 1) * 1.8;
    const shrink = clamp(finite(settings.shrink, 0.1), 0, 1);
    const blur = clamp(finite(settings.blur, 0), 0, 24);
    const playing = autoplayOn();
    const progress = clamp(elapsed / interval(), 0, 1);
    const current = wrap(Math.round(target));
    const ease = 1 - Math.exp(-dt / 0.22);
    const arcPos = g.horizontal ? arcAt(pos) : 0;
    labels.forEach((label, index) => {
      if (index >= n) return;
      const d = offset(index);
      const distance = Math.abs(d);
      const el = label.el;
      if (index === current) {
        if (playing) label.lit = progress;
        else {
          label.lit += (1 - label.lit) * (settings.reduced ? 1 : ease);
          if (1 - label.lit > 0.002) busy = true;
          else label.lit = 1;
        }
      }
      let x: number;
      let y: number;
      let theta: number;
      let reach = 1;
      if (g.horizontal) {
        let o = g.centers[index] - arcPos;
        if (settings.loop) o -= g.total * Math.round(o / g.total);
        reach = Math.max(0, 1 - Math.abs(o) / (g.half * 2));
        theta = g.radius === Infinity ? 0 : o / g.radius;
        x = g.anchorX + (g.radius === Infinity ? o : g.radius * Math.sin(theta));
        y = g.anchorY + (g.radius === Infinity ? 0 : g.radius * (1 - Math.cos(theta)));
      } else {
        const angle = d * g.step;
        theta = g.dir * angle;
        x = g.anchorX;
        y = g.anchorY + d * g.spacing;
        if (g.radius !== Infinity) {
          x = g.anchorX - g.dir * g.radius * (1 - Math.cos(angle));
          y = g.anchorY + g.radius * Math.sin(angle);
        }
      }
      const fall = Math.min(distance / visibleCount, 1);
      const size = 1 - shrink * 0.4 * fall;
      let opacity = Math.pow(Math.max(0, 1 - distance / span), exponent);
      if (g.horizontal) opacity *= Math.pow(reach, exponent);
      if (opacity > 0.001) opacity *= clearance(x, y, theta, size, label);
      if (opacity <= 0.002 || distance > span + 0.5) {
        if (label.shown) {
          el.style.visibility = "hidden";
          label.shown = false;
        }
        if (index !== current) label.lit = 1;
        return;
      }
      if (!label.shown) {
        el.style.visibility = "visible";
        label.shown = true;
      }
      const anchor = g.horizontal ? "translate(-50%, -50%)" : g.dir > 0 ? "translate(0, -50%)" : "translate(-100%, -50%)";
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotate(${theta.toFixed(5)}rad) scale(${size.toFixed(4)}) ${anchor}`;
      const lift = distance > 0.5 ? label.hover : 0;
      el.style.opacity = Math.min(1, opacity * (1 + lift)).toFixed(3);
      if (g.horizontal) {
        const w = Math.max(label.width, 1);
        const ratio = Math.max(Math.cos(theta) * size, 0.2);
        const band = clamp(g.half * 0.4, g.fontSize * 1.5, g.fontSize * 5);
        const left = 2 - g.wheelX;
        const right = g.rootWidth - g.wheelX - 2;
        const at = (edge: number) => ((((edge - x) / ratio + w / 2) / w) * 100).toFixed(2);
        const mask = `linear-gradient(90deg, transparent ${at(left)}%, #000 ${at(left + band)}%, #000 ${at(right - band)}%, transparent ${at(right)}%)`;
        label.title?.style.setProperty("mask-image", mask);
        label.title?.style.setProperty("-webkit-mask-image", mask);
      } else if (label.title?.style.getPropertyValue("mask-image")) {
        label.title.style.removeProperty("mask-image");
        label.title.style.removeProperty("-webkit-mask-image");
      }
      if (blur > 0) el.style.filter = fall > 0.01 ? `blur(${(blur * fall * fall).toFixed(2)}px)` : "";
      else if (el.style.filter) el.style.filter = "";
      const active = smooth(1 - Math.min(distance, 1));
      if (index !== current && active < 0.02) label.lit = 1;
      if (label.fill) {
        label.fill.style.opacity = active.toFixed(3);
        const start = label.lit * 124 - 24;
        const mask = `linear-gradient(90deg, #000 ${start.toFixed(2)}%, transparent ${(start + 24).toFixed(2)}%)`;
        label.fill.style.setProperty("mask-image", mask);
        label.fill.style.setProperty("-webkit-mask-image", mask);
      }
      if (label.sub) label.sub.style.opacity = (active * active).toFixed(3);
    });
    if (indicatorNode && !g.horizontal) {
      const x = g.anchorX - g.dir * g.fontSize * 0.72;
      indicatorNode.style.transform = `translate3d(${x.toFixed(2)}px, ${g.anchorY.toFixed(2)}px, 0) translate(-50%, -50%)${g.dir < 0 ? " scaleX(-1)" : ""}`;
    }
    if (frameNode && settings.imageSide !== "none") {
      const strength = clamp(finite(settings.imageBlur, 18), 0, 80);
      const cover = (2.4 * strength) / g.frameSize;
      const p = settings.loop ? pos : clamp(pos, 0, n - 1);
      const floor = Math.floor(p);
      const t = p - floor;
      const outgoing = wrap(floor);
      const incoming = settings.loop || floor + 1 < n ? wrap(floor + 1) : -1;
      layers.forEach((layer, index) => {
        const isOut = index === outgoing;
        const isIn = index === incoming && index !== outgoing && t > 0.0005;
        const plate = layer.plate;
        const shade = layer.shade;
        if (!isOut && !isIn) {
          if (layer.shown) {
            layer.el.style.visibility = "hidden";
            if (plate) {
              plate.style.filter = "";
              plate.style.willChange = "auto";
            }
            layer.shown = false;
          }
          return;
        }
        if (!layer.shown) {
          layer.el.style.visibility = "visible";
          if (plate) plate.style.willChange = "transform, filter";
          layer.shown = true;
        }
        const amount = isIn ? 1 - t : t;
        layer.el.style.zIndex = isIn ? "2" : "1";
        if (settings.transition === "slide") {
          layer.el.style.opacity = "1";
          layer.el.style.transform = `translate3d(0, ${((isIn ? amount : -amount) * 100).toFixed(3)}%, 0)`;
          if (plate) {
            plate.style.filter = "";
            plate.style.transform = `translate3d(0, ${((isIn ? -amount : amount) * 18).toFixed(3)}%, 0) scale(1.06)`;
          }
          if (shade) shade.style.opacity = isIn ? "0" : (amount * 0.3).toFixed(3);
        } else if (settings.transition === "fade") {
          layer.el.style.transform = "none";
          layer.el.style.opacity = isIn ? smooth(t).toFixed(4) : "1";
          if (plate) {
            plate.style.filter = "";
            plate.style.transform = `scale(${(1 + (isIn ? 0.05 : 0.025) * amount).toFixed(4)})`;
          }
          if (shade) shade.style.opacity = "0";
        } else {
          layer.el.style.transform = "none";
          layer.el.style.opacity = isIn ? smooth(t).toFixed(4) : "1";
          if (plate) {
            const radius = strength * amount;
            plate.style.filter = radius > 0.05 ? `blur(${radius.toFixed(2)}px) saturate(${(1 + 0.25 * amount).toFixed(3)})` : "";
            plate.style.transform = `scale(${(1 + (cover + (isIn ? 0.06 : 0.02)) * amount).toFixed(4)})`;
          }
          if (shade) shade.style.opacity = "0";
        }
      });
    }
    return busy;
  };

  const report = () => {
    const index = wrap(Math.round(target));
    if (index === reported) return;
    reported = index;
    callbacks.onActive(index);
  };

  function tick(time: number) {
    raf = 0;
    if (destroyed) return;
    const dt = last ? Math.min(0.05, Math.max(0, (time - last) / 1000)) : 1 / 60;
    last = time;
    const settings = S();
    let busy = false;
    if (!drag || !drag.moved) {
      if (settings.reduced) {
        pos = target;
        velocity = 0;
      } else {
        [pos, velocity] = springTo(pos, velocity, target, dt, clamp(finite(settings.smoothing, 0.45), 0.08, 3), 0.92);
      }
      if (Math.abs(pos - target) < 0.0004 && Math.abs(velocity) < 0.002) {
        pos = target;
        velocity = 0;
      } else busy = true;
    } else busy = true;
    if (autoplayOn()) {
      if (!drag && !(hovering && settings.pauseOnHover)) elapsed += dt;
      if (elapsed >= interval()) {
        elapsed = 0;
        const next = Math.round(target) + 1;
        target = settings.loop || next < count() ? next : 0;
      }
      busy = true;
    }
    const fade = 1 - Math.exp(-dt / 0.12);
    labels.forEach((label, index) => {
      const goal = index === hoverIndex ? 1 : 0;
      label.hover += (goal - label.hover) * fade;
      if (Math.abs(goal - label.hover) > 0.003) busy = true;
      else label.hover = goal;
    });
    report();
    if (render(dt)) busy = true;
    if (busy && visible && !doc.hidden) raf = view.requestAnimationFrame(tick);
    else last = 0;
  }

  function wake() {
    if (destroyed || raf || !visible) return;
    raf = view.requestAnimationFrame(tick);
  }

  const touch = () => {
    elapsed = 0;
  };

  const goTo = (index: number) => {
    const n = count();
    const base = Math.round(target);
    if (S().loop) {
      let delta = wrap(index) - wrap(base);
      delta -= n * Math.round(delta / n);
      target = base + delta;
    } else {
      target = clamp(Math.round(index), 0, n - 1);
    }
    touch();
    report();
    wake();
  };

  const step = (direction: number) => {
    target = limit(Math.round(target) + direction);
    touch();
    report();
    wake();
  };

  const itemAt = (node: EventTarget | null) => {
    const element = node as Element | null;
    if (!element || typeof element.closest !== "function") return -1;
    const hit = element.closest("[data-arc-item]");
    return hit ? labels.findIndex((label) => label.el === hit) : -1;
  };

  const onWheel = (event: WheelEvent) => {
    const settings = S();
    if (!settings.wheel || event.ctrlKey || count() < 2) return;
    let delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (event.deltaMode === 1) delta *= 16;
    else if (event.deltaMode === 2) delta *= root.clientHeight;
    delta = clamp(delta, -240, 240);
    if (delta === 0) return;
    if (!settings.loop) {
      if (delta < 0 && target <= 0.001) return;
      if (delta > 0 && target >= count() - 1.001) return;
    }
    event.preventDefault();
    target = limit(target + delta / 100);
    touch();
    report();
    view.clearTimeout(snapTimer);
    snapTimer = view.setTimeout(() => {
      target = limit(Math.round(target));
      report();
      wake();
    }, 140);
    wake();
  };

  const rubber = (value: number) => {
    if (S().loop) return value;
    const max = count() - 1;
    if (value < 0) return value * 0.35;
    if (value > max) return max + (value - max) * 0.35;
    return value;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      start: arcAt(pos),
      moved: false,
      lastPos: pos,
      lastTime: now(),
      velocity: 0,
      hit: itemAt(event.target),
    };
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && (!drag || !drag.moved)) {
      const index = itemAt(event.target);
      if (index !== hoverIndex) {
        hoverIndex = index;
        wake();
      }
    }
    if (!drag || event.pointerId !== drag.id) return;
    const settings = S();
    const along = g.horizontal ? event.clientX - drag.x : event.clientY - drag.y;
    if (!drag.moved) {
      const across = g.horizontal ? event.clientY - drag.y : event.clientX - drag.x;
      if (!settings.draggable || Math.abs(along) < 6 || Math.abs(along) < Math.abs(across)) {
        if (Math.hypot(along, across) > 12) drag.hit = -1;
        return;
      }
      drag.moved = true;
      drag.start = arcAt(pos);
      drag.x = event.clientX;
      drag.y = event.clientY;
      drag.lastPos = pos;
      drag.lastTime = now();
      hoverIndex = -1;
      try {
        wheelNode?.setPointerCapture(event.pointerId);
      } catch {}
      if (wheelNode) wheelNode.style.cursor = "grabbing";
      view.clearTimeout(snapTimer);
      return;
    }
    pos = rubber(posAt(drag.start - along));
    target = pos;
    velocity = 0;
    const time = now();
    const span = time - drag.lastTime;
    if (span > 0.001) {
      const speed = (pos - drag.lastPos) / span;
      drag.velocity = drag.velocity * 0.55 + speed * 0.45;
      drag.lastPos = pos;
      drag.lastTime = time;
    }
    touch();
    report();
    wake();
  };

  const finish = (event: PointerEvent, cancelled: boolean) => {
    if (!drag || event.pointerId !== drag.id) return;
    const ended = drag;
    drag = null;
    if (wheelNode) wheelNode.style.cursor = "";
    try {
      if (wheelNode?.hasPointerCapture(event.pointerId)) wheelNode.releasePointerCapture(event.pointerId);
    } catch {}
    if (ended.moved) {
      const fresh = now() - ended.lastTime < 0.09 ? clamp(ended.velocity, -40, 40) : 0;
      const carry = 0.08 + 0.34 * clamp(finite(S().inertia, 0.6), 0, 1);
      target = limit(Math.round(pos + fresh * carry));
      velocity = fresh;
      touch();
      report();
      wake();
      return;
    }
    if (cancelled || ended.hit < 0) return;
    if (ended.hit === wrap(Math.round(target))) callbacks.onSelect(ended.hit);
    else goTo(ended.hit);
  };

  const onPointerUp = (event: PointerEvent) => finish(event, false);

  const onPointerCancel = (event: PointerEvent) => finish(event, true);

  const onLostCapture = (event: PointerEvent) => {
    if (drag && drag.moved && event.pointerId === drag.id) finish(event, false);
  };

  const onEnter = (event: PointerEvent) => {
    if (event.pointerType === "mouse") hovering = true;
  };

  const onLeave = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    hovering = false;
    if (hoverIndex !== -1) {
      hoverIndex = -1;
      wake();
    }
  };

  const onKey = (event: KeyboardEvent) => {
    const n = count();
    if (event.key === "ArrowDown" || event.key === "ArrowRight") step(1);
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") step(-1);
    else if (event.key === "Home") goTo(0);
    else if (event.key === "End") goTo(n - 1);
    else if (event.key === "Enter" || event.key === " ") callbacks.onSelect(wrap(Math.round(target)));
    else return;
    event.preventDefault();
  };

  const onFocus = () => {
    if (!wheelNode) return;
    let ring = false;
    try {
      ring = wheelNode.matches(":focus-visible");
    } catch {}
    wheelNode.style.outline = ring ? "2px solid currentColor" : "none";
    wheelNode.style.outlineOffset = "4px";
  };

  const onBlur = () => {
    if (wheelNode) wheelNode.style.outline = "none";
  };

  const onVisibility = () => {
    last = 0;
    if (!doc.hidden) wake();
  };

  let bound: HTMLElement | null = null;

  const bind = () => {
    if (bound === wheelNode) return;
    if (bound) {
      bound.removeEventListener("pointerdown", onPointerDown);
      bound.removeEventListener("pointerup", onPointerUp);
      bound.removeEventListener("pointercancel", onPointerCancel);
      bound.removeEventListener("lostpointercapture", onLostCapture);
      bound.removeEventListener("keydown", onKey);
      bound.removeEventListener("focus", onFocus);
      bound.removeEventListener("blur", onBlur);
    }
    bound = wheelNode;
    if (!bound) return;
    bound.addEventListener("pointerdown", onPointerDown);
    bound.addEventListener("pointerup", onPointerUp);
    bound.addEventListener("pointercancel", onPointerCancel);
    bound.addEventListener("lostpointercapture", onLostCapture);
    bound.addEventListener("keydown", onKey);
    bound.addEventListener("focus", onFocus);
    bound.addEventListener("blur", onBlur);
  };

  const refresh = () => {
    if (destroyed) return;
    measure();
    render(0);
    wake();
  };

  root.addEventListener("wheel", onWheel, { passive: false });
  root.addEventListener("pointermove", onPointerMove);
  root.addEventListener("pointerenter", onEnter);
  root.addEventListener("pointerleave", onLeave);
  doc.addEventListener("visibilitychange", onVisibility);
  bind();

  const resizeObserver = new ResizeObserver(refresh);
  resizeObserver.observe(root);
  const intersection = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    last = 0;
    if (visible) wake();
  });
  intersection.observe(root);
  if (doc.fonts && doc.fonts.ready) void doc.fonts.ready.then(refresh);

  refresh();

  return {
    sync: () => {
      if (destroyed) return;
      collect();
      bind();
      target = limit(target);
      if (!S().loop) pos = clamp(pos, -0.5, count() - 0.5);
      measure();
      render(0);
      report();
      wake();
    },
    step,
    goTo,
    destroy: () => {
      destroyed = true;
      view.cancelAnimationFrame(raf);
      view.clearTimeout(snapTimer);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      doc.removeEventListener("visibilitychange", onVisibility);
      wheelNode = null;
      bind();
      resizeObserver.disconnect();
      intersection.disconnect();
    },
  };
};

const ArcList = forwardRef<ArcListHandle, ArcListProps>(function ArcList(
  {
    items = DEFAULT_ITEMS,
    startIndex = 0,
    orientation = "auto",
    imageSide = "left",
    curve = 0.5,
    spacing = 76,
    visible = 3,
    fade = 0.35,
    shrink = 0.1,
    blur = 0,
    fontSize = 30,
    fontWeight = 600,
    textColor = "#737373",
    activeColor = "#B19EEF",
    backgroundColor = "transparent",
    indicator = true,
    subtitles = true,
    autoplay = true,
    interval = 3.5,
    pauseOnHover = true,
    loop = true,
    wheel = true,
    draggable = true,
    smoothing = 0.45,
    inertia = 0.6,
    imageWidth = 340,
    imageAspect = 0.78,
    imageRadius = 14,
    gap = 64,
    transition = "blur",
    imageBlur = 18,
    onChange,
    onSelect,
    ariaLabel = "Projects",
    className,
    style,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<Controller | null>(null);
  const reduced = useSyncExternalStore(subscribeToMotion, readMotion, () => false);
  const uid = useId();
  const list = Array.isArray(items) ? items : DEFAULT_ITEMS;
  const startRef = useRef(startIndex);
  const [active, setActive] = useState(() =>
    list.length ? ((Math.round(finite(startIndex, 0)) % list.length) + list.length) % list.length : 0,
  );
  const settings: Settings = {
    orientation,
    imageSide,
    curve,
    spacing,
    visible,
    fade,
    shrink,
    blur,
    fontSize,
    autoplay,
    interval,
    pauseOnHover,
    loop,
    wheel,
    draggable,
    smoothing,
    inertia,
    imageWidth,
    imageAspect,
    imageRadius,
    gap,
    transition,
    imageBlur,
    reduced,
  };
  const settingsRef = useRef(settings);
  const countRef = useRef(list.length);
  const listRef = useRef(list);
  const handlersRef = useRef({ onChange, onSelect });

  useEffect(() => {
    settingsRef.current = settings;
    countRef.current = list.length;
    listRef.current = list;
    handlersRef.current = { onChange, onSelect };
    controllerRef.current?.sync();
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const controller = createArc(
      root,
      settingsRef,
      countRef,
      {
        onActive: (index) => {
          setActive(index);
          const item = listRef.current[index];
          if (item) handlersRef.current.onChange?.(index, item);
        },
        onSelect: (index) => {
          const item = listRef.current[index];
          if (!item) return;
          handlersRef.current.onSelect?.(index, item);
          if (item.href) (root.ownerDocument.defaultView ?? window).location.assign(item.href);
        },
      },
      startRef.current,
    );
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      next: () => controllerRef.current?.step(1),
      previous: () => controllerRef.current?.step(-1),
      goTo: (index: number) => controllerRef.current?.goTo(index),
    }),
    [],
  );

  const current = list.length ? Math.min(active, list.length - 1) : 0;

  return (
    <div
      ref={rootRef}
      className={cn("relative isolate h-full min-h-[360px] w-full overflow-hidden", className)}
      style={{ backgroundColor, ...style }}
    >
      <div data-arc-layout="" style={layoutStyle}>
        {imageSide !== "none" && (
          <div data-arc-frame="" style={frameStyle}>
            {list.map((item, index) => (
              <div key={index} data-arc-layer="" style={layerStyle}>
                <div
                  data-arc-plate=""
                  role={item.image ? "img" : undefined}
                  aria-label={item.image ? (item.alt ?? item.title) : undefined}
                  style={{ ...plateStyle, backgroundImage: item.image ? `url("${item.image}")` : undefined }}
                />
                <div data-arc-shade="" style={shadeStyle} />
              </div>
            ))}
          </div>
        )}
        <div
          data-arc-wheel=""
          role="listbox"
          tabIndex={0}
          aria-label={ariaLabel}
          aria-activedescendant={list.length ? `${uid}-${current}` : undefined}
          style={{ ...wheelStyle, fontWeight, color: textColor }}
        >
          {indicator && (
            <svg
              data-arc-indicator=""
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={indicatorStyle}
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          )}
          {list.map((item, index) => (
            <div
              key={index}
              id={`${uid}-${index}`}
              data-arc-item=""
              role="option"
              aria-selected={index === current}
              style={itemStyle}
            >
              <span data-arc-title="" style={titleStyle}>
                {item.logo ? (
                  <span data-arc-logo="">{item.logo}</span>
                ) : (
                  <>
                    <span>{item.title}</span>
                    <span data-arc-fill="" aria-hidden="true" style={{ ...fillStyle, color: activeColor }}>
                      {item.title}
                    </span>
                  </>
                )}
              </span>
              {subtitles && item.subtitle && (
                <span data-arc-sub="" style={subStyle}>
                  {item.subtitle}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div aria-live="polite" style={hiddenStyle}>
        {list[current]?.title}
      </div>
    </div>
  );
});

ArcList.displayName = "ArcList";

export { ArcList };
export default ArcList;
