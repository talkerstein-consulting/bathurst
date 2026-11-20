"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";

export interface DialStat {
  label: string;
  value: number;
  min?: number;
  max?: number;
  prefix?: string;
  unit?: string;
  decimals?: number;
}

export interface InstrumentDialHandle {
  replay: () => void;
}

export interface InstrumentDialProps {
  stats?: DialStat[];
  variant?: "gauge" | "chrono" | "meter";
  ticks?: number;
  majorEvery?: number;
  numerals?: boolean;
  hand?: boolean;
  trail?: number;
  size?: number;
  gap?: number;
  theme?: "auto" | "light" | "dark";
  accentColor?: string;
  trackColor?: string;
  textColor?: string;
  duration?: number;
  bounce?: number;
  stagger?: number;
  motion?: "sweep" | "tick";
  live?: boolean;
  liveAmount?: number;
  replayOnClick?: boolean;
  className?: string;
  style?: CSSProperties;
}

interface Geometry {
  start: number;
  sweep: number;
  closed: boolean;
  width: number;
  height: number;
  cx: number;
  cy: number;
  valueY: number;
  labelY: number;
  valueSize: number;
}

interface Palette {
  text: string;
  muted: string;
  track: string;
  accent: string;
}

interface DialState {
  x: number;
  v: number;
  y: number;
  from: number;
  since: number;
  lastAim: number;
  target: number;
  base: number;
  armedAt: number;
  phase: number;
}

const SANS = 'var(--font-sans, ui-sans-serif), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const OUTER = 90;

const GEOMETRY: Record<NonNullable<InstrumentDialProps["variant"]>, Geometry> = {
  gauge: { start: -135, sweep: 270, closed: false, width: 200, height: 172, cx: 100, cy: 98, valueY: 109, labelY: 158, valueSize: 34 },
  chrono: { start: 0, sweep: 360, closed: true, width: 200, height: 200, cx: 100, cy: 100, valueY: 106, labelY: 127, valueSize: 32 },
  meter: { start: -90, sweep: 180, closed: false, width: 200, height: 128, cx: 100, cy: 102, valueY: 90, labelY: 124, valueSize: 32 },
};

const DEFAULT_STATS: DialStat[] = [
  { label: "Uptime", value: 99.98, max: 100, unit: "%" },
  { label: "P95 latency", value: 42, max: 120, unit: "ms" },
  { label: "Requests", value: 2.4, max: 4, unit: "M" },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const finite = (value: number | undefined, fallback: number) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);

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

const makePalette = (dark: boolean, accent?: string, track?: string, text?: string): Palette =>
  dark
    ? { text: text || "#EDEDEF", muted: "#8C8C95", track: track || "rgba(255,255,255,0.17)", accent: accent || "#A99BFF" }
    : { text: text || "#18181B", muted: "#71717A", track: track || "rgba(0,0,0,0.14)", accent: accent || "#5227FF" };

const decimalsOf = (stat: DialStat) => {
  if (typeof stat.decimals === "number") return clamp(Math.round(stat.decimals), 0, 4);
  const text = String(stat.value);
  const dot = text.indexOf(".");
  return dot < 0 ? 0 : Math.min(3, text.length - dot - 1);
};

const formatter = (decimals: number) =>
  new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const point = (geometry: Geometry, angle: number, radius: number) => {
  const radians = (angle * Math.PI) / 180;
  return [geometry.cx + radius * Math.sin(radians), geometry.cy - radius * Math.cos(radians)];
};

const scaleLabel = (value: number) => {
  const magnitude = Math.abs(value);
  if (magnitude >= 100 || Number.isInteger(value)) return String(Math.round(value));
  if (magnitude >= 10) return value.toFixed(0);
  return String(Math.round(value * 10) / 10);
};

const InstrumentDial = forwardRef<InstrumentDialHandle, InstrumentDialProps>(function InstrumentDial(
  {
    stats = DEFAULT_STATS,
    variant = "gauge",
    ticks,
    majorEvery,
    numerals = false,
    hand = true,
    trail = 0.55,
    size = 240,
    gap = 32,
    theme = "auto",
    accentColor,
    trackColor,
    textColor,
    duration = 1600,
    bounce = 0.3,
    stagger = 140,
    motion = "sweep",
    live = false,
    liveAmount = 0.02,
    replayOnClick = true,
    className,
    style,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tickRefs = useRef<(SVGLineElement | null)[][]>([]);
  const handRefs = useRef<(SVGGElement | null)[]>([]);
  const valueRefs = useRef<(SVGTSpanElement | null)[]>([]);
  const statesRef = useRef<DialState[]>([]);
  const wakeRef = useRef<() => void>(() => {});
  const clockRef = useRef(0);
  const settingsRef = useRef({ duration, bounce, motion, live, liveAmount, trail, stagger });
  const reduced = useSyncExternalStore(subscribeToMotion, readMotion, () => false);
  const [probed, setProbed] = useState(false);
  const [avail, setAvail] = useState(0);
  const [seen, setSeen] = useState(false);
  const dark = theme === "auto" ? probed : theme === "dark";
  const armed = seen || reduced;

  const geometry = GEOMETRY[variant] ?? GEOMETRY.gauge;
  const count = clamp(Math.round(finite(ticks, variant === "chrono" ? 60 : variant === "meter" ? 51 : 101)), 8, 240);
  const major = Math.max(1, Math.round(finite(majorEvery, variant === "chrono" ? 5 : 10)));
  const statsKey = JSON.stringify(stats.map((stat) => [stat.label, stat.value, stat.min ?? 0, stat.max ?? 100, stat.prefix ?? "", stat.unit ?? "", stat.decimals ?? null]));
  const list = useMemo(() => {
    const parsed = JSON.parse(statsKey) as [string, number, number, number, string, string, number | null][];
    return parsed.map(([label, value, min, max, prefix, unit, decimals]) => {
      const stat: DialStat = { label, value, min, max, prefix, unit, decimals: decimals ?? undefined };
      const low = finite(min, 0);
      const high = finite(max, 100) > low ? finite(max, 100) : low + 1;
      const places = decimalsOf(stat);
      return {
        label,
        value: finite(value, 0),
        min: low,
        max: high,
        prefix,
        unit,
        fraction: clamp((finite(value, 0) - low) / (high - low), 0, 1),
        format: formatter(places),
      };
    });
  }, [statsKey]);

  const fractions = useMemo(
    () => Array.from({ length: count }, (_, index) => (geometry.closed ? index / count : index / (count - 1))),
    [count, geometry.closed],
  );

  useEffect(() => {
    settingsRef.current = { duration, bounce, motion, live, liveAmount, trail, stagger };
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const doc = root.ownerDocument;
    const viewport = doc.defaultView ?? window;
    if (theme !== "auto") return;
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

  const paint = useCallback(() => {
    const { motion: mode, trail: fade } = settingsRef.current;
    const step = geometry.closed ? 1 / count : 1 / (count - 1);
    list.forEach((dial, index) => {
      const state = statesRef.current[index];
      if (!state) return;
      const shown = mode === "tick" ? Math.round(state.x / step) * step : state.x;
      const lit = clamp(shown, 0, 1);
      const lines = tickRefs.current[index] ?? [];
      const depth = clamp(finite(fade, 0.55), 0, 1);
      for (let k = 0; k < lines.length; k += 1) {
        const line = lines[k];
        if (!line) continue;
        const f = fractions[k];
        const on = clamp((lit - f) / step + 1, 0, 1);
        const ramp = lit > 0 ? 1 - depth * (1 - clamp(f / lit, 0, 1)) : 1;
        line.style.opacity = (on * ramp).toFixed(3);
      }
      const handle = handRefs.current[index];
      if (handle) {
        const angle = geometry.start + geometry.sweep * clamp(shown, -0.02, 1.02);
        handle.setAttribute("transform", `rotate(${angle.toFixed(3)} ${geometry.cx} ${geometry.cy})`);
      }
      const text = valueRefs.current[index];
      if (text) {
        const amount = dial.min + (dial.max - dial.min) * clamp(state.y, 0, 1);
        const settled = Math.abs(state.y - state.target) < 1e-6 && !settingsRef.current.live;
        text.textContent = dial.format.format(settled && Math.abs(state.target - dial.fraction) < 1e-6 ? dial.value : amount);
      }
    });
  }, [count, fractions, geometry, list]);

  useEffect(() => {
    statesRef.current = list.map((dial, index) => {
      const previous = statesRef.current[index];
      return {
        x: reduced ? dial.fraction : previous?.x ?? 0,
        v: 0,
        y: reduced ? dial.fraction : previous?.y ?? 0,
        from: previous?.y ?? 0,
        since: -1,
        lastAim: previous?.lastAim ?? 0,
        target: reduced || armed ? dial.fraction : 0,
        base: dial.fraction,
        armedAt: previous?.armedAt ?? -1,
        phase: index * 1.7 + 0.4,
      };
    });
    paint();
    wakeRef.current();
  }, [armed, list, paint, reduced]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(() => setAvail(root.clientWidth));
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [reduced]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    const doc = root.ownerDocument;
    const viewport = doc.defaultView ?? window;
    let ticking = false;
    let raf = 0;
    let last = 0;
    let visible = true;
    const tick = (time: number) => {
      raf = 0;
      ticking = true;
      const dt = Math.min(0.05, last ? (time - last) / 1000 : 1 / 60);
      last = time;
      clockRef.current += dt;
      const clock = clockRef.current;
      const { duration: settle, bounce: spring, live: drifting, liveAmount: amount, stagger: delay } = settingsRef.current;
      const zeta = clamp(1 - finite(spring, 0.3), 0.18, 1);
      const omega = 4 / (zeta * clamp(finite(settle, 1600) / 1000, 0.2, 8));
      let moving = false;
      statesRef.current.forEach((state, index) => {
        if (armed && state.armedAt < 0) state.armedAt = clock + (index * Math.max(0, finite(delay, 140))) / 1000;
        const ready = armed && clock >= state.armedAt;
        let goal = ready ? state.target : 0;
        if (ready && drifting) {
          const swing = clamp(finite(amount, 0.02), 0, 0.3);
          goal = clamp(goal + swing * (0.62 * Math.sin(clock * 0.9 + state.phase) + 0.38 * Math.sin(clock * 2.3 + state.phase * 2.1)), 0, 1);
        }
        let remaining = dt;
        while (remaining > 0) {
          const h = Math.min(remaining, 1 / 240);
          const acceleration = -omega * omega * (state.x - goal) - 2 * zeta * omega * state.v;
          state.v += acceleration * h;
          state.x += state.v * h;
          remaining -= h;
        }
        const aim = ready ? state.target : 0;
        if (Math.abs(aim - state.lastAim) > 1e-6) {
          state.from = state.y;
          state.since = clock;
          state.lastAim = aim;
        }
        if (drifting && ready) state.y = state.x;
        else {
          const span = clamp(finite(settle, 1600) / 1000, 0.2, 8) * 0.8;
          const t = state.since < 0 ? 1 : clamp((clock - state.since) / span, 0, 1);
          state.y = state.from + (aim - state.from) * (1 - Math.pow(1 - t, 3));
          if (t < 1) moving = true;
        }
        if (Math.abs(state.x - goal) > 0.0002 || Math.abs(state.v) > 0.0005 || (armed && !ready)) moving = true;
      });
      paint();
      ticking = false;
      if ((moving || drifting) && visible && !doc.hidden) raf = viewport.requestAnimationFrame(tick);
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
    wake();
    return () => {
      wakeRef.current = () => {};
      observer.disconnect();
      doc.removeEventListener("visibilitychange", onVisibility);
      viewport.cancelAnimationFrame(raf);
    };
  }, [armed, paint, reduced]);

  useEffect(() => {
    wakeRef.current();
  }, [live, liveAmount, duration, bounce, motion, trail]);

  const replay = useCallback(
    (index?: number) => {
      if (reduced) return;
      statesRef.current.forEach((state, k) => {
        if (index !== undefined && k !== index) return;
        state.target = 0;
        state.v -= 0.4;
      });
      wakeRef.current();
      const root = rootRef.current;
      const viewport = root?.ownerDocument.defaultView ?? window;
      viewport.setTimeout(() => {
        statesRef.current.forEach((state, k) => {
          if (index !== undefined && k !== index) return;
          state.target = state.base;
        });
        wakeRef.current();
      }, 380);
    },
    [reduced],
  );

  useImperativeHandle(ref, () => ({ replay: () => replay() }), [replay]);

  const palette = makePalette(dark, accentColor, trackColor, textColor);
  const width = clamp(finite(size, 240), 96, 640);
  const spacing = clamp(finite(gap, 32), 0, 160);
  const columns = avail > 0 ? Math.min(list.length, Math.max(1, Math.floor((avail + spacing) / (width * 0.62 + spacing)))) : list.length;
  const item = avail > 0 ? Math.min(width, (avail - (columns - 1) * spacing) / columns) : width;
  const minor = 6;
  const long = 11;
  const inner = OUTER - long;
  const pad = numerals ? 18 : 0;
  const scale = item / (geometry.width + pad * 2);
  const labelSize = Math.max(10.5, 11.5 / scale);
  const numeralSize = Math.max(7.5, 8.5 / scale);
  const valueSize = Math.max(geometry.valueSize, 22 / scale);

  return (
    <div
      ref={rootRef}
      className={cn("relative flex w-full flex-wrap items-start justify-center", className)}
      style={{ gap: spacing, color: palette.text, fontFamily: SANS, ...style }}
    >
      {list.map((dial, index) => {
        const total = `${dial.prefix}${dial.format.format(dial.value)}${dial.unit}`;
        const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
          if (!replayOnClick) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            replay(index);
          }
        };
        return (
          <div
            key={`${dial.label}-${index}`}
            role={replayOnClick ? "button" : "img"}
            tabIndex={replayOnClick ? 0 : undefined}
            aria-label={`${dial.label}: ${total}`}
            onClick={replayOnClick ? () => replay(index) : undefined}
            onKeyDown={onKey}
            style={{
              flex: "none",
              width: item,
              minWidth: 0,
              cursor: replayOnClick ? "pointer" : undefined,
              outlineOffset: 4,
              borderRadius: 12,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <svg
              viewBox={`${-pad} ${-pad} ${geometry.width + pad * 2} ${geometry.height + pad}`}
              width="100%"
              style={{ display: "block", overflow: "visible" }}
              aria-hidden="true"
            >
              {variant === "chrono" ? (
                <circle cx={geometry.cx} cy={geometry.cy} r={inner - 9} fill="none" stroke={palette.track} strokeWidth={0.75} />
              ) : null}
              <g>
                {fractions.map((f, k) => {
                  const isMajor = k % major === 0;
                  const angle = geometry.start + geometry.sweep * f;
                  const [x1, y1] = point(geometry, angle, OUTER - (isMajor ? long : minor));
                  const [x2, y2] = point(geometry, angle, OUTER);
                  return (
                    <line
                      key={k}
                      x1={x1.toFixed(2)}
                      y1={y1.toFixed(2)}
                      x2={x2.toFixed(2)}
                      y2={y2.toFixed(2)}
                      stroke={palette.track}
                      strokeWidth={isMajor ? 1.6 : 1.1}
                      strokeLinecap="round"
                      style={{
                        opacity: armed ? 1 : 0,
                        transition: reduced ? "none" : `opacity 420ms ease ${Math.round(f * 360)}ms`,
                      }}
                    />
                  );
                })}
              </g>
              <g>
                {fractions.map((f, k) => {
                  const isMajor = k % major === 0;
                  const angle = geometry.start + geometry.sweep * f;
                  const [x1, y1] = point(geometry, angle, OUTER - (isMajor ? long : minor));
                  const [x2, y2] = point(geometry, angle, OUTER);
                  return (
                    <line
                      key={k}
                      ref={(element) => {
                        if (!tickRefs.current[index]) tickRefs.current[index] = [];
                        tickRefs.current[index][k] = element;
                      }}
                      x1={x1.toFixed(2)}
                      y1={y1.toFixed(2)}
                      x2={x2.toFixed(2)}
                      y2={y2.toFixed(2)}
                      stroke={palette.accent}
                      strokeWidth={isMajor ? 1.8 : 1.4}
                      strokeLinecap="round"
                      style={{ opacity: 0 }}
                    />
                  );
                })}
              </g>
              {numerals
                ? fractions.map((f, k) => {
                    if (k % major !== 0) return null;
                    const angle = geometry.start + geometry.sweep * f;
                    const side = Math.sin((angle * Math.PI) / 180);
                    const [x, y] = point(geometry, angle, OUTER + 8);
                    return (
                      <text
                        key={`n${k}`}
                        x={x.toFixed(2)}
                        y={(y + numeralSize * 0.34).toFixed(2)}
                        textAnchor={side > 0.5 ? "start" : side < -0.5 ? "end" : "middle"}
                        fontSize={numeralSize}
                        fontWeight={500}
                        fill={palette.muted}
                        style={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {scaleLabel(dial.min + (dial.max - dial.min) * f)}
                      </text>
                    );
                  })
                : null}
              {hand ? (
                <g
                  ref={(element) => {
                    handRefs.current[index] = element;
                  }}
                  transform={`rotate(${geometry.start} ${geometry.cx} ${geometry.cy})`}
                >
                  <line
                    x1={geometry.cx}
                    y1={geometry.cy - (inner - 15)}
                    x2={geometry.cx}
                    y2={geometry.cy - (OUTER + (numerals ? 1 : 4))}
                    stroke={palette.text}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </g>
              ) : null}
              <text
                x={geometry.cx}
                y={geometry.valueY}
                textAnchor="middle"
                fill={palette.text}
                fontSize={valueSize}
                fontWeight={600}
                letterSpacing="-0.02em"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {dial.prefix ? (
                  <tspan fontSize={valueSize * 0.62} fill={palette.muted} dx={0}>
                    {dial.prefix}
                  </tspan>
                ) : null}
                <tspan
                  ref={(element) => {
                    valueRefs.current[index] = element;
                  }}
                >
                  {dial.format.format(reduced ? dial.value : dial.min)}
                </tspan>
                {dial.unit ? (
                  <tspan fontSize={valueSize * 0.46} fontWeight={500} fill={palette.muted} dx={2}>
                    {dial.unit}
                  </tspan>
                ) : null}
              </text>
              <text x={geometry.cx} y={geometry.labelY} textAnchor="middle" fill={palette.muted} fontSize={labelSize} fontWeight={500}>
                {dial.label}
              </text>
            </svg>
          </div>
        );
      })}
    </div>
  );
});

InstrumentDial.displayName = "InstrumentDial";

export { InstrumentDial };
export default InstrumentDial;
