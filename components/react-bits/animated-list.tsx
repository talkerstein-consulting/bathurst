"use client";

import {
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type Dispatch,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { cn } from "@/lib/utils";

export type AnimatedListLayout = "list" | "stack";
export type AnimatedListPosition = "top" | "center" | "bottom";
export type AnimatedListEntrance = "morph" | "slide" | "blur";
export type AnimatedListTheme = "auto" | "light" | "dark";

export interface AnimatedListItem {
  id: string | number;
  title?: ReactNode;
  description?: ReactNode;
  time?: ReactNode;
  icon?: ReactNode;
  image?: string;
  content?: ReactNode;
}

export interface AnimatedListHandle {
  push: (item: AnimatedListItem) => void;
  dismiss: (id: string | number) => void;
  clear: () => void;
  replay: () => void;
}

export interface AnimatedListProps {
  items?: AnimatedListItem[];
  layout?: AnimatedListLayout;
  position?: AnimatedListPosition;
  entrance?: AnimatedListEntrance;
  interval?: number;
  initialCount?: number;
  maxItems?: number;
  height?: number | string;
  gap?: number;
  radius?: number;
  padding?: number;
  iconSize?: number;
  duration?: number;
  fade?: number;
  dim?: number;
  peek?: number;
  stackDepth?: number;
  expandOnHover?: boolean;
  pauseOnHover?: boolean;
  swipeToDismiss?: boolean;
  liveTime?: boolean;
  unreadDot?: boolean;
  theme?: AnimatedListTheme;
  accentColor?: string;
  cardColor?: string;
  intro?: boolean;
  paused?: boolean;
  className?: string;
  style?: CSSProperties;
  renderItem?: (item: AnimatedListItem) => ReactNode;
  onItemClick?: (item: AnimatedListItem) => void;
  onDismiss?: (item: AnimatedListItem) => void;
}

type Rgb = [number, number, number];
type Affine = [number, number, number, number, number, number];

interface Entry {
  key: string;
  item: AnimatedListItem;
  ago: number;
  fresh: boolean;
}

interface Config {
  items: AnimatedListItem[];
  layout: AnimatedListLayout;
  position: AnimatedListPosition;
  entrance: AnimatedListEntrance;
  interval: number;
  initialCount: number;
  maxItems: number;
  gap: number;
  radius: number;
  padding: number;
  iconSize: number;
  duration: number;
  fade: number;
  dim: number;
  peek: number;
  stackDepth: number;
  expandOnHover: boolean;
  pauseOnHover: boolean;
  swipeToDismiss: boolean;
  liveTime: boolean;
  intro: boolean;
  paused: boolean;
  reduced: boolean;
  theme: AnimatedListTheme;
  accentColor: string;
  cardColor?: string;
  onItemClick?: (item: AnimatedListItem) => void;
  onDismiss?: (item: AnimatedListItem) => void;
}

interface Card {
  key: string;
  item: AnimatedListItem;
  el: HTMLLIElement | null;
  surface: HTMLElement | null;
  body: HTMLElement | null;
  shade: HTMLElement | null;
  stamp: HTMLElement | null;
  dot: HTMLElement | null;
  born: number;
  fresh: boolean;
  h: number;
  p: number;
  wait: number;
  held: boolean;
  inPlace: boolean;
  q: number;
  leaving: boolean;
  swiped: boolean;
  removed: boolean;
  x: number;
  vx: number;
  base: number;
  flinging: boolean;
  dragging: boolean;
  moved: boolean;
  pointer: number;
  startX: number;
  startY: number;
  lastX: number;
  lastT: number;
  ratio: number;
  cache: Record<string, string>;
}

interface Look {
  opacity: number;
  blur: number;
  offset: number;
  scale: number;
  originX: number;
  originY: number;
  clipRight: number;
  clipBottom: number;
  text: number;
  textBlur: number;
  textShift: number;
}

interface Core {
  sync: (entries: Entry[]) => void;
  refresh: () => void;
  paint: () => void;
  add: (item: AnimatedListItem) => void;
  dismiss: (id: string | number) => void;
  clear: () => void;
  replay: () => void;
  down: (event: ReactPointerEvent<HTMLLIElement>, key: string) => void;
  move: (event: ReactPointerEvent<HTMLLIElement>, key: string) => void;
  up: (event: ReactPointerEvent<HTMLLIElement>, key: string) => void;
  cancel: (event: ReactPointerEvent<HTMLLIElement>, key: string) => void;
  click: (key: string) => void;
  keydown: (event: ReactKeyboardEvent<HTMLLIElement>, key: string) => void;
  pointer: (event: ReactPointerEvent<HTMLDivElement>, kind: "enter" | "move" | "leave") => void;
  focus: (within: boolean) => void;
  destroy: () => void;
}

const glyph = (children: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const DEFAULT_ITEMS: AnimatedListItem[] = [
  {
    id: "leila",
    image: "https://pro.reactbits.dev/demo-media/portrait-olive.webp",
    title: "Leila Haddad",
    description: "Left a comment on the Q1 roadmap",
  },
  {
    id: "release",
    icon: glyph(<path d="M5 12.5l4.5 4.5L19 7.5" />),
    title: "Release 4.2 is live",
    description: "Deployed to production in 48 seconds",
  },
  {
    id: "kenji",
    image: "https://pro.reactbits.dev/demo-media/portrait-indigo.webp",
    title: "Kenji Takahashi",
    description: "Approved your spec for offline mode",
  },
  {
    id: "payment",
    icon: glyph(
      <>
        <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
        <path d="M3 10h18M7 14.5h3.5" />
      </>,
    ),
    title: "Payment received",
    description: "$2,400 from Halflight Prints",
  },
  {
    id: "mei",
    image: "https://pro.reactbits.dev/demo-media/portrait-pearl.webp",
    title: "Mei Chen",
    description: "Shared four new onboarding designs",
  },
  {
    id: "team",
    icon: glyph(
      <>
        <circle cx="9.5" cy="8.5" r="3.5" />
        <path d="M3.5 19c.6-3.1 3-5 6-5s5.4 1.9 6 5M18.5 8.5v5M16 11h5" />
      </>,
    ),
    title: "New team joined",
    description: "Casa Maré started a Team plan trial",
  },
  {
    id: "daniel",
    image: "https://pro.reactbits.dev/demo-media/portrait-teal.webp",
    title: "Daniel Osei",
    description: "Mentioned you in Release planning",
  },
  {
    id: "review",
    icon: glyph(
      <>
        <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
        <path d="M8 3.5v3M16 3.5v3M3.5 10h17" />
      </>,
    ),
    title: "Design review in 15 min",
    description: "Onboarding flow with Maeve Callahan",
  },
];

const FADE_STEPS = [0, 0.2, 0.4, 0.6, 0.8, 1];

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
const seg = (value: number, start: number, end: number) => clamp01((value - start) / (end - start));
const smooth = (t: number) => t * t * (3 - 2 * t);
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const out = (t: number) => 1 - Math.pow(1 - t, 3);

const spring = (state: { x: number; v: number }, goal: number, omega: number, dt: number) => {
  const offset = state.x - goal;
  const kick = state.v + omega * offset;
  const decay = Math.exp(-omega * dt);
  state.x = goal + (offset + kick * dt) * decay;
  state.v = (state.v - omega * kick * dt) * decay;
  if (Math.abs(state.x - goal) < 1e-4 && Math.abs(state.v) < 1e-3) {
    state.x = goal;
    state.v = 0;
    return false;
  }
  return true;
};

const multiply = (m: Affine, n: Affine): Affine => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];

const scaleAbout = (k: number, x: number, y: number): Affine => [k, 0, 0, k, x - k * x, y - k * y];

const rotateAbout = (angle: number, x: number, y: number): Affine => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [cos, sin, -sin, cos, x - cos * x + sin * y, y - sin * x - cos * y];
};

const formatAge = (seconds: number) => {
  if (seconds < 3) return "now";
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

const seedEntries = (pool: AnimatedListItem[], count: number, tag: string): Entry[] => {
  if (!pool.length) return [];
  const total = Math.max(0, Math.round(count));
  return Array.from({ length: total }, (_, index) => {
    const item = pool[index % pool.length];
    return {
      key: `${String(item.id)}::${tag}${index}`,
      item,
      ago: Math.round(48 * Math.pow(index + 1, 1.7)),
      fresh: false,
    };
  });
};

const fadeGradient = (from: number, to: number, rising: boolean) => {
  const stops = FADE_STEPS.map((t) => {
    const alpha = rising ? smooth(t) : 1 - smooth(t);
    return `rgba(0,0,0,${alpha.toFixed(3)}) ${(from + (to - from) * t).toFixed(1)}px`;
  });
  return `linear-gradient(to bottom, ${stops.join(", ")})`;
};

const toLinear = (channel: number) => {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
};

const toChannel = (value: number) => {
  const encoded = value <= 0.0031308 ? 12.92 * value : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  return Math.round(clamp01(encoded) * 255);
};

const toLab = (rgb: Rgb): Rgb => {
  const r = toLinear(rgb[0]);
  const g = toLinear(rgb[1]);
  const b = toLinear(rgb[2]);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
};

const fromLab = (lab: Rgb): Rgb => {
  const l = Math.pow(lab[0] + 0.3963377774 * lab[1] + 0.2158037573 * lab[2], 3);
  const m = Math.pow(lab[0] - 0.1055613458 * lab[1] - 0.0638541728 * lab[2], 3);
  const s = Math.pow(lab[0] - 0.0894841775 * lab[1] - 1.291485548 * lab[2], 3);
  return [
    toChannel(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toChannel(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toChannel(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
};

const mix = (from: Rgb, to: Rgb, t: number): Rgb => {
  const a = toLab(from);
  const b = toLab(to);
  return fromLab([lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]);
};

const hex = (rgb: Rgb) => `#${rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;

const parseColor = (color: string | null | undefined, probe: CanvasRenderingContext2D | null) => {
  if (!color || !probe) return null;
  probe.fillStyle = "#010203";
  probe.fillStyle = color;
  if (String(probe.fillStyle) === "#010203" && color.trim().toLowerCase() !== "#010203") return null;
  probe.clearRect(0, 0, 1, 1);
  probe.fillRect(0, 0, 1, 1);
  const data = probe.getImageData(0, 0, 1, 1).data;
  return { rgb: [data[0], data[1], data[2]] as Rgb, alpha: data[3] / 255 };
};

const readBackdrop = (root: HTMLElement, probe: CanvasRenderingContext2D | null) => {
  let node: Element | null = root.parentElement;
  let view: Window | null = root.ownerDocument.defaultView;
  for (let hop = 0; hop < 4 && view; hop += 1) {
    while (node) {
      const parsed = parseColor(view.getComputedStyle(node).backgroundColor, probe);
      if (parsed && parsed.alpha >= 0.5) return { dark: toLab(parsed.rgb)[0] < 0.6, color: parsed.rgb };
      node = node.parentElement;
    }
    let frame: Element | null = null;
    try {
      frame = view.frameElement;
    } catch {
      frame = null;
    }
    if (!frame) break;
    node = frame.parentElement;
    view = frame.ownerDocument.defaultView;
  }
  const doc = root.ownerDocument;
  const html = doc.documentElement;
  const own = doc.defaultView ?? window;
  if (html.classList.contains("dark")) return { dark: true, color: null };
  if (html.classList.contains("light")) return { dark: false, color: null };
  const scheme = own.getComputedStyle(html).colorScheme;
  if (scheme === "dark" || scheme === "light") return { dark: scheme === "dark", color: null };
  return { dark: own.matchMedia("(prefers-color-scheme: dark)").matches, color: null };
};

const subscribeToMotion = (notify: () => void) => {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

const readMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const growth = (card: Card, entrance: AnimatedListEntrance, reduced: boolean) => {
  let grown = 1;
  if (!card.inPlace && !card.held && card.p < 1 && !reduced) {
    grown = inOut(seg(card.p, 0, entrance === "morph" ? 0.42 : entrance === "slide" ? 0.5 : 0.45));
  }
  if (card.leaving) grown *= 1 - inOut(seg(card.q, card.swiped ? 0 : 0.3, 1));
  return grown;
};

const sinking = (card: Card, entrance: AnimatedListEntrance, reduced: boolean) => {
  let sunk = 1;
  if (!card.inPlace && !card.held && card.p < 1 && !reduced) {
    sunk =
      entrance === "morph"
        ? inOut(seg(card.p, 0.3, 0.8))
        : entrance === "slide"
          ? inOut(seg(card.p, 0.06, 0.6))
          : inOut(seg(card.p, 0.12, 0.7));
  }
  if (card.leaving) sunk *= 1 - inOut(seg(card.q, card.swiped ? 0 : 0.3, 1));
  return sunk;
};

const appearance = (
  card: Card,
  entrance: AnimatedListEntrance,
  reduced: boolean,
  width: number,
  height: number,
  pill: number,
): Look => {
  const p = card.held ? 0 : card.p;
  const look: Look = {
    opacity: 1,
    blur: 0,
    offset: 0,
    scale: 1,
    originX: width / 2,
    originY: height / 2,
    clipRight: 0,
    clipBottom: 0,
    text: 1,
    textBlur: 0,
    textShift: 0,
  };
  if (p >= 1) return look;
  if (reduced) {
    look.opacity = smooth(p);
    return look;
  }
  if (entrance === "morph") {
    const pillWidth = Math.min(width, pill);
    const pillHeight = Math.min(height, pill);
    const pop = out(seg(p, 0.2, 0.5));
    const text = out(seg(p, 0.48, 0.98));
    look.opacity = smooth(seg(p, 0.2, 0.34));
    look.scale = 0.55 + 0.45 * pop;
    look.blur = 5 * (1 - pop);
    look.originX = pillWidth / 2;
    look.originY = pillHeight / 2;
    look.clipRight = (width - pillWidth) * (1 - inOut(seg(p, 0.34, 0.74)));
    look.clipBottom = Math.max(0, height - pillHeight) * (1 - inOut(seg(p, 0.38, 0.78)));
    look.text = text;
    look.textBlur = 4 * (1 - text);
    look.textShift = -10 * (1 - text);
  } else if (entrance === "slide") {
    const travel = out(seg(p, 0.06, 0.92));
    look.opacity = smooth(seg(p, 0.1, 0.5));
    look.offset = -18 * (1 - travel);
    look.scale = 0.965 + 0.035 * travel;
    look.blur = 6 * (1 - out(seg(p, 0.08, 0.75)));
  } else {
    const focus = out(seg(p, 0.12, 1));
    look.opacity = out(seg(p, 0.12, 0.65));
    look.scale = 1.04 - 0.04 * focus;
    look.blur = 14 * (1 - focus);
  }
  return look;
};

const settleDot = (dot: HTMLElement) => {
  dot.style.opacity = "0";
  dot.style.width = "0px";
  dot.style.marginLeft = "-8px";
};

const put = (card: Card, slot: string, el: HTMLElement | null, property: string, value: string) => {
  if (!el || card.cache[slot] === value) return;
  card.cache[slot] = value;
  el.style.setProperty(property, value);
};

const createCore = (
  root: HTMLDivElement,
  list: HTMLUListElement,
  config: () => Config,
  setEntries: Dispatch<SetStateAction<Entry[]>>,
): Core => {
  const doc = root.ownerDocument;
  const view = (doc.defaultView ?? window) as Window & typeof globalThis;
  const swatch = doc.createElement("canvas");
  swatch.width = 1;
  swatch.height = 1;
  const probe = swatch.getContext("2d", { willReadFrequently: true });
  const cards = new Map<string, Card>();
  const spreadState = { x: config().layout === "stack" ? 0 : 1, v: 0 };
  const focusState = { x: 0, v: 0 };
  let order: string[] = [];
  let width = root.clientWidth;
  let height = root.clientHeight;
  let inside = false;
  let pointerY = -1;
  let hovered = false;
  let within = false;
  let pinned = false;
  let touching = false;
  let visible = false;
  let pending = config().intro && !config().reduced;
  let armedAt = 0;
  let serial = 0;
  let epoch = 0;
  let cursor = Math.max(0, Math.round(config().initialCount));
  let raf = 0;
  let ticking = false;
  let last = 0;
  let timer = 0;
  let cadence = -1;
  let lastPointer = "mouse";
  let bounds = { top: 0, bottom: 0 };
  let paintFrame = 0;
  let paintTimers: number[] = [];

  const now = () => view.performance.now();

  const makeCard = (entry: Entry, phase: "held" | "settled" | "enter"): Card => ({
    key: entry.key,
    item: entry.item,
    el: null,
    surface: null,
    body: null,
    shade: null,
    stamp: null,
    dot: null,
    born: now() - entry.ago * 1000,
    fresh: entry.fresh,
    h: 0,
    p: phase === "settled" ? 1 : 0,
    wait: 0,
    held: phase === "held",
    inPlace: false,
    q: 0,
    leaving: false,
    swiped: false,
    removed: false,
    x: 0,
    vx: 0,
    base: 0,
    flinging: false,
    dragging: false,
    moved: false,
    pointer: -1,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastT: 0,
    ratio: 1,
    cache: {},
  });

  const updateHover = () => {
    let next = inside;
    if (next && config().layout === "stack") next = pointerY >= bounds.top - 16 && pointerY <= bounds.bottom + 16;
    if (next !== hovered) {
      hovered = next;
      wake();
    }
  };

  const place = () => {
    if (!width || !height) return;
    const cfg = config();
    const reduced = cfg.reduced;
    const spread = spreadState.x;
    const focus = focusState.x;
    const up = cfg.position === "bottom";
    const depthLimit = Math.max(1, Math.round(cfg.stackDepth));
    const pill = cfg.padding * 2 + cfg.iconSize;
    const inset = 4;
    const fade = clamp(cfg.fade, 0, height * 0.6);
    const live: Card[] = [];
    const grown: number[] = [];
    const sunk: number[] = [];
    for (const key of order) {
      const card = cards.get(key);
      if (!card || !card.el) continue;
      live.push(card);
      grown.push(growth(card, cfg.entrance, reduced));
      sunk.push(sinking(card, cfg.entrance, reduced));
    }
    let front = 0;
    let cover = 1;
    let total = 0;
    let listTotal = 0;
    for (let index = 0; index < live.length; index += 1) {
      front += live[index].h * sunk[index] * cover;
      cover *= 1 - sunk[index];
      total += sunk[index];
      listTotal += (live[index].h + cfg.gap) * grown[index];
    }
    listTotal = Math.max(0, listTotal - cfg.gap);
    const extent = front + cfg.peek * Math.min(Math.max(total - 1, 0), depthLimit);
    const lead = lerp(extent, cfg.layout === "stack" ? listTotal : front, spread);
    const anchor =
      cfg.position === "top" ? inset : up ? height - inset : Math.max(inset, (height - Math.min(lead, height)) / 2);
    let flow = 0;
    let depth = 0;
    let top = Infinity;
    let bottom = -Infinity;
    for (let index = 0; index < live.length; index += 1) {
      const card = live[index];
      const el = card.el as HTMLLIElement;
      const h = card.h;
      const d = depth;
      const stackScale = 1 - 0.05 * Math.min(d, depthLimit + 1);
      const stackLead = front + cfg.peek * Math.min(d, depthLimit) - h * stackScale;
      const offsetLead = lerp(stackLead, flow, spread);
      const scale = lerp(stackScale, 1, spread);
      const shade = lerp(Math.min(0.6, 0.15 * d), cfg.dim * (1 - Math.exp(-0.42 * d)) * (1 - focus), spread);
      const content = lerp(1 - smooth(seg(d, 0.25, 0.9)), 1, spread);
      const reveal = lerp(clamp01(depthLimit + 0.9 - d), 1, spread);
      const look = appearance(card, cfg.entrance, reduced, width, h, pill);
      const exit = card.leaving && !card.swiped ? out(seg(card.q, 0, 0.7)) : 0;
      const swipe = 1 - smooth(clamp01(Math.abs(card.x) / (width * 0.75)));
      const opacity = look.opacity * (1 - exit) * swipe * reveal;
      const visualHeight = h * scale;
      const cardTop = up ? anchor - (offsetLead + look.offset) - visualHeight : anchor + offsetLead + look.offset;
      const left = (width * (1 - scale)) / 2 + card.x;
      const angle = clamp(card.x / width, -1, 1) * 0.06;
      let matrix: Affine = [scale, 0, 0, scale, left, cardTop];
      if (angle) matrix = multiply(matrix, rotateAbout(angle, width / 2, h / 2));
      const pop = look.scale * (1 - 0.04 * exit);
      if (pop !== 1) matrix = multiply(matrix, scaleAbout(pop, look.originX, look.originY));
      const blur = look.blur + 6 * exit;
      let mask = "none";
      let hidden = opacity < 0.004;
      if (fade > 0 && !hidden) {
        if (!up) {
          const start = height - fade;
          if (cardTop >= height - 0.5) hidden = true;
          else if (cardTop + visualHeight > start)
            mask = fadeGradient((start - cardTop) / scale, (height - cardTop) / scale, false);
        } else {
          if (cardTop + visualHeight <= 0.5) hidden = true;
          else if (cardTop < fade) mask = fadeGradient(-cardTop / scale, (fade - cardTop) / scale, true);
        }
      }
      if (!hidden && opacity > 0.05) {
        top = Math.min(top, cardTop);
        bottom = Math.max(bottom, cardTop + visualHeight);
      }
      put(
        card,
        "transform",
        el,
        "transform",
        `matrix(${matrix
          .slice(0, 4)
          .map((value) => value.toFixed(5))
          .join(", ")}, ${matrix[4].toFixed(2)}, ${matrix[5].toFixed(2)})`,
      );
      put(card, "opacity", el, "opacity", opacity.toFixed(3));
      put(card, "filter", el, "filter", blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "none");
      put(card, "z", el, "z-index", String(card.dragging ? 2000 : 1000 - index));
      put(card, "mask", el, "mask-image", mask);
      put(card, "webkit-mask", el, "-webkit-mask-image", mask);
      put(card, "visibility", el, "visibility", hidden ? "hidden" : "visible");
      put(card, "events", el, "pointer-events", hidden || reveal < 0.5 || card.leaving ? "none" : "auto");
      put(
        card,
        "clip",
        card.surface,
        "clip-path",
        look.clipRight > 0.5 || look.clipBottom > 0.5
          ? `inset(0px ${look.clipRight.toFixed(1)}px ${look.clipBottom.toFixed(1)}px 0px round ${cfg.radius}px)`
          : "none",
      );
      put(card, "shade", card.shade, "opacity", shade.toFixed(3));
      put(card, "text", card.body, "opacity", (look.text * content).toFixed(3));
      put(card, "text-filter", card.body, "filter", look.textBlur > 0.05 ? `blur(${look.textBlur.toFixed(2)}px)` : "none");
      put(
        card,
        "text-shift",
        card.body,
        "transform",
        Math.abs(look.textShift) > 0.05 ? `translateX(${look.textShift.toFixed(2)}px)` : "none",
      );
      flow += (h + cfg.gap) * grown[index];
      depth += sunk[index];
    }
    bounds = top <= bottom ? { top, bottom } : { top: 0, bottom: 0 };
    updateHover();
  };

  const step = (dt: number) => {
    const cfg = config();
    const reduced = cfg.reduced;
    const stack = cfg.layout === "stack";
    const spreadGoal = stack ? ((cfg.expandOnHover && (hovered || within)) || pinned ? 1 : 0) : 1;
    const focusGoal = hovered || within || pinned ? 1 : 0;
    let busy = false;
    if (reduced) {
      spreadState.x = spreadGoal;
      spreadState.v = 0;
      focusState.x = focusGoal;
      focusState.v = 0;
    } else {
      if (spring(spreadState, spreadGoal, 12, dt)) busy = true;
      if (spring(focusState, focusGoal, 8, dt)) busy = true;
    }
    const enterTime = reduced ? 0.24 : Math.max(0.25, cfg.duration);
    const leaveTime = reduced ? 0.2 : Math.max(0.25, cfg.duration * 0.62);
    const gone: string[] = [];
    for (const key of order) {
      const card = cards.get(key);
      if (!card) continue;
      if (!card.held) {
        if (card.wait > 0) {
          card.wait = Math.max(0, card.wait - dt);
          busy = true;
        } else if (card.p < 1) {
          card.p = Math.min(1, card.p + dt / enterTime);
          busy = true;
        }
      }
      if (card.dragging) {
        busy = true;
      } else if (card.flinging) {
        card.x += card.vx * dt;
        busy = true;
      } else if (card.x !== 0 || card.vx !== 0) {
        const state = { x: card.x, v: card.vx };
        if (spring(state, 0, 20, dt)) busy = true;
        card.x = state.x;
        card.vx = state.v;
      }
      if (card.leaving) {
        card.q = Math.min(1, card.q + dt / leaveTime);
        busy = true;
        if (card.q >= 1 && !card.removed) {
          card.removed = true;
          gone.push(key);
        }
      }
    }
    if (gone.length) {
      const drop = new Set(gone);
      setEntries((previous) => previous.filter((entry) => !drop.has(entry.key)));
    }
    return busy;
  };

  const tick = (time: number) => {
    raf = 0;
    ticking = true;
    const dt = last ? Math.min(0.064, (time - last) / 1000) : 1 / 60;
    last = time;
    const busy = step(dt);
    place();
    ticking = false;
    if (busy && visible && !doc.hidden) raf = view.requestAnimationFrame(tick);
    else last = 0;
  };

  const wake = () => {
    if (raf || ticking || !visible || doc.hidden) return;
    last = 0;
    raf = view.requestAnimationFrame(tick);
  };

  const sizes = new view.ResizeObserver((records) => {
    for (const record of records) {
      const target = record.target as HTMLElement;
      if (target === root) {
        width = root.clientWidth;
        height = root.clientHeight;
        continue;
      }
      const key = target.dataset.alKey;
      const card = key ? cards.get(key) : undefined;
      if (card) card.h = target.offsetHeight;
    }
    place();
    wake();
  });
  sizes.observe(root);

  const attach = (card: Card, el: HTMLLIElement) => {
    const surface = el.querySelector<HTMLElement>("[data-al-surface]");
    const body = el.querySelector<HTMLElement>("[data-al-body]");
    const shade = el.querySelector<HTMLElement>("[data-al-shade]");
    const stamp = el.querySelector<HTMLElement>("[data-al-stamp]");
    const dot = el.querySelector<HTMLElement>("[data-al-dot]");
    if (card.el !== el) {
      if (card.el) sizes.unobserve(card.el);
      card.el = el;
      card.h = el.offsetHeight;
      card.cache = {};
      sizes.observe(el);
    } else if (surface !== card.surface || body !== card.body || shade !== card.shade) {
      card.cache = {};
    }
    card.surface = surface;
    card.body = body;
    card.shade = shade;
    card.stamp = stamp;
    card.dot = dot;
    if (dot && !card.fresh) settleDot(dot);
  };

  const trim = () => {
    const limit = Math.max(1, Math.round(config().maxItems));
    let count = 0;
    for (const key of order) {
      const card = cards.get(key);
      if (!card || card.leaving) continue;
      count += 1;
      if (count > limit) {
        card.leaving = true;
        card.q = 0;
      }
    }
  };

  const start = () => {
    pending = false;
    const cfg = config();
    const stagger = 0.09;
    let index = 0;
    for (const key of order) {
      const card = cards.get(key);
      if (!card || !card.held) continue;
      card.held = false;
      card.inPlace = true;
      card.p = cfg.entrance === "morph" ? 0.18 : 0.04;
      card.wait = index * stagger;
      index += 1;
    }
    armedAt = now() + (index * stagger + cfg.duration) * 1000;
    wake();
  };

  const settleAll = () => {
    pending = false;
    armedAt = 0;
    for (const card of cards.values()) {
      if (!card.held) continue;
      card.held = false;
      card.p = 1;
    }
  };

  const blocked = () => {
    const cfg = config();
    if (cfg.paused || !visible || doc.hidden || pending || now() < armedAt) return true;
    if (cfg.pauseOnHover && (hovered || within || pinned || touching)) return true;
    for (const card of cards.values()) if (card.dragging) return true;
    return false;
  };

  const add = (item: AnimatedListItem) => {
    serial += 1;
    const entry: Entry = { key: `${String(item.id)}::n${serial}`, item, ago: 0, fresh: true };
    cards.set(entry.key, makeCard(entry, "enter"));
    setEntries((previous) => [entry, ...previous]);
  };

  const beat = () => {
    timer = 0;
    const cfg = config();
    if (cfg.interval > 0) timer = view.setTimeout(beat, cfg.interval);
    if (blocked() || !cfg.items.length) return;
    add(cfg.items[cursor % cfg.items.length]);
    cursor += 1;
  };

  const schedule = () => {
    const interval = Math.max(0, config().interval);
    if (interval === cadence) return;
    cadence = interval;
    view.clearTimeout(timer);
    timer = interval > 0 ? view.setTimeout(beat, interval) : 0;
  };

  const fling = (card: Card, direction: number, speed: number) => {
    const cfg = config();
    card.dragging = false;
    card.pointer = -1;
    card.leaving = true;
    card.q = 0;
    if (cfg.reduced) {
      card.x = 0;
      card.vx = 0;
    } else {
      card.swiped = true;
      card.flinging = true;
      card.vx = direction * speed;
    }
    cfg.onDismiss?.(card.item);
    wake();
  };

  const sync = (entries: Entry[]) => {
    order = entries.map((entry) => entry.key);
    const lookup = new Map(entries.map((entry) => [entry.key, entry]));
    for (const node of Array.from(list.children)) {
      const el = node as HTMLLIElement;
      const key = el.dataset.alKey;
      const entry = key ? lookup.get(key) : undefined;
      if (!key || !entry) continue;
      let card = cards.get(key);
      if (!card) {
        card = makeCard(entry, pending ? "held" : "settled");
        cards.set(key, card);
      }
      card.item = entry.item;
      attach(card, el);
    }
    for (const [key, card] of cards) {
      if (lookup.has(key)) continue;
      if (card.el) sizes.unobserve(card.el);
      cards.delete(key);
    }
    trim();
    if (pending && visible) start();
    place();
    wake();
  };

  const refresh = () => {
    const cfg = config();
    if (pending && (cfg.reduced || !cfg.intro)) settleAll();
    trim();
    schedule();
    place();
    wake();
  };

  const paint = () => {
    const cfg = config();
    const backdrop =
      cfg.theme === "auto" ? readBackdrop(root, probe) : { dark: cfg.theme === "dark", color: null as Rgb | null };
    const dark = backdrop.dark;
    const page: Rgb = backdrop.color ?? (dark ? [10, 10, 10] : [255, 255, 255]);
    const ink: Rgb = dark ? [255, 255, 255] : [0, 0, 0];
    const accent = parseColor(cfg.accentColor, probe)?.rgb ?? ([82, 39, 255] as Rgb);
    const card = parseColor(cfg.cardColor, probe)?.rgb ?? mix(page, ink, dark ? 0.075 : 0.04);
    const set = (name: string, value: string) => root.style.setProperty(name, value);
    set("--al-page", hex(page));
    set("--al-card", hex(card));
    set("--al-card-hover", hex(mix(card, ink, dark ? 0.035 : 0.03)));
    set("--al-text", hex(mix(page, ink, dark ? 0.94 : 0.92)));
    set("--al-text-2", hex(mix(page, ink, dark ? 0.66 : 0.66)));
    set("--al-text-3", hex(mix(page, ink, dark ? 0.56 : 0.5)));
    set("--al-tile", hex(mix(card, accent, dark ? 0.24 : 0.13)));
    set("--al-glyph", hex(dark ? mix(accent, ink, 0.45) : toLab(accent)[0] > 0.66 ? mix(accent, ink, 0.3) : accent));
    set("--al-accent", hex(dark ? mix(accent, ink, 0.2) : accent));
    set(
      "--al-shadow",
      dark
        ? "inset 0 1px 0 rgba(255,255,255,0.045), 0 12px 28px -14px rgba(0,0,0,0.9)"
        : "0 1px 2px rgba(0,0,0,0.05), 0 10px 24px -12px rgba(0,0,0,0.16)",
    );
  };

  const repaint = () => {
    paint();
    view.cancelAnimationFrame(paintFrame);
    paintTimers.forEach((id) => view.clearTimeout(id));
    paintFrame = view.requestAnimationFrame(paint);
    paintTimers = [view.setTimeout(paint, 380), view.setTimeout(paint, 1200)];
  };

  const mutations = new view.MutationObserver(() => {
    if (config().theme === "auto") repaint();
  });
  const watch = (target: Document) => {
    mutations.observe(target.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    if (target.body) mutations.observe(target.body, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
  };
  watch(doc);
  let outer: Element | null = null;
  try {
    outer = view.frameElement;
  } catch {
    outer = null;
  }
  if (outer) watch(outer.ownerDocument);

  const io = new view.IntersectionObserver(
    (records) => {
      visible = records.some((record) => record.isIntersecting);
      if (visible && pending) start();
      if (visible) wake();
    },
    { threshold: 0.2 },
  );
  io.observe(root);

  const clock = view.setInterval(() => {
    if (doc.hidden) return;
    const cfg = config();
    const time = now();
    for (const card of cards.values()) {
      if (card.stamp && cfg.liveTime && card.item.time == null) {
        const label = formatAge((time - card.born) / 1000);
        const node = card.stamp.firstChild;
        if (node && node.nodeType === 3) {
          if (node.nodeValue !== label) node.nodeValue = label;
        } else if (card.stamp.textContent !== label) {
          card.stamp.textContent = label;
        }
      }
      if (card.fresh && time - card.born > 6000) {
        card.fresh = false;
        if (card.dot) settleDot(card.dot);
      }
    }
  }, 1000);

  const onVisibility = () => {
    if (!doc.hidden) wake();
  };
  const onOutside = (event: Event) => {
    if (pinned && !root.contains(event.target as Node | null)) {
      pinned = false;
      wake();
    }
  };
  const onRelease = () => {
    touching = false;
  };
  doc.addEventListener("visibilitychange", onVisibility);
  doc.addEventListener("pointerdown", onOutside, true);
  doc.addEventListener("pointerup", onRelease, true);
  doc.addEventListener("pointercancel", onRelease, true);

  const release = (card: Card, event: ReactPointerEvent<HTMLLIElement>) => {
    card.pointer = -1;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const down = (event: ReactPointerEvent<HTMLLIElement>, key: string) => {
    lastPointer = event.pointerType;
    if (event.pointerType !== "mouse") touching = true;
    const card = cards.get(key);
    if (!card || card.leaving || (event.pointerType === "mouse" && event.button !== 0)) return;
    const rect = root.getBoundingClientRect();
    card.pointer = event.pointerId;
    card.startX = event.clientX;
    card.startY = event.clientY;
    card.lastX = event.clientX;
    card.lastT = event.timeStamp;
    card.base = card.x;
    card.moved = false;
    card.dragging = false;
    card.ratio = rect.width > 0 ? root.clientWidth / rect.width : 1;
    if (config().swipeToDismiss) event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const move = (event: ReactPointerEvent<HTMLLIElement>, key: string) => {
    const card = cards.get(key);
    if (!card || card.pointer !== event.pointerId) return;
    const dx = event.clientX - card.startX;
    const dy = event.clientY - card.startY;
    if (!card.dragging) {
      if (!config().swipeToDismiss) return;
      if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        card.dragging = true;
        card.moved = true;
        card.vx = 0;
      } else {
        if (Math.abs(dy) > 10) release(card, event);
        return;
      }
    }
    const elapsed = Math.max(1, event.timeStamp - card.lastT);
    const velocity = ((event.clientX - card.lastX) * card.ratio * 1000) / elapsed;
    card.vx = card.vx * 0.6 + velocity * 0.4;
    card.lastX = event.clientX;
    card.lastT = event.timeStamp;
    card.x = card.base + dx * card.ratio;
    wake();
  };

  const up = (event: ReactPointerEvent<HTMLLIElement>, key: string) => {
    touching = false;
    const card = cards.get(key);
    if (!card || card.pointer !== event.pointerId) return;
    card.pointer = -1;
    if (!card.dragging) return;
    card.dragging = false;
    const velocity = event.timeStamp - card.lastT > 90 ? 0 : card.vx;
    const reach = Math.abs(card.x) / Math.max(1, width);
    const fast = Math.abs(velocity) > 650 && Math.sign(velocity) === Math.sign(card.x);
    if (reach > 0.34 || fast) {
      fling(card, Math.sign(fast ? velocity : card.x) || 1, Math.max(1500, Math.abs(velocity)));
    } else {
      card.vx = velocity;
    }
    wake();
  };

  const cancel = (event: ReactPointerEvent<HTMLLIElement>, key: string) => {
    touching = false;
    const card = cards.get(key);
    if (!card || card.pointer !== event.pointerId) return;
    card.pointer = -1;
    card.dragging = false;
    card.vx = 0;
    wake();
  };

  const click = (key: string) => {
    const card = cards.get(key);
    if (!card) return;
    if (card.moved) {
      card.moved = false;
      return;
    }
    const cfg = config();
    if (cfg.layout === "stack" && cfg.expandOnHover && lastPointer !== "mouse" && !pinned) {
      pinned = true;
      wake();
      return;
    }
    cfg.onItemClick?.(card.item);
  };

  const keydown = (event: ReactKeyboardEvent<HTMLLIElement>, key: string) => {
    const card = cards.get(key);
    if (!card) return;
    const cfg = config();
    if (event.key === "Enter" || event.key === " ") {
      if (!cfg.onItemClick) return;
      event.preventDefault();
      cfg.onItemClick(card.item);
      return;
    }
    if ((event.key === "Delete" || event.key === "Backspace") && cfg.swipeToDismiss && !card.leaving) {
      event.preventDefault();
      const index = order.indexOf(key);
      const rest = [...order.slice(index + 1), ...order.slice(0, index).reverse()];
      const next = rest.map((other) => cards.get(other)).find((other) => other && !other.leaving && other.el);
      fling(card, 1, 1600);
      next?.el?.focus({ preventScroll: true });
    }
  };

  const pointer = (event: ReactPointerEvent<HTMLDivElement>, kind: "enter" | "move" | "leave") => {
    if (event.pointerType !== "mouse") return;
    if (kind === "leave") {
      inside = false;
    } else {
      const rect = root.getBoundingClientRect();
      inside = true;
      pointerY = (event.clientY - rect.top) * (rect.height > 0 ? root.clientHeight / rect.height : 1);
    }
    updateHover();
  };

  const focus = (value: boolean) => {
    if (within === value) return;
    within = value;
    wake();
  };

  const dismiss = (id: string | number) => {
    for (const key of order) {
      const card = cards.get(key);
      if (!card || card.leaving || card.item.id !== id) continue;
      fling(card, 1, 1600);
      return;
    }
  };

  const clear = () => {
    let index = 0;
    for (const key of order) {
      const card = cards.get(key);
      if (!card || card.leaving) continue;
      card.leaving = true;
      card.q = -index * 0.12;
      index += 1;
    }
    wake();
  };

  const replay = () => {
    const cfg = config();
    epoch += 1;
    for (const card of cards.values()) if (card.el) sizes.unobserve(card.el);
    cards.clear();
    pending = cfg.intro && !cfg.reduced;
    armedAt = 0;
    cursor = Math.max(0, Math.round(cfg.initialCount));
    setEntries(seedEntries(cfg.items, cfg.initialCount, `r${epoch}-`));
  };

  const destroy = () => {
    view.cancelAnimationFrame(raf);
    view.cancelAnimationFrame(paintFrame);
    paintTimers.forEach((id) => view.clearTimeout(id));
    view.clearTimeout(timer);
    view.clearInterval(clock);
    sizes.disconnect();
    io.disconnect();
    mutations.disconnect();
    doc.removeEventListener("visibilitychange", onVisibility);
    doc.removeEventListener("pointerdown", onOutside, true);
    doc.removeEventListener("pointerup", onRelease, true);
    doc.removeEventListener("pointercancel", onRelease, true);
  };

  schedule();

  return {
    sync,
    refresh,
    paint: repaint,
    add,
    dismiss,
    clear,
    replay,
    down,
    move,
    up,
    cancel,
    click,
    keydown,
    pointer,
    focus,
    destroy,
  };
};

const AnimatedList = forwardRef<AnimatedListHandle, AnimatedListProps>(function AnimatedList(
  {
    items = DEFAULT_ITEMS,
    layout = "list",
    position = "top",
    entrance = "morph",
    interval = 2600,
    initialCount = 4,
    maxItems = 8,
    height = 520,
    gap = 10,
    radius = 20,
    padding = 12,
    iconSize = 40,
    duration = 0.85,
    fade = 120,
    dim = 0.35,
    peek = 12,
    stackDepth = 3,
    expandOnHover = true,
    pauseOnHover = true,
    swipeToDismiss = true,
    liveTime = true,
    unreadDot = true,
    theme = "auto",
    accentColor = "#5227FF",
    cardColor,
    intro = true,
    paused = false,
    className,
    style,
    renderItem,
    onItemClick,
    onDismiss,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const configRef = useRef<Config | null>(null);
  const coreRef = useRef<Core | null>(null);
  const reduced = useSyncExternalStore(subscribeToMotion, readMotion, () => false);
  const [entries, setEntries] = useState<Entry[]>(() => seedEntries(items, initialCount, "i"));

  useLayoutEffect(() => {
    configRef.current = {
      items,
      layout,
      position,
      entrance,
      interval,
      initialCount,
      maxItems,
      gap,
      radius,
      padding,
      iconSize,
      duration,
      fade,
      dim,
      peek,
      stackDepth,
      expandOnHover,
      pauseOnHover,
      swipeToDismiss,
      liveTime,
      intro,
      paused,
      reduced,
      theme,
      accentColor,
      cardColor,
      onItemClick,
      onDismiss,
    };
    coreRef.current?.refresh();
  });

  useLayoutEffect(() => {
    const root = rootRef.current;
    const list = listRef.current;
    if (!root || !list) return;
    const core = createCore(root, list, () => configRef.current as Config, setEntries);
    coreRef.current = core;
    return () => {
      core.destroy();
      coreRef.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    coreRef.current?.sync(entries);
  }, [entries]);

  useLayoutEffect(() => {
    coreRef.current?.paint();
  }, [theme, accentColor, cardColor]);

  useImperativeHandle(
    ref,
    () => ({
      push: (item: AnimatedListItem) => coreRef.current?.add(item),
      dismiss: (id: string | number) => coreRef.current?.dismiss(id),
      clear: () => coreRef.current?.clear(),
      replay: () => coreRef.current?.replay(),
    }),
    [],
  );

  const clickable = Boolean(onItemClick);
  const interactive = clickable || swipeToDismiss;
  const rootStyle = {
    "--al-radius": `${radius}px`,
    "--al-pad": `${padding}px`,
    "--al-icon": `${iconSize}px`,
    "--al-inner": `${Math.max(4, radius - padding)}px`,
    height: typeof height === "number" ? `${height}px` : height,
    ...style,
  } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full overflow-x-visible overflow-y-clip", className)}
      style={rootStyle}
      onPointerEnter={(event) => coreRef.current?.pointer(event, "enter")}
      onPointerMove={(event) => coreRef.current?.pointer(event, "move")}
      onPointerLeave={(event) => coreRef.current?.pointer(event, "leave")}
      onFocus={() => coreRef.current?.focus(true)}
      onBlur={(event: ReactFocusEvent<HTMLDivElement>) =>
        coreRef.current?.focus(event.currentTarget.contains(event.relatedTarget as Node | null))
      }
    >
      <ul ref={listRef} className="relative m-0 h-full list-none p-0">
        {entries.map((entry) => {
          const { item } = entry;
          const custom = renderItem ? renderItem(item) : item.content;
          const stamp = item.time ?? (liveTime ? formatAge(entry.ago) : null);
          return (
            <li
              key={entry.key}
              data-al-key={entry.key}
              tabIndex={interactive ? 0 : undefined}
              role={clickable ? "button" : undefined}
              className={cn("group absolute left-0 top-0 w-full select-none outline-none", swipeToDismiss && "touch-pan-y")}
              style={{ opacity: 0, transformOrigin: "0 0" }}
              onPointerDown={(event) => coreRef.current?.down(event, entry.key)}
              onPointerMove={(event) => coreRef.current?.move(event, entry.key)}
              onPointerUp={(event) => coreRef.current?.up(event, entry.key)}
              onPointerCancel={(event) => coreRef.current?.cancel(event, entry.key)}
              onClick={() => coreRef.current?.click(entry.key)}
              onKeyDown={(event) => coreRef.current?.keydown(event, entry.key)}
            >
              <div
                data-al-surface=""
                className={cn(
                  "relative flex items-start gap-[var(--al-pad)] overflow-hidden rounded-[var(--al-radius)] bg-[var(--al-card)] p-[var(--al-pad)] text-[color:var(--al-text)] transition-[background-color,scale] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] [box-shadow:var(--al-shadow)] group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-[color:var(--al-accent)]",
                  interactive && "group-active:scale-[0.985] hover:bg-[var(--al-card-hover)]",
                  clickable ? "cursor-pointer" : swipeToDismiss && "cursor-grab",
                )}
              >
                {custom != null ? (
                  <div data-al-body="" className="min-w-0 flex-1">
                    {custom}
                  </div>
                ) : (
                  <>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        draggable={false}
                        className="block size-[var(--al-icon)] shrink-0 rounded-[var(--al-inner)] object-cover"
                      />
                    ) : item.icon ? (
                      <span className="flex size-[var(--al-icon)] shrink-0 items-center justify-center rounded-[var(--al-inner)] bg-[var(--al-tile)] text-[color:var(--al-glyph)] [&>svg]:size-[46%]">
                        {item.icon}
                      </span>
                    ) : null}
                    <div data-al-body="" className="min-w-0 flex-1 self-center">
                      <div className="flex items-baseline gap-2">
                        {item.title != null && (
                          <p className="m-0 min-w-0 flex-1 truncate text-[14px] font-semibold leading-[1.35] tracking-[-0.01em]">
                            {item.title}
                          </p>
                        )}
                        {stamp != null && (
                          <span
                            data-al-stamp=""
                            className="ml-auto shrink-0 text-[12px] leading-[1.35] tabular-nums text-[color:var(--al-text-3)]"
                          >
                            {stamp}
                          </span>
                        )}
                        {entry.fresh && unreadDot && (
                          <span
                            data-al-dot=""
                            aria-hidden="true"
                            className="size-1.5 shrink-0 self-center rounded-full bg-[var(--al-accent)] transition-[opacity,width,margin-left] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
                          />
                        )}
                      </div>
                      {item.description != null && (
                        <p className="m-0 mt-0.5 line-clamp-2 text-[13px] leading-[1.4] text-[color:var(--al-text-2)]">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </>
                )}
                <span
                  data-al-shade=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-[var(--al-page)] opacity-0"
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
});

AnimatedList.displayName = "AnimatedList";

export { AnimatedList };
export default AnimatedList;
