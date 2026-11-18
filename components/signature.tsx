"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { cn } from "@/lib/utils";

export interface SignaturePoint {
  x: number;
  y: number;
  t?: number;
  p?: number;
}

export type SignatureStroke = SignaturePoint[];

export interface SignatureHandle {
  play: () => void;
  clear: () => void;
  undo: () => void;
  getStrokes: () => SignatureStroke[];
  toSVG: () => string;
  toDataURL: (type?: string) => string;
}

export interface SignatureProps {
  mode?: "play" | "sign";
  strokes?: SignatureStroke[];
  pen?: "fountain" | "ballpoint" | "marker";
  thickness?: number;
  speed?: number;
  autoplay?: boolean;
  loop?: boolean;
  pause?: number;
  frame?: boolean;
  line?: boolean;
  name?: string;
  role?: string;
  placeholder?: string;
  aspect?: number;
  intro?: boolean;
  theme?: "auto" | "light" | "dark";
  inkColor?: string;
  surfaceColor?: string;
  onChange?: (strokes: SignatureStroke[]) => void;
  onComplete?: () => void;
  className?: string;
  style?: CSSProperties;
}

interface Ink {
  xs: number[];
  ys: number[];
  ws: number[];
  ts: number[];
}

interface Trail {
  ink: Ink;
  raw: SignaturePoint[];
  speed: number;
  width: number;
}

const UNITS = 1000;
const NIB = (-38 * Math.PI) / 180;
const LIFT_MS = 150;
const FAMILY = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica, Arial, sans-serif';

const ELENA = [
  186, 100, 172, 80, 144, 70, 112, 78, 98, 100, 110, 124, 132, 134, 112, 138, 88, 152, 76, 188, 90, 226, 126, 244, 168, 236, 196, 212, 222, 160, 240, 100, 238, 80, 226, 84,
  216, 126, 212, 186, 220, 236, 240, 244, 262, 224, 276, 204, 272, 192, 258, 196, 252, 220, 262, 242, 286, 240, 300, 214, 306, 198, 304, 222, 302, 244, 312, 214, 328, 198,
  344, 198, 350, 218, 352, 240, 366, 244, 384, 222, 398, 202, 386, 194, 368, 200, 360, 222, 368, 244, 388, 238, 402, 214, 408, 198, 406, 226, 414, 246, 438, 248, 480, 236,
  520, 214, 530, 202, 512, 210, 470, 246, 400, 280, 300, 300, 190, 304, 120, 296, 100, 284, 118, 278, 200, 284, 340, 286, 500, 274, 620, 252,
];

const DEFAULT_STROKES: SignatureStroke[] = [
  Array.from({ length: ELENA.length / 2 }, (_, index) => ({ x: ELENA[index * 2] + (244 - ELENA[index * 2 + 1]) * 0.24, y: ELENA[index * 2 + 1] })),
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const finite = (value: number | undefined, fallback: number) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);

const subscribeToMotion = (notify: () => void) => {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

const readMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const parse = (color: string, probe: CanvasRenderingContext2D | null) => {
  if (!probe) return null;
  probe.fillStyle = "#010203";
  probe.fillStyle = color;
  if (String(probe.fillStyle) === "#010203" && color.trim().toLowerCase() !== "#010203") return null;
  probe.clearRect(0, 0, 1, 1);
  probe.fillRect(0, 0, 1, 1);
  const pixel = probe.getImageData(0, 0, 1, 1).data;
  return [pixel[0], pixel[1], pixel[2], pixel[3] / 255];
};

const luminance = (rgba: number[] | null) => {
  if (!rgba || rgba[3] < 0.5) return -1;
  const linear = (value: number) => {
    const v = value / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(rgba[0]) + 0.7152 * linear(rgba[1]) + 0.0722 * linear(rgba[2]);
};

const readBackdrop = (root: HTMLElement, probe: CanvasRenderingContext2D | null) => {
  let node: Element | null = root.parentElement;
  let view: Window | null = root.ownerDocument.defaultView;
  for (let hop = 0; hop < 4 && view; hop += 1) {
    while (node) {
      const value = luminance(parse(view.getComputedStyle(node).backgroundColor, probe));
      if (value >= 0) return value < 0.35;
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
  if (html.classList.contains("dark")) return true;
  if (html.classList.contains("light")) return false;
  const scheme = own.getComputedStyle(html).colorScheme;
  if (scheme === "dark" || scheme === "light") return scheme === "dark";
  return own.matchMedia("(prefers-color-scheme: dark)").matches;
};

const nibWidth = (pen: string, base: number, angle: number, speed: number, pressure: number) => {
  if (pen === "marker") return base * 1.3;
  if (pen === "ballpoint") return base * 0.42 * (0.85 + 0.3 * pressure);
  const slope = 0.12 + 0.88 * Math.abs(Math.sin(angle - NIB));
  const pace = clamp(1.18 - speed * 0.42, 0.6, 1.18);
  return base * slope * pace * (0.55 + 0.9 * pressure);
};

const emptyInk = (): Ink => ({ xs: [], ys: [], ws: [], ts: [] });

const keypointInk = (points: SignaturePoint[], pen: string, base: number): Ink => {
  const ink = emptyInk();
  if (points.length < 2) return ink;
  const pts = [points[0], ...points, points[points.length - 1]];
  const dense: { x: number; y: number }[] = [];
  for (let i = 1; i < pts.length - 2; i += 1) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2];
    const span = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const steps = Math.max(2, Math.ceil(span / 2.2));
    for (let s = 0; s < steps; s += 1) {
      const t = s / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      dense.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  dense.push({ x: points[points.length - 1].x, y: points[points.length - 1].y });
  const lengths = [0];
  for (let i = 1; i < dense.length; i += 1) lengths.push(lengths[i - 1] + Math.hypot(dense[i].x - dense[i - 1].x, dense[i].y - dense[i - 1].y));
  const total = lengths[lengths.length - 1];
  let time = 0;
  let width = 0;
  for (let i = 0; i < dense.length; i += 1) {
    const prev = dense[Math.max(0, i - 1)];
    const next = dense[Math.min(dense.length - 1, i + 1)];
    const angle = Math.atan2(next.y - prev.y, next.x - prev.x);
    const before = dense[Math.max(0, i - 3)];
    const after = dense[Math.min(dense.length - 1, i + 3)];
    const a1 = Math.atan2(dense[i].y - before.y, dense[i].x - before.x);
    const a2 = Math.atan2(after.y - dense[i].y, after.x - dense[i].x);
    let bend = Math.abs(a2 - a1);
    if (bend > Math.PI) bend = Math.PI * 2 - bend;
    const along = lengths[i];
    const ease = Math.min(1, along / 40, (total - along) / 60 + 0.25);
    const speed = (0.35 + 0.75 * (1 - clamp(bend / 1.2, 0, 1))) * (0.45 + 0.55 * ease);
    if (i > 0) time += (lengths[i] - lengths[i - 1]) / Math.max(0.12, speed);
    const taper = Math.min(1, 0.3 + (along / 16) * 0.7, 0.18 + ((total - along) / 26) * 0.82);
    const target = nibWidth(pen, base, angle, speed, 0.55) * taper;
    width = i === 0 ? target : width + (target - width) * 0.45;
    ink.xs.push(dense[i].x);
    ink.ys.push(dense[i].y);
    ink.ws.push(width);
    ink.ts.push(time);
  }
  return ink;
};

const startTrail = (): Trail => ({ ink: emptyInk(), raw: [], speed: 0, width: 0 });

const extendTrail = (trail: Trail, point: SignaturePoint, pen: string, base: number, finish = false) => {
  const raw = trail.raw;
  if (!finish) raw.push(point);
  const n = raw.length;
  const ink = trail.ink;
  const from = ink.xs.length;
  const emit = (x: number, y: number, t: number, p: number) => {
    const count = ink.xs.length;
    const px = count ? ink.xs[count - 1] : x;
    const py = count ? ink.ys[count - 1] : y;
    const pt = count ? ink.ts[count - 1] : t;
    const distance = Math.hypot(x - px, y - py);
    const elapsed = Math.max(1, t - pt);
    const velocity = count ? distance / elapsed : 0;
    trail.speed = count ? trail.speed + (velocity - trail.speed) * 0.3 : 0;
    const angle = count ? Math.atan2(y - py, x - px) : 0;
    const target = nibWidth(pen, base, angle, trail.speed * 0.6, p) * (count < 6 ? 0.45 + count * 0.09 : 1);
    trail.width = count ? trail.width + (target - trail.width) * 0.35 : target;
    ink.xs.push(x);
    ink.ys.push(y);
    ink.ws.push(trail.width);
    ink.ts.push(t);
  };
  const quad = (ax: number, ay: number, cx: number, cy: number, bx: number, by: number, t0: number, t1: number, p0: number, p1: number) => {
    const span = Math.hypot(cx - ax, cy - ay) + Math.hypot(bx - cx, by - cy);
    const steps = Math.max(1, Math.ceil(span / 1.6));
    for (let s = 1; s <= steps; s += 1) {
      const t = s / steps;
      const u = 1 - t;
      emit(u * u * ax + 2 * u * t * cx + t * t * bx, u * u * ay + 2 * u * t * cy + t * t * by, t0 + (t1 - t0) * t, p0 + (p1 - p0) * t);
    }
  };
  const pressure = (p: SignaturePoint) => clamp(finite(p.p, 0.5), 0, 1);
  const time = (p: SignaturePoint) => finite(p.t, 0);
  if (finish) {
    if (n >= 2) {
      const a = raw[n - 2];
      const b = raw[n - 1];
      quad((a.x + b.x) / 2, (a.y + b.y) / 2, (a.x + b.x) / 2, (a.y + b.y) / 2, b.x, b.y, (time(a) + time(b)) / 2, time(b), pressure(b), pressure(b));
    }
    return from;
  }
  if (n === 1) {
    emit(point.x, point.y, time(point), pressure(point));
  } else if (n === 2) {
    const a = raw[0];
    const b = raw[1];
    quad(a.x, a.y, a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2, time(a), (time(a) + time(b)) / 2, pressure(a), pressure(b));
  } else {
    const a = raw[n - 3];
    const b = raw[n - 2];
    const c = raw[n - 1];
    quad((a.x + b.x) / 2, (a.y + b.y) / 2, b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2, (time(a) + time(b)) / 2, (time(b) + time(c)) / 2, pressure(b), pressure(c));
  }
  return from;
};

const recordedInk = (points: SignaturePoint[], pen: string, base: number) => {
  const trail = startTrail();
  points.forEach((point) => extendTrail(trail, point, pen, base));
  if (points.length) extendTrail(trail, points[points.length - 1], pen, base, true);
  return trail.ink;
};

const outline = (ink: Ink, scale: number, ox: number, oy: number) => {
  const n = ink.xs.length;
  if (!n) return "";
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i < n; i += 1) {
    const prev = Math.max(0, i - 1);
    const next = Math.min(n - 1, i + 1);
    let dx = ink.xs[next] - ink.xs[prev];
    let dy = ink.ys[next] - ink.ys[prev];
    const length = Math.hypot(dx, dy) || 1;
    dx /= length;
    dy /= length;
    const half = (ink.ws[i] / 2) * scale;
    const x = ink.xs[i] * scale + ox;
    const y = ink.ys[i] * scale + oy;
    left.push(`${(x - dy * half).toFixed(2)} ${(y + dx * half).toFixed(2)}`);
    right.push(`${(x + dy * half).toFixed(2)} ${(y - dx * half).toFixed(2)}`);
  }
  const endR = ((ink.ws[n - 1] / 2) * scale).toFixed(2);
  const startR = ((ink.ws[0] / 2) * scale).toFixed(2);
  return `M${left.join(" L")} A${endR} ${endR} 0 0 1 ${right[n - 1]} L${right.reverse().join(" L")} A${startR} ${startR} 0 0 1 ${left[0]} Z`;
};

interface SignatureControl {
  play: () => void;
  clear: () => void;
  undo: () => void;
  redraw: () => void;
  svg: () => string;
  png: (type?: string) => string;
}

const idleControl: SignatureControl = { play: () => {}, clear: () => {}, undo: () => {}, redraw: () => {}, svg: () => "", png: () => "" };

const Signature = forwardRef<SignatureHandle, SignatureProps>(function Signature(
  {
    mode = "play",
    strokes,
    pen = "fountain",
    thickness = 1,
    speed = 1,
    autoplay = true,
    loop = false,
    pause = 2400,
    frame = true,
    line = true,
    name,
    role,
    placeholder = "Sign here",
    aspect = 2.4,
    intro = true,
    theme = "auto",
    inkColor,
    surfaceColor,
    onChange,
    onComplete,
    className,
    style,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<SignatureControl>(idleControl);
  const signedRef = useRef<SignatureStroke[]>([]);
  const settingsRef = useRef({ pen, thickness, speed, loop, pause, autoplay, onChange, onComplete });
  const inkRef = useRef("#1B2A4E");
  const reduced = useSyncExternalStore(subscribeToMotion, readMotion, () => false);
  const [probed, setProbed] = useState(true);
  const [entered, setEntered] = useState(() => !intro);
  const [count, setCount] = useState(0);
  const [inked, setInked] = useState(false);
  const signing = mode === "sign";
  const dark = theme === "auto" ? probed : theme === "dark";
  const ink = inkColor ?? (dark ? "#E4E8F2" : "#1B2A4E");
  const surface = surfaceColor ?? (dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)");
  const muted = dark ? "rgba(244,244,245,0.5)" : "rgba(24,24,27,0.48)";
  const ratio = clamp(finite(aspect, 2.4), 1, 5);
  const strokesKey = JSON.stringify(Array.isArray(strokes) ? strokes : null);
  const hidden = intro && !reduced && !entered;
  const caption = Boolean(name || role);
  const reserve = caption || signing ? 56 : 30;
  const text = dark ? "#F4F4F5" : "#18181B";

  useEffect(() => {
    settingsRef.current = { pen, thickness, speed, loop, pause, autoplay, onChange, onComplete };
    inkRef.current = ink;
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root || theme !== "auto") return;
    const doc = root.ownerDocument;
    const viewport = doc.defaultView ?? window;
    const probe = doc.createElement("canvas").getContext("2d", { willReadFrequently: true });
    const measure = () => setProbed(readBackdrop(root, probe));
    const frames: number[] = [];
    const timers: number[] = [];
    const schedule = () => {
      frames.push(viewport.requestAnimationFrame(measure));
      timers.push(viewport.setTimeout(measure, 380));
    };
    schedule();
    timers.push(viewport.setTimeout(measure, 1200));
    const observer = new MutationObserver(schedule);
    const watch = (target: Document) => {
      observer.observe(target.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
      if (target.body) observer.observe(target.body, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    };
    watch(doc);
    let outer: Element | null = null;
    try {
      outer = viewport.frameElement;
    } catch {
      outer = null;
    }
    if (outer) watch(outer.ownerDocument);
    return () => {
      observer.disconnect();
      frames.forEach((id) => viewport.cancelAnimationFrame(id));
      timers.forEach((id) => viewport.clearTimeout(id));
    };
  }, [theme]);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const doc = root.ownerDocument;
    const viewport = doc.defaultView ?? window;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const given = JSON.parse(strokesKey) as SignatureStroke[] | null;
    const source = (given && given.length ? given : DEFAULT_STROKES).filter((stroke) => Array.isArray(stroke) && stroke.length > 0);
    let cssW = 0;
    let cssH = 0;
    let dpr = 1;
    let scale = 1;
    let ox = 0;
    let oy = 0;
    let inks: Ink[] = [];
    let drawn: number[] = [];
    let starts: number[] = [];
    let clock = -1;
    let raf = 0;
    let ticking = false;
    let last = 0;
    let visible = false;
    let started = false;
    let replayTimer = 0;
    const trails: Trail[] = [];
    let live: Trail | null = null;
    let pointerId = -1;
    let strokeStart = 0;
    let replaying = false;

    const base = () => 9.6 * clamp(finite(settingsRef.current.thickness, 1), 0.2, 4);
    const penStyle = () => settingsRef.current.pen;

    const layout = () => {
      cssW = canvas.clientWidth;
      cssH = canvas.clientHeight;
      dpr = Math.min(2, viewport.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      if (signing) {
        scale = cssW / UNITS;
        ox = 0;
        oy = 0;
        return;
      }
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const stroke of source) {
        for (const point of stroke) {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        }
      }
      const padX = Math.max(20, cssW * 0.08);
      const top = Math.max(18, cssH * 0.1);
      const floor = cssH - reserve + Math.min(10, reserve * 0.2);
      const boxW = Math.max(1, maxX - minX);
      const boxH = Math.max(1, maxY - minY);
      scale = Math.min((cssW - padX * 2) / boxW, (floor - top) / boxH);
      ox = (cssW - boxW * scale) / 2 - minX * scale;
      oy = floor - boxH * scale - minY * scale;
    };

    const prepare = () => {
      const style = penStyle();
      inks = source.map((stroke) => (stroke.some((point) => typeof point.t === "number") ? recordedInk(stroke, style, base()) : keypointInk(stroke, style, base())));
      const rate = clamp(finite(settingsRef.current.speed, 1), 0.2, 5);
      starts = [];
      let at = 0;
      for (const item of inks) {
        starts.push(at);
        const duration = item.ts.length ? item.ts[item.ts.length - 1] : 0;
        at += duration / rate + LIFT_MS;
      }
      drawn = inks.map(() => 0);
    };

    const setInk = () => {
      ctx.fillStyle = inkRef.current;
    };

    const segment = (item: Ink, i: number) => {
      const x1 = item.xs[i] * scale + ox;
      const y1 = item.ys[i] * scale + oy;
      const r1 = Math.max(0.35, (item.ws[i] / 2) * scale);
      ctx.beginPath();
      ctx.arc(x1, y1, r1, 0, Math.PI * 2);
      ctx.fill();
      if (i === 0) return;
      const x0 = item.xs[i - 1] * scale + ox;
      const y0 = item.ys[i - 1] * scale + oy;
      const r0 = Math.max(0.35, (item.ws[i - 1] / 2) * scale);
      const dx = x1 - x0;
      const dy = y1 - y0;
      const length = Math.hypot(dx, dy);
      if (length < 0.01) return;
      const nx = -dy / length;
      const ny = dx / length;
      ctx.beginPath();
      ctx.moveTo(x0 + nx * r0, y0 + ny * r0);
      ctx.lineTo(x1 + nx * r1, y1 + ny * r1);
      ctx.lineTo(x1 - nx * r1, y1 - ny * r1);
      ctx.lineTo(x0 - nx * r0, y0 - ny * r0);
      ctx.closePath();
      ctx.fill();
    };

    const paintRange = (item: Ink, from: number, to: number) => {
      setInk();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (let i = from; i < to; i += 1) segment(item, i);
    };

    const repaint = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (signing) {
        for (const trail of trails) paintRange(trail.ink, 0, trail.ink.xs.length);
        if (live) paintRange(live.ink, 0, live.ink.xs.length);
        return;
      }
      inks.forEach((item, index) => paintRange(item, 0, drawn[index]));
    };

    const step = (dt: number) => {
      if (clock < 0) return false;
      clock += dt * 1000;
      const rate = clamp(finite(settingsRef.current.speed, 1), 0.2, 5);
      let done = true;
      inks.forEach((item, index) => {
        const local = (clock - starts[index]) * rate;
        let target = drawn[index];
        while (target < item.ts.length && item.ts[target] <= local) target += 1;
        if (target > drawn[index]) {
          paintRange(item, drawn[index], target);
          drawn[index] = target;
        }
        if (drawn[index] < item.ts.length) done = false;
      });
      if (done) {
        clock = -1;
        settingsRef.current.onComplete?.();
        if (settingsRef.current.loop && !reduced) {
          replayTimer = viewport.setTimeout(() => write(true), Math.max(200, finite(settingsRef.current.pause, 2400)));
        }
        return false;
      }
      return true;
    };

    const tick = (time: number) => {
      raf = 0;
      ticking = true;
      const dt = Math.min(0.05, last ? (time - last) / 1000 : 1 / 60);
      last = time;
      const busy = step(dt);
      ticking = false;
      if (busy && visible && !doc.hidden) raf = viewport.requestAnimationFrame(tick);
      else last = 0;
    };

    const wake = () => {
      if (raf || ticking || !visible || doc.hidden) return;
      raf = viewport.requestAnimationFrame(tick);
    };

    const fade = (then: () => void) => {
      if (typeof canvas.animate !== "function" || reduced) {
        then();
        return;
      }
      const out = canvas.animate([{ opacity: 1, filter: "blur(0px)" }, { opacity: 0, filter: "blur(2px)" }], { duration: 260, easing: "ease-in" });
      out.onfinish = () => {
        then();
        out.cancel();
      };
    };

    const write = (again: boolean) => {
      viewport.clearTimeout(replayTimer);
      if (signing) return;
      const begin = () => {
        drawn = inks.map(() => 0);
        repaint();
        if (reduced) {
          drawn = inks.map((item) => item.xs.length);
          repaint();
          settingsRef.current.onComplete?.();
          return;
        }
        clock = 0;
        last = 0;
        wake();
      };
      if (again && drawn.some((value) => value > 0)) fade(begin);
      else begin();
    };

    const replaySigned = () => {
      if (!trails.length) return;
      replaying = true;
      const recorded = trails.map((trail) => trail.ink);
      const rate = clamp(finite(settingsRef.current.speed, 1), 0.2, 5);
      let at = 0;
      const offsets = recorded.map((item) => {
        const begin = at;
        at += (item.ts.length ? item.ts[item.ts.length - 1] - item.ts[0] : 0) / rate + LIFT_MS;
        return begin;
      });
      const marks = recorded.map(() => 0);
      fade(() => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let elapsed = 0;
        let prev = 0;
        const run = (time: number) => {
          const dt = prev ? Math.min(50, time - prev) : 16;
          prev = time;
          elapsed += dt;
          let finished = true;
          recorded.forEach((item, index) => {
            const local = (elapsed - offsets[index]) * rate + (item.ts[0] ?? 0);
            let target = marks[index];
            while (target < item.ts.length && item.ts[target] <= local) target += 1;
            if (target > marks[index]) {
              paintRange(item, marks[index], target);
              marks[index] = target;
            }
            if (marks[index] < item.ts.length) finished = false;
          });
          if (!finished && replaying) raf = viewport.requestAnimationFrame(run);
          else {
            raf = 0;
            replaying = false;
          }
        };
        raf = viewport.requestAnimationFrame(run);
      });
    };

    const emit = () => {
      const list = trails.map((trail) => trail.raw.map((point) => ({ x: Math.round(point.x * 10) / 10, y: Math.round(point.y * 10) / 10, t: Math.round(finite(point.t, 0)), p: Math.round(finite(point.p, 0.5) * 100) / 100 })));
      signedRef.current = list;
      setCount(list.length);
      setInked(list.length > 0);
      settingsRef.current.onChange?.(list);
    };

    const locate = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / Math.max(1, rect.width)) * UNITS;
      const y = ((event.clientY - rect.top) / Math.max(1, rect.width)) * UNITS;
      return { x, y };
    };

    const onDown = (event: PointerEvent) => {
      if (!signing) {
        write(true);
        return;
      }
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (replaying) {
        replaying = false;
        viewport.cancelAnimationFrame(raf);
        raf = 0;
        repaint();
      }
      pointerId = event.pointerId;
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        pointerId = event.pointerId;
      }
      event.preventDefault();
      strokeStart = event.timeStamp;
      live = startTrail();
      const at = locate(event);
      const from = extendTrail(live, { x: at.x, y: at.y, t: 0, p: event.pointerType === "pen" ? event.pressure : 0.5 }, penStyle(), base());
      paintRange(live.ink, from, live.ink.xs.length);
      setInked(true);
    };

    const onMove = (event: PointerEvent) => {
      if (!live || event.pointerId !== pointerId) return;
      const events = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : [event];
      for (const sample of events.length ? events : [event]) {
        const at = locate(sample);
        const lastPoint = live.raw[live.raw.length - 1];
        if (lastPoint && Math.hypot(at.x - lastPoint.x, at.y - lastPoint.y) < 0.8) continue;
        const from = extendTrail(live, { x: at.x, y: at.y, t: sample.timeStamp - strokeStart, p: sample.pointerType === "pen" ? sample.pressure : 0.5 }, penStyle(), base());
        paintRange(live.ink, Math.max(0, from - 1), live.ink.xs.length);
      }
    };

    const onUp = (event: PointerEvent) => {
      if (!live || event.pointerId !== pointerId) return;
      const lastPoint = live.raw[live.raw.length - 1];
      const from = extendTrail(live, lastPoint, penStyle(), base(), true);
      paintRange(live.ink, Math.max(0, from - 1), live.ink.xs.length);
      trails.push(live);
      live = null;
      pointerId = -1;
      emit();
    };

    const resize = () => {
      layout();
      if (!signing) {
        const keep = drawn.slice();
        prepare();
        drawn = keep.length === drawn.length ? keep.map((value, index) => Math.min(value, inks[index].xs.length)) : drawn;
      } else {
        const rebuilt = trails.map((trail) => {
          const next = startTrail();
          trail.raw.forEach((point) => extendTrail(next, point, penStyle(), base()));
          if (trail.raw.length) extendTrail(next, trail.raw[trail.raw.length - 1], penStyle(), base(), true);
          return next;
        });
        trails.splice(0, trails.length, ...rebuilt);
      }
      repaint();
    };

    controlRef.current = {
      play: () => (signing ? replaySigned() : write(true)),
      clear: () => {
        if (!signing) {
          fade(() => {
            drawn = inks.map(() => 0);
            repaint();
          });
          return;
        }
        replaying = false;
        fade(() => {
          trails.splice(0, trails.length);
          live = null;
          repaint();
          emit();
        });
      },
      undo: () => {
        if (!signing || !trails.length) return;
        replaying = false;
        trails.pop();
        repaint();
        emit();
      },
      redraw: () => resize(),
      svg: () => {
        const list = signing ? trails.map((trail) => trail.ink) : inks;
        const fill = inkRef.current;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        list.forEach((item) =>
          item.xs.forEach((x, i) => {
            const pad = item.ws[i];
            minX = Math.min(minX, x - pad);
            maxX = Math.max(maxX, x + pad);
            minY = Math.min(minY, item.ys[i] - pad);
            maxY = Math.max(maxY, item.ys[i] + pad);
          }),
        );
        if (!Number.isFinite(minX)) return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>`;
        const paths = list.map((item) => `<path d="${outline(item, 1, -minX, -minY)}" fill="${fill}"/>`).join("");
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${(maxX - minX).toFixed(1)} ${(maxY - minY).toFixed(1)}">${paths}</svg>`;
      },
      png: (type?: string) => canvas.toDataURL(type ?? "image/png"),
    };

    const sight = new IntersectionObserver((entries) => {
      const was = visible;
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible && !was) {
        if (!started) {
          started = true;
          setEntered(true);
          if (!signing && settingsRef.current.autoplay) {
            const delay = intro && !reduced ? 520 : 0;
            replayTimer = viewport.setTimeout(() => write(false), delay);
          } else if (!signing) {
            drawn = inks.map((item) => item.xs.length);
            repaint();
          }
        }
        wake();
      }
    });
    sight.observe(root);
    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas);
    const onVisibility = () => wake();
    doc.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    layout();
    prepare();
    if (!settingsRef.current.autoplay && !signing) drawn = inks.map((item) => item.xs.length);
    repaint();

    return () => {
      viewport.cancelAnimationFrame(raf);
      viewport.clearTimeout(replayTimer);
      sight.disconnect();
      observer.disconnect();
      doc.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      controlRef.current = idleControl;
    };
  }, [intro, reduced, reserve, signing, strokesKey]);

  useEffect(() => {
    controlRef.current.redraw();
  }, [ink, pen, thickness, ratio]);

  const play = useCallback(() => controlRef.current.play(), []);
  const clear = useCallback(() => controlRef.current.clear(), []);
  const undo = useCallback(() => controlRef.current.undo(), []);

  useImperativeHandle(
    ref,
    () => ({
      play,
      clear,
      undo,
      getStrokes: () => signedRef.current,
      toSVG: () => controlRef.current.svg(),
      toDataURL: (type?: string) => controlRef.current.png(type),
    }),
    [clear, play, undo],
  );

  const chip: CSSProperties = {
    height: 28,
    minWidth: 28,
    padding: "0 9px",
    border: 0,
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: FAMILY,
    fontSize: 12,
    fontWeight: 500,
    color: text,
    background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  };

  return (
    <div
      ref={rootRef}
      className={cn("relative w-full", className)}
      style={{
        maxWidth: 560,
        aspectRatio: `${ratio}`,
        borderRadius: 20,
        background: frame ? surface : "transparent",
        color: ink,
        opacity: hidden ? 0 : 1,
        transform: hidden ? "translateY(10px)" : "none",
        transition: "opacity 520ms ease, transform 720ms cubic-bezier(0.22, 1, 0.36, 1)",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={signing ? "Signature pad. Draw your signature with a mouse, pen or finger." : name ? `Signature of ${name}` : "Handwritten signature"}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", touchAction: signing ? "none" : "auto", cursor: signing ? "crosshair" : "pointer", borderRadius: 20 }}
      />
      {line ? (
        <div
          ref={lineRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: reserve,
            height: 1,
            background: dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)",
            transformOrigin: "0 50%",
            transform: hidden ? "scaleX(0)" : "scaleX(1)",
            transition: "transform 900ms cubic-bezier(0.65, 0, 0.35, 1) 120ms",
            pointerEvents: "none",
          }}
        />
      ) : null}
      {signing && placeholder ? (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: reserve,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontFamily: FAMILY,
            fontSize: 14,
            fontWeight: 500,
            color: muted,
            opacity: inked || hidden ? 0 : 1,
            transition: "opacity 260ms ease",
            pointerEvents: "none",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          {placeholder}
        </div>
      ) : null}
      {caption || signing ? (
        <div
          style={{
            position: "absolute",
            left: 20,
            right: 12,
            bottom: 14,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              minWidth: 0,
              fontFamily: FAMILY,
              fontSize: 13,
              whiteSpace: "nowrap",
              overflow: "hidden",
              opacity: hidden ? 0 : 1,
              transition: "opacity 400ms ease 520ms",
            }}
          >
            {name ? <span style={{ fontWeight: 600, color: text, overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span> : null}
            {role ? <span style={{ color: muted, overflow: "hidden", textOverflow: "ellipsis" }}>{role}</span> : null}
          </div>
          {signing ? (
            <div
              style={{
                display: "flex",
                gap: 6,
                flex: "none",
                opacity: inked ? 1 : 0,
                transform: inked ? "translateY(0)" : "translateY(4px)",
                pointerEvents: inked ? "auto" : "none",
                transition: "opacity 220ms ease, transform 220ms ease",
              }}
            >
              <button type="button" onClick={play} aria-label="Replay signature" style={chip} disabled={!count}>
                <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button type="button" onClick={undo} aria-label="Undo last stroke" style={chip} disabled={!count}>
                <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 4 4 9l5 5M4.5 9H14a6 6 0 0 1 0 12h-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button type="button" onClick={clear} style={chip}>
                Clear
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});

Signature.displayName = "Signature";

export { Signature };
export default Signature;
