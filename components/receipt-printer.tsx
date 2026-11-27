"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/lib/utils";

export interface ReceiptItem {
  name: string;
  price: number;
  qty?: number;
}

export type ReceiptLine =
  | { type: "title"; text: string }
  | { type: "text"; text: string; align?: "left" | "center" | "right"; muted?: boolean; bold?: boolean }
  | { type: "row"; label: string; value: string; bold?: boolean; muted?: boolean }
  | { type: "divider" }
  | { type: "barcode"; value: string }
  | { type: "space" };

export interface ReceiptPrinterHandle {
  print: () => void;
  tear: () => void;
}

export interface ReceiptPrinterProps {
  title?: string;
  subtitle?: string;
  order?: number;
  items?: ReceiptItem[];
  currency?: string;
  tax?: number;
  footer?: string;
  barcode?: boolean;
  lines?: ReceiptLine[];
  width?: number;
  speed?: number;
  hold?: number;
  autoplay?: boolean;
  intro?: boolean;
  curl?: number;
  tearable?: boolean;
  theme?: "auto" | "light" | "dark";
  paperColor?: string;
  inkColor?: string;
  printerColor?: string;
  onTear?: () => void;
  onPrinted?: () => void;
  /** Print and tear a single time; no reprint after the tear. (TCG addition) */
  once?: boolean;
  /** Stop feeding halfway through the last line, so the tear cuts it in two. (TCG addition) */
  cutLast?: boolean;
  /** Font for the receipt text. Defaults to a monospace stack. (TCG addition) */
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

interface Palette {
  paper: string;
  ink: string;
  faded: string;
  printer: string;
  slot: string;
  edge: string;
  shadow: string;
}

interface Toss {
  id: number;
  lines: ReceiptLine[];
  height: number;
  y: number;
  vy: number;
  vx: number;
  x: number;
  spin: number;
  angle: number;
  life: number;
}

const MONO = 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace';
const TEETH = 6;
const PRINTER_HEIGHT = 46;
const INTRO_MS = 980;
const SLOT_Y = 11;
const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.07 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

const DEFAULT_ITEMS: ReceiptItem[] = [
  { name: "Flat white", price: 4.5, qty: 2 },
  { name: "Almond croissant", price: 4.5 },
  { name: "Cold brew", price: 5.25 },
  { name: "Banana bread", price: 3.75 },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const finite = (value: number | undefined, fallback: number) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);

const hash = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const subscribeToMotion = (notify: () => void) => {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

const readMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const luminance = (color: string, probe: CanvasRenderingContext2D | null) => {
  if (!probe) return -1;
  probe.fillStyle = "#010203";
  probe.fillStyle = color;
  if (String(probe.fillStyle) === "#010203" && color.trim().toLowerCase() !== "#010203") return -1;
  probe.clearRect(0, 0, 1, 1);
  probe.fillRect(0, 0, 1, 1);
  const rgba = probe.getImageData(0, 0, 1, 1).data;
  if (rgba[3] / 255 < 0.5) return -1;
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
      const color = view.getComputedStyle(node).backgroundColor;
      const value = luminance(color, probe);
      if (value >= 0) return { dark: value < 0.35, color };
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

const makePalette = (dark: boolean, paper?: string, ink?: string, printer?: string): Palette => ({
  paper: paper || (dark ? "#F1EFEA" : "#FCFBF8"),
  ink: ink || "#25252A",
  faded: "rgba(37,37,42,0.55)",
  printer: printer || (dark ? "#1E1E22" : "#26262B"),
  slot: "#050506",
  edge: dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.12)",
  shadow: dark ? "0 18px 40px -18px rgba(0,0,0,0.9)" : "0 18px 36px -20px rgba(20,20,40,0.35), 0 2px 6px rgba(20,20,40,0.08)",
});

const money = (value: number, currency: string) => `${currency}${value.toFixed(2)}`;

const stamp = (order: number) => {
  const minutes = 8 * 60 + 42 + (order % 600);
  const hh = String(Math.floor(minutes / 60) % 24).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `11 NOV 2026  ${hh}:${mm}`;
};

const buildLines = (
  title: string,
  subtitle: string,
  order: number,
  items: ReceiptItem[],
  currency: string,
  tax: number,
  footer: string,
  barcode: boolean,
): ReceiptLine[] => {
  const subtotal = items.reduce((sum, item) => sum + finite(item.price, 0) * Math.max(1, Math.round(finite(item.qty, 1))), 0);
  const taxed = subtotal * tax;
  const lines: ReceiptLine[] = [{ type: "title", text: title }];
  if (subtitle) lines.push({ type: "text", text: subtitle, align: "center", muted: true });
  lines.push({ type: "space" });
  lines.push({ type: "row", label: `ORDER #${order}`, value: stamp(order).split("  ")[1], muted: true });
  lines.push({ type: "text", text: stamp(order).split("  ")[0], muted: true });
  lines.push({ type: "divider" });
  items.forEach((item) => {
    const qty = Math.max(1, Math.round(finite(item.qty, 1)));
    lines.push({ type: "row", label: qty > 1 ? `${qty} x ${item.name}` : item.name, value: money(finite(item.price, 0) * qty, currency) });
  });
  lines.push({ type: "divider" });
  lines.push({ type: "row", label: "Subtotal", value: money(subtotal, currency), muted: true });
  if (tax > 0) lines.push({ type: "row", label: `Tax ${Number((tax * 100).toFixed(3))}%`, value: money(taxed, currency), muted: true });
  lines.push({ type: "row", label: "TOTAL", value: money(subtotal + taxed, currency), bold: true });
  if (barcode) {
    lines.push({ type: "space" });
    lines.push({ type: "barcode", value: String(order * 7919 + 100000000).slice(0, 12) });
  }
  if (footer) {
    lines.push({ type: "space" });
    lines.push({ type: "text", text: footer, align: "center" });
  }
  return lines;
};

const Bars = ({ value, ink }: { value: string; ink: string }) => {
  const seed = Array.from(value).reduce((sum, char) => sum * 31 + char.charCodeAt(0), 7) % 1000;
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  for (let i = 0; i < 46; i += 1) {
    const w = 1 + Math.floor(hash(i, seed) * 3);
    const space = 1 + Math.floor(hash(seed, i * 1.7) * 2.4);
    bars.push({ x, w });
    x += w + space;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <svg width={x} height={34} viewBox={`0 0 ${x} 34`} aria-hidden="true">
        {bars.map((bar, index) => (
          <rect key={index} x={bar.x} y={0} width={bar.w} height={34} fill={ink} />
        ))}
      </svg>
      <span style={{ fontSize: 10, letterSpacing: "0.32em" }}>{value}</span>
    </div>
  );
};

const Lines = ({ lines, palette }: { lines: ReceiptLine[]; palette: Palette }) => (
  <>
    {lines.map((line, index) => {
      const key = `${line.type}-${index}`;
      if (line.type === "title") {
        return (
          <div key={key} data-line="" style={{ textAlign: "center", fontSize: 14, fontWeight: 700, letterSpacing: "0.16em", padding: "4px 0 2px" }}>
            {line.text}
          </div>
        );
      }
      if (line.type === "text") {
        return (
          <div
            key={key}
            data-line=""
            /* TCG: wraps rather than truncating, so a long fix title reads in full. */
            style={{ textAlign: line.align ?? "left", color: line.muted ? palette.faded : palette.ink, fontWeight: line.bold ? 700 : 400, padding: "1px 0", whiteSpace: "normal", overflowWrap: "anywhere" }}
          >
            {line.text}
          </div>
        );
      }
      if (line.type === "row") {
        return (
          <div
            key={key}
            data-line=""
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              color: line.muted ? palette.faded : palette.ink,
              fontWeight: line.bold ? 700 : 400,
              fontSize: line.bold ? 14 : 12.5,
              padding: line.bold ? "4px 0 2px" : "1px 0",
            }}
          >
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{line.label}</span>
            <span style={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{line.value}</span>
          </div>
        );
      }
      if (line.type === "divider") {
        return <div key={key} data-line="" style={{ height: 13, backgroundImage: `linear-gradient(90deg, ${palette.faded} 50%, transparent 50%)`, backgroundSize: "6px 1px", backgroundRepeat: "repeat-x", backgroundPosition: "0 6px" }} />;
      }
      if (line.type === "barcode") {
        return (
          <div key={key} data-line="" style={{ padding: "2px 0" }}>
            <Bars value={line.value} ink={palette.ink} />
          </div>
        );
      }
      return <div key={key} data-line="" style={{ height: 10 }} />;
    })}
  </>
);

const ReceiptPrinter = forwardRef<ReceiptPrinterHandle, ReceiptPrinterProps>(function ReceiptPrinter(
  {
    title = "NORTHSIDE COFFEE",
    subtitle = "214 Mercer St, New York",
    order = 4821,
    items = DEFAULT_ITEMS,
    currency = "$",
    tax = 0.08875,
    footer = "Thank you. See you tomorrow.",
    barcode = true,
    lines,
    width = 280,
    speed = 1,
    hold = 2600,
    autoplay = true,
    intro = true,
    curl = 0.5,
    tearable = true,
    theme = "auto",
    paperColor,
    inkColor,
    printerColor,
    onTear,
    onPrinted,
    once = false,
    cutLast = false,
    fontFamily,
    className,
    style,
  },
  ref,
) {
  const tornRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const tossRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const engineRef = useRef({
    fed: 0,
    velocity: 0,
    step: 0,
    stops: [] as number[],
    wait: 0,
    pull: 0,
    pullVelocity: 0,
    dragging: false,
    dragStart: 0,
    dragLast: 0,
    dragTime: 0,
    dragSpeed: 0,
    phase: "idle" as "idle" | "printing" | "holding" | "tearing" | "resting",
    timer: 0,
    tosses: [] as Toss[],
  });
  const wakeRef = useRef<() => void>(() => {});
  const settingsRef = useRef({ speed, hold, autoplay, curl, tearable });
  const callbacksRef = useRef({ onTear, onPrinted });
  const ledRef = useRef<HTMLDivElement>(null);
  const introRef = useRef({ wanted: intro, at: 0 });
  const reduced = useSyncExternalStore(subscribeToMotion, readMotion, () => false);
  const [probed, setProbed] = useState(false);
  const [round, setRound] = useState(0);
  const [height, setHeight] = useState(0);
  const [tosses, setTosses] = useState<Toss[]>([]);
  const [seen, setSeen] = useState(false);
  const [entered, setEntered] = useState(() => !intro);

  const dark = theme === "auto" ? probed : theme === "dark";
  const palette = makePalette(dark, paperColor, inkColor, printerColor);
  const paperWidth = clamp(finite(width, 280), 180, 520);
  const printerWidth = paperWidth + 44;

  const itemsKey = JSON.stringify(items);
  const linesKey = JSON.stringify(lines ?? null);
  const content = useMemo<ReceiptLine[]>(() => {
    const custom = JSON.parse(linesKey) as ReceiptLine[] | null;
    if (Array.isArray(custom) && custom.length) return custom;
    const list = JSON.parse(itemsKey) as ReceiptItem[];
    return buildLines(title, subtitle, Math.round(finite(order, 4821)) + round, Array.isArray(list) ? list : [], currency, clamp(finite(tax, 0), 0, 1), footer, barcode);
  }, [barcode, currency, footer, itemsKey, linesKey, order, round, subtitle, tax, title]);

  useEffect(() => {
    settingsRef.current = { speed, hold, autoplay, curl, tearable };
    callbacksRef.current = { onTear, onPrinted };
    introRef.current.wanted = intro;
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root || theme !== "auto") return;
    const doc = root.ownerDocument;
    const viewport = doc.defaultView ?? window;
    const probe = doc.createElement("canvas").getContext("2d", { willReadFrequently: true });
    const measure = () => {
      setProbed(readBackdrop(root, probe).dark);
    };
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
    if (!root) return;
    const view = root.ownerDocument.defaultView ?? window;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          const still = view.matchMedia("(prefers-reduced-motion: reduce)").matches;
          if (introRef.current.wanted && !still && typeof root.animate === "function") {
            introRef.current.at = view.performance.now();
            root.animate(
              [
                { opacity: 0, transform: "translateY(22px) scale(0.97)" },
                { opacity: 1, transform: "none" },
              ],
              { duration: 680, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
            );
            ledRef.current?.animate(
              [
                { opacity: 0.18, offset: 0 },
                { opacity: 0.18, offset: 0.3 },
                { opacity: 1, offset: 0.32 },
                { opacity: 1, offset: 0.52 },
                { opacity: 0.18, offset: 0.54 },
                { opacity: 0.18, offset: 0.72 },
                { opacity: 1, offset: 0.74 },
                { opacity: 1, offset: 1 },
              ],
              { duration: 720, delay: 260, fill: "backwards" },
            );
          }
          setEntered(true);
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    const measure = () => {
      let total = sheet.offsetHeight;
      let stops: number[] = [];
      const nodes = Array.from(sheet.querySelectorAll<HTMLElement>("[data-line]"));
      nodes.forEach((node) => stops.push(Math.min(total, node.offsetTop - sheet.offsetTop + node.offsetHeight)));
      stops.push(total);
      if (cutLast && nodes.length) {
        /* TCG: end the feed halfway down the last line; the tear cuts through it. */
        const last = nodes[nodes.length - 1];
        const cut = last.offsetTop - sheet.offsetTop + last.offsetHeight * 0.5;
        stops = stops.filter((v) => v < cut);
        stops.push(cut);
        total = cut;
      }
      engineRef.current.stops = stops;
      setHeight(total);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(sheet);
    return () => observer.disconnect();
  }, [content, paperWidth, cutLast]);

  const startPrint = useCallback(() => {
    const engine = engineRef.current;
    engine.fed = 0;
    engine.velocity = 0;
    engine.step = 0;
    engine.wait = 0;
    engine.pull = 0;
    engine.pullVelocity = 0;
    engine.phase = "printing";
    wakeRef.current();
  }, []);

  const tear = useCallback(
    (velocity = -900) => {
      const engine = engineRef.current;
      if (engine.phase === "tearing" || engine.fed < 4) return;
      const id = Date.now() + Math.random();
      const sheet: Toss = {
        id,
        lines: content,
        height: engine.fed,
        y: -engine.pull,
        vy: Math.min(-420, velocity),
        vx: (hash(id, 1) - 0.5) * 160,
        x: 0,
        spin: (hash(id, 2) - 0.5) * 50,
        angle: 0,
        life: 0,
      };
      engine.tosses.push(sheet);
      setTosses([...engine.tosses]);
      engine.phase = "tearing";
      engine.timer = 0;
      engine.fed = 0;
      engine.pull = 0;
      engine.pullVelocity = 0;
      tornRef.current = true;
      callbacksRef.current.onTear?.();
      wakeRef.current();
    },
    [content],
  );

  useImperativeHandle(ref, () => ({ print: () => startPrint(), tear: () => tear() }), [startPrint, tear]);

  useEffect(() => {
    if (!seen || !height) return;
    const engine = engineRef.current;
    if (reduced) {
      engine.fed = height;
      engine.phase = "holding";
      engine.timer = 0;
      wakeRef.current();
      return;
    }
    if (engine.phase !== "idle" && engine.phase !== "resting") return;
    if (once && tornRef.current) return;
    const view = rootRef.current?.ownerDocument.defaultView ?? window;
    const wait = introRef.current.at ? Math.max(0, INTRO_MS - (view.performance.now() - introRef.current.at)) : 0;
    if (!wait) {
      startPrint();
      return;
    }
    const timer = view.setTimeout(() => {
      const current = engineRef.current.phase;
      if (current === "idle" || current === "resting") startPrint();
    }, wait);
    return () => view.clearTimeout(timer);
  }, [height, reduced, seen, startPrint, once]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const doc = root.ownerDocument;
    const viewport = doc.defaultView ?? window;
    let raf = 0;
    let last = 0;
    let visible = true;
    let ticking = false;
    const paint = () => {
      const engine = engineRef.current;
      const paper = paperRef.current;
      const lean = clamp(finite(settingsRef.current.curl, 0.5), 0, 1);
      if (paper) {
        const shown = engine.fed + engine.pull;
        paper.style.transform = `translate3d(-50%, ${(height - shown).toFixed(2)}px, 0) rotateX(${(lean * 9 * clamp(shown / 160, 0, 1)).toFixed(2)}deg)`;
        paper.style.visibility = engine.fed > 0.5 ? "visible" : "hidden";
      }
      engine.tosses.forEach((sheet) => {
        const node = tossRefs.current.get(sheet.id);
        if (!node) return;
        node.style.transform = `translate3d(calc(-50% + ${sheet.x.toFixed(1)}px), ${sheet.y.toFixed(1)}px, 0) rotate(${sheet.angle.toFixed(2)}deg) rotateX(${(lean * 9).toFixed(1)}deg)`;
        node.style.opacity = clamp(1 - (sheet.life - 0.25) / 0.45, 0, 1).toFixed(3);
      });
    };
    const tick = (time: number) => {
      raf = 0;
      ticking = true;
      const dt = Math.min(0.05, last ? (time - last) / 1000 : 1 / 60);
      last = time;
      const engine = engineRef.current;
      const { speed: tempo, hold: pause, autoplay: auto } = settingsRef.current;
      const rate = clamp(finite(tempo, 1), 0.2, 4);
      let moving = engine.tosses.length > 0 || engine.dragging;
      if (engine.phase === "printing") {
        moving = true;
        const stop = engine.stops[engine.step] ?? height;
        if (engine.wait > 0) engine.wait -= dt * 1000 * rate;
        else {
          const k = 1400;
          const c = 2 * Math.sqrt(k) * 0.95;
          engine.velocity += (k * (stop - engine.fed) - c * engine.velocity) * dt;
          engine.fed = Math.min(height, engine.fed + engine.velocity * dt);
          if (Math.abs(stop - engine.fed) < 0.6) {
            engine.fed = stop;
            engine.velocity = 0;
            engine.step += 1;
            engine.wait = 70 + hash(engine.step, height) * 50;
            if (engine.step >= engine.stops.length) {
              engine.fed = height;
              engine.phase = "holding";
              engine.timer = 0;
              callbacksRef.current.onPrinted?.();
            }
          }
        }
      } else if (engine.phase === "holding") {
        if (auto && !engine.dragging && !reduced) {
          engine.timer += dt * 1000;
          moving = true;
          if (engine.timer > Math.max(400, finite(pause, 2600))) tear(-1100);
        }
      } else if (engine.phase === "tearing") {
        moving = true;
        engine.timer += dt * 1000;
        if (engine.timer > 700 && !engine.tosses.length) {
          engine.phase = "resting";
          engine.timer = 0;
          setRound((value) => value + 1);
        }
      }
      if (!engine.dragging && engine.pull !== 0) {
        const k = 500;
        const c = 2 * Math.sqrt(k) * 0.5;
        engine.pullVelocity += (k * -engine.pull - c * engine.pullVelocity) * dt;
        engine.pull += engine.pullVelocity * dt;
        if (Math.abs(engine.pull) < 0.2 && Math.abs(engine.pullVelocity) < 1) {
          engine.pull = 0;
          engine.pullVelocity = 0;
        } else moving = true;
      }
      if (engine.tosses.length) {
        engine.tosses.forEach((sheet) => {
          sheet.life += dt;
          sheet.vy += 900 * dt * clamp(sheet.life * 2, 0, 1);
          sheet.y += sheet.vy * dt;
          sheet.x += sheet.vx * dt;
          sheet.angle += sheet.spin * dt;
        });
        const before = engine.tosses.length;
        engine.tosses = engine.tosses.filter((sheet) => sheet.life < 0.75);
        if (engine.tosses.length !== before) setTosses([...engine.tosses]);
      }
      paint();
      ticking = false;
      if (moving && visible && !doc.hidden) raf = viewport.requestAnimationFrame(tick);
    };
    const wake = () => {
      if (raf || ticking || !visible || doc.hidden) return;
      last = 0;
      raf = viewport.requestAnimationFrame(tick);
    };
    wakeRef.current = wake;
    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) wake();
    });
    observer.observe(root);
    const onVisibility = () => wake();
    doc.addEventListener("visibilitychange", onVisibility);
    paint();
    wake();
    return () => {
      wakeRef.current = () => {};
      observer.disconnect();
      doc.removeEventListener("visibilitychange", onVisibility);
      viewport.cancelAnimationFrame(raf);
    };
  }, [height, reduced, tear]);

  useEffect(() => {
    const engine = engineRef.current;
    if (engine.phase === "resting" && height && !(once && tornRef.current)) {
      const viewport = rootRef.current?.ownerDocument.defaultView ?? window;
      const id = viewport.setTimeout(() => {
        if (engineRef.current.phase === "resting") startPrint();
      }, reduced ? 0 : 420);
      return () => viewport.clearTimeout(id);
    }
  }, [height, reduced, round, startPrint, once]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const engine = engineRef.current;
    if (!settingsRef.current.tearable || engine.fed < 20 || engine.phase === "tearing") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    engine.dragging = true;
    engine.dragStart = event.clientY;
    engine.dragLast = event.clientY;
    engine.dragTime = event.timeStamp;
    engine.dragSpeed = 0;
    wakeRef.current();
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const engine = engineRef.current;
    if (!engine.dragging) return;
    const rise = engine.dragStart - event.clientY;
    const span = Math.max(1, event.timeStamp - engine.dragTime);
    engine.dragSpeed = ((engine.dragLast - event.clientY) / span) * 1000;
    engine.dragLast = event.clientY;
    engine.dragTime = event.timeStamp;
    engine.pull = rise > 0 ? 64 * (1 - Math.exp(-rise / 64)) : rise * 0.15;
    if (rise > 70) {
      engine.dragging = false;
      tear(-Math.max(600, engine.dragSpeed));
    }
    wakeRef.current();
  };

  const onPointerUp = () => {
    const engine = engineRef.current;
    if (!engine.dragging) return;
    engine.dragging = false;
    if (engine.dragSpeed > 900 && engine.pull > 20) tear(-engine.dragSpeed);
    wakeRef.current();
  };

  const teethTop = `conic-gradient(from 135deg at 50% 0, #000 90deg, transparent 90deg)`;
  const teethBottom = `conic-gradient(from -45deg at 50% 100%, #000 90deg, transparent 90deg)`;
  const body = "linear-gradient(#000, #000)";
  const anchor = PRINTER_HEIGHT - SLOT_Y - 2;
  const sheetStyle = (torn: boolean): CSSProperties => {
    const image = torn ? `${teethTop}, ${body}, ${teethBottom}` : `${teethTop}, ${body}`;
    const size = torn ? `10px ${TEETH}px, 100% calc(100% - ${TEETH * 2 - 2}px), 10px ${TEETH}px` : `10px ${TEETH}px, 100% calc(100% - ${TEETH - 1}px)`;
    const position = torn ? `0 0, 0 ${TEETH - 1}px, 0 100%` : `0 0, 0 ${TEETH - 1}px`;
    const repeat = torn ? "repeat-x, no-repeat, repeat-x" : "repeat-x, no-repeat";
    return {
      boxSizing: "border-box",
      padding: `${TEETH + 12}px 18px 20px`,
      backgroundColor: palette.paper,
      backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.045), rgba(0,0,0,0) 20%), ${NOISE}`,
      backgroundSize: "100% 100%, 160px 160px",
      color: palette.ink,
      fontFamily: fontFamily ?? MONO,
      fontSize: 12.5,
      lineHeight: 1.45,
      WebkitMaskImage: image,
      maskImage: image,
      WebkitMaskSize: size,
      maskSize: size,
      WebkitMaskPosition: position,
      maskPosition: position,
      WebkitMaskRepeat: repeat,
      maskRepeat: repeat,
    };
  };
  const holder: CSSProperties = {
    position: "absolute",
    left: "50%",
    bottom: anchor,
    width: paperWidth,
    transformOrigin: "50% 100%",
    filter: `drop-shadow(${dark ? "0 8px 14px rgba(0,0,0,0.5)" : "0 8px 14px rgba(20,20,40,0.14)"})`,
    willChange: "transform",
  };
  const shell = `linear-gradient(180deg, color-mix(in oklab, ${palette.printer}, white 12%), ${palette.printer} 30%, color-mix(in oklab, ${palette.printer}, black 28%))`;

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={`Receipt: ${content
        .map((line) => (line.type === "row" ? `${line.label} ${line.value}` : line.type === "text" || line.type === "title" ? line.text : ""))
        .filter(Boolean)
        .join(", ")}`}
      className={cn("relative select-none", className)}
      style={{ width: printerWidth, maxWidth: "100%", height: (height || 420) + PRINTER_HEIGHT + 24, opacity: intro && !reduced && !entered ? 0 : undefined, ...style }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: PRINTER_HEIGHT,
          borderRadius: 14,
          background: shell,
          boxShadow: `inset 0 1px 0 ${palette.edge}, ${palette.shadow}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: SLOT_Y - 2,
            width: paperWidth + 16,
            height: 5,
            transform: "translateX(-50%)",
            borderRadius: 3,
            background: palette.slot,
            boxShadow: "inset 0 2px 3px rgba(0,0,0,0.85)",
          }}
        />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: -600, bottom: anchor - 4, overflow: "hidden", perspective: 1400, perspectiveOrigin: "50% 100%", pointerEvents: "none" }}>
        {tosses.map((sheet) => (
          <div
            key={sheet.id}
            ref={(node) => {
              if (node) tossRefs.current.set(sheet.id, node);
              else tossRefs.current.delete(sheet.id);
            }}
            aria-hidden="true"
            style={{ ...holder, bottom: 4 }}
          >
            <div style={{ ...sheetStyle(true), height: sheet.height + TEETH, overflow: "hidden" }}>
              <Lines lines={sheet.lines} palette={palette} />
            </div>
          </div>
        ))}
        <div
          ref={paperRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{ ...holder, bottom: 4, visibility: "hidden", pointerEvents: "auto", cursor: tearable ? "grab" : undefined, touchAction: "none" }}
        >
          <div style={sheetStyle(false)}>
            <div ref={sheetRef}>
              <Lines lines={content} palette={palette} />
            </div>
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: PRINTER_HEIGHT - SLOT_Y - 3,
          borderRadius: "0 0 14px 14px",
          background: `linear-gradient(180deg, color-mix(in oklab, ${palette.printer}, white 7%), ${palette.printer} 25%, color-mix(in oklab, ${palette.printer}, black 28%))`,
          boxShadow: `inset 0 1px 0 ${palette.edge}`,
          pointerEvents: "none",
        }}
      >
        <div ref={ledRef} style={{ position: "absolute", right: 16, top: "50%", width: 5, height: 5, marginTop: -2.5, borderRadius: 3, background: "#4ADE80", boxShadow: "inset 0 -1px 1px rgba(0,0,0,0.35)" }} />
      </div>
    </div>
  );
});

ReceiptPrinter.displayName = "ReceiptPrinter";

export { ReceiptPrinter };
export default ReceiptPrinter;
