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
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export interface BrowserPage {
  url: string;
  title?: string;
  src?: string;
  alt?: string;
  content?: ReactNode;
}

export interface BrowserWindowHandle {
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  reload: () => void;
  play: () => void;
  pause: () => void;
}

export interface BrowserWindowProps {
  pages?: BrowserPage[];
  url?: string;
  children?: ReactNode;
  chrome?: "compact" | "tabs";
  frame?: "solid" | "inset";
  dots?: "mono" | "color";
  theme?: "auto" | "light" | "dark";
  accentColor?: string;
  windowColor?: string;
  textColor?: string;
  radius?: number;
  aspect?: number;
  height?: number;
  fit?: "cover" | "contain";
  transition?: "blur" | "slide" | "fade";
  interval?: number;
  autoplay?: boolean;
  loop?: boolean;
  pauseOnHover?: boolean;
  typing?: boolean;
  loader?: boolean;
  scroll?: boolean;
  controls?: boolean;
  defaultPage?: number;
  onPageChange?: (index: number) => void;
  className?: string;
  style?: CSSProperties;
}

interface Palette {
  surface: string;
  frame: string;
  shadow: string;
  frameShadow: string;
  panel: string;
  bar: string;
  text: string;
  muted: string;
  dim: string;
  accent: string;
  field: string;
  hover: string;
  dot: string;
  divide: string;
}

interface Layer {
  key: number;
  index: number;
}

const SANS = 'var(--font-sans, ui-sans-serif), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

const DEFAULT_PAGES: BrowserPage[] = [
  { url: "atelier.studio", title: "Atelier", src: "https://pro.reactbits.dev/demo-media/architecture-pool.webp", alt: "Figure in black crossing a shallow pool before a tall cream wall" },
  {
    url: "atelier.studio/projects",
    title: "Projects",
    src: "https://pro.reactbits.dev/demo-media/architecture-ribbons.webp",
    alt: "White facade ribbons flowing in parallel waves",
  },
  {
    url: "atelier.studio/journal",
    title: "Journal",
    src: "https://pro.reactbits.dev/demo-media/architecture-drum.webp",
    alt: "Rounded white concrete drum against a bright blue sky",
  },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const finite = (value: number | undefined, fallback: number) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);

const splitUrl = (url: string) => {
  const clean = url.replace(/^https?:\/\//, "");
  const cut = clean.indexOf("/");
  return cut < 0 ? { host: clean, path: "" } : { host: clean.slice(0, cut), path: clean.slice(cut) };
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

const makePalette = (dark: boolean, accent?: string, surface?: string, text?: string): Palette =>
  dark
    ? {
        surface: surface || "#111113",
        frame: `color-mix(in srgb, ${surface || "#111113"} 94%, #ffffff)`,
        shadow: "0 0 0 1px rgba(255,255,255,0.07), 0 24px 60px -16px rgba(0,0,0,0.65)",
        frameShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 24px 60px -16px rgba(0,0,0,0.65)",
        panel: "inset 0 0 0 1px rgba(255,255,255,0.06)",
        bar: "rgba(255,255,255,0.025)",
        text: text || "#E7E7EA",
        muted: "#8C8C95",
        dim: "#5D5D66",
        accent: accent || "#A99BFF",
        field: "rgba(255,255,255,0.06)",
        hover: "rgba(255,255,255,0.07)",
        dot: "rgba(255,255,255,0.14)",
        divide: "rgba(255,255,255,0.06)",
      }
    : {
        surface: surface || "#FFFFFF",
        frame: `color-mix(in srgb, ${surface || "#FFFFFF"} 96%, #000000)`,
        shadow: "0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04), 0 16px 40px -14px rgba(0,0,0,0.16)",
        frameShadow: "0 0 0 1px rgba(0,0,0,0.05), 0 16px 40px -14px rgba(0,0,0,0.14)",
        panel: "inset 0 0 0 1px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        bar: "rgba(0,0,0,0.022)",
        text: text || "#18181B",
        muted: "#71717A",
        dim: "#A1A1AA",
        accent: accent || "#5227FF",
        field: "rgba(0,0,0,0.045)",
        hover: "rgba(0,0,0,0.05)",
        dot: "rgba(0,0,0,0.12)",
        divide: "rgba(0,0,0,0.06)",
      };

const Icon = ({ name }: { name: "back" | "forward" | "reload" | "lock" }) => {
  if (name === "lock")
    return (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
        <path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3" />
      </svg>
    );
  if (name === "reload")
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 11.5A8 8 0 1 0 17.66 17.3" />
        <path d="M20 5v6.5h-6.5" />
      </svg>
    );
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={name === "back" ? "M15 5.5 8.5 12l6.5 6.5" : "M9 5.5l6.5 6.5L9 18.5"} />
    </svg>
  );
};

const BrowserWindow = forwardRef<BrowserWindowHandle, BrowserWindowProps>(function BrowserWindow(
  {
    pages = DEFAULT_PAGES,
    url,
    children,
    chrome = "compact",
    frame = "inset",
    dots = "mono",
    theme = "auto",
    accentColor,
    windowColor,
    textColor,
    radius = 16,
    aspect = 1.6,
    height,
    fit = "cover",
    transition = "blur",
    interval = 4600,
    autoplay = true,
    loop = true,
    pauseOnHover = true,
    typing = true,
    loader = true,
    scroll = true,
    controls = true,
    defaultPage = 0,
    onPageChange,
    className,
    style,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const timersRef = useRef<number[]>([]);
  const tokenRef = useRef(0);
  const keyRef = useRef(1);
  const pageRef = useRef(0);
  const busyRef = useRef(false);
  const hoverRef = useRef(false);
  const elapsedRef = useRef(0);
  const changeRef = useRef(onPageChange);
  const reduced = useSyncExternalStore(subscribeToMotion, readMotion, () => false);
  const single = children !== undefined && children !== null;
  const list = single ? [{ url: url ?? "localhost:3000", title: "", content: children } as BrowserPage] : pages.length ? pages : DEFAULT_PAGES;
  const count = list.length;
  const start = clamp(Math.round(finite(defaultPage, 0)), 0, count - 1);
  const [layers, setLayers] = useState<Layer[]>([{ key: 0, index: start }]);
  const [active, setActive] = useState(start);
  const [typed, setTyped] = useState(list[start]?.url ?? "");
  const [caret, setCaret] = useState(false);
  const [progress, setProgress] = useState({ value: 0, visible: false, speed: 0 });
  const [dark, setDark] = useState(theme === "dark");
  const [playing, setPlaying] = useState(autoplay);
  const [width, setWidth] = useState(0);
  const listRef = useRef(list);

  useEffect(() => {
    changeRef.current = onPageChange;
    listRef.current = list;
  });

  useEffect(() => {
    setPlaying(autoplay);
  }, [autoplay]);

  const later = useCallback((callback: () => void, wait: number) => {
    const view = rootRef.current?.ownerDocument.defaultView ?? window;
    const handle = view.setTimeout(() => {
      timersRef.current = timersRef.current.filter((item) => item !== handle);
      callback();
    }, wait);
    timersRef.current.push(handle);
  }, []);

  const clearTimers = useCallback(() => {
    const view = rootRef.current?.ownerDocument.defaultView ?? window;
    timersRef.current.forEach((handle) => view.clearTimeout(handle));
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const update = () => setWidth(root.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const doc = root.ownerDocument;
    const view = doc.defaultView ?? window;
    if (theme !== "auto") {
      setDark(theme === "dark");
      return;
    }
    const probe = doc.createElement("canvas").getContext("2d", { willReadFrequently: true });
    const measure = () => {
      setDark(readBackdrop(root, probe).dark);
    };
    const frames: number[] = [];
    const timers: number[] = [];
    const schedule = () => {
      frames.push(view.requestAnimationFrame(measure));
      timers.push(view.setTimeout(measure, 380));
    };
    schedule();
    timers.push(view.setTimeout(measure, 1200));
    const observer = new MutationObserver(schedule);
    const watch = (target: Document) => {
      observer.observe(target.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
      if (target.body) observer.observe(target.body, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    };
    watch(doc);
    let outer: Element | null = null;
    try {
      outer = view.frameElement;
    } catch {
      outer = null;
    }
    if (outer) watch(outer.ownerDocument);
    return () => {
      observer.disconnect();
      frames.forEach((id) => view.cancelAnimationFrame(id));
      timers.forEach((id) => view.clearTimeout(id));
    };
  }, [theme]);

  const swap = useCallback(
    (index: number, token: number) => {
      if (token !== tokenRef.current) return;
      const key = keyRef.current++;
      pageRef.current = index;
      setActive(index);
      setLayers((current) => [...current.slice(-1), { key, index }]);
      changeRef.current?.(index);
      const settle = reduced ? 0 : 700;
      later(() => {
        if (token !== tokenRef.current) return;
        setLayers((current) => current.filter((layer) => layer.key === key));
        busyRef.current = false;
      }, settle + 40);
    },
    [later, reduced],
  );

  const navigate = useCallback(
    (target: number, replay = false) => {
      const pagesNow = listRef.current;
      const total = pagesNow.length;
      if (!total) return;
      const index = ((Math.round(target) % total) + total) % total;
      if (index === pageRef.current && !replay) return;
      clearTimers();
      tokenRef.current += 1;
      const token = tokenRef.current;
      busyRef.current = true;
      elapsedRef.current = 0;
      const from = pagesNow[pageRef.current]?.url ?? "";
      const to = pagesNow[index]?.url ?? "";
      if (reduced) {
        setTyped(to);
        setProgress({ value: 0, visible: false, speed: 0 });
        swap(index, token);
        return;
      }
      let shared = 0;
      while (shared < from.length && shared < to.length && from[shared] === to[shared]) shared++;
      const erase = typing && !replay ? from.length - shared : 0;
      const write = typing && !replay ? to.length - shared : 0;
      let wait = 0;
      if (erase + write > 0) {
        setCaret(true);
        for (let k = 1; k <= erase; k++) {
          const text = from.slice(0, from.length - k);
          later(() => {
            if (token === tokenRef.current) setTyped(text);
          }, (wait += 22));
        }
        wait += erase ? 90 : 0;
        for (let k = 1; k <= write; k++) {
          const text = to.slice(0, shared + k);
          later(() => {
            if (token === tokenRef.current) setTyped(text);
          }, (wait += 34 + (to[shared + k - 1] === "/" ? 40 : 0)));
        }
        wait += 120;
        later(() => {
          if (token === tokenRef.current) setCaret(false);
        }, wait);
      } else {
        setTyped(to);
      }
      const show = loader;
      if (show) {
        later(() => {
          if (token === tokenRef.current) setProgress({ value: 0, visible: true, speed: 0 });
        }, wait);
        later(() => {
          if (token === tokenRef.current) setProgress({ value: 0.72, visible: true, speed: 520 });
        }, wait + 30);
      }
      later(() => swap(index, token), wait + (show ? 560 : 120));
      if (show) {
        later(() => {
          if (token === tokenRef.current) setProgress({ value: 1, visible: true, speed: 260 });
        }, wait + 600);
        later(() => {
          if (token === tokenRef.current) setProgress((current) => ({ ...current, visible: false }));
        }, wait + 900);
      }
    },
    [clearTimers, later, loader, reduced, swap, typing],
  );

  const advance = useCallback(() => {
    const total = listRef.current.length;
    if (!loop && pageRef.current >= total - 1) {
      setPlaying(false);
      return;
    }
    navigate(pageRef.current + 1);
  }, [loop, navigate]);

  const running = playing && count > 1 && !reduced && !single;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !running) return;
    const doc = root.ownerDocument;
    const view = doc.defaultView ?? window;
    const wait = Math.max(1800, finite(interval, 4600));
    let raf = 0;
    let last = 0;
    let visible = false;
    const tick = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(64, now - last) : 0;
      last = now;
      if (!busyRef.current && !(pauseOnHover && hoverRef.current)) elapsedRef.current += dt;
      if (elapsedRef.current >= wait) {
        elapsedRef.current = 0;
        advance();
      }
      if (visible && !doc.hidden) raf = view.requestAnimationFrame(tick);
    };
    const wake = () => {
      if (raf || !visible || doc.hidden) return;
      last = 0;
      raf = view.requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible) wake();
      },
      { threshold: 0.2 },
    );
    observer.observe(root);
    const onVisibility = () => wake();
    doc.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      doc.removeEventListener("visibilitychange", onVisibility);
      view.cancelAnimationFrame(raf);
    };
  }, [advance, interval, pauseOnHover, running]);

  useImperativeHandle(
    ref,
    () => ({
      next: () => navigate(pageRef.current + 1),
      prev: () => navigate(pageRef.current - 1),
      goTo: (index: number) => navigate(index),
      reload: () => navigate(pageRef.current, true),
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
    }),
    [navigate],
  );

  const enter = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || node.dataset.played) return;
      node.dataset.played = "1";
      if (reduced || node.dataset.initial || typeof node.animate !== "function") return;
      const frames: Keyframe[] =
        transition === "slide"
          ? [
              { opacity: 0, transform: "translateX(5%)" },
              { opacity: 1, transform: "translateX(0)" },
            ]
          : transition === "fade"
            ? [{ opacity: 0 }, { opacity: 1 }]
            : [
                { opacity: 0, filter: "blur(14px)", transform: "scale(1.02)" },
                { opacity: 1, filter: "blur(0px)", transform: "scale(1)" },
              ];
      node.animate(frames, { duration: 680, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    },
    [reduced, transition],
  );

  const pan = useCallback(
    (image: HTMLImageElement | null) => {
      if (!image) return;
      const run = () => {
        const viewport = viewportRef.current;
        if (!viewport || !scroll || reduced || typeof image.animate !== "function" || !image.naturalWidth) return;
        const rendered = viewport.clientWidth * (image.naturalHeight / image.naturalWidth);
        const travel = rendered - viewport.clientHeight;
        if (travel < 4) return;
        image.getAnimations().forEach((animation) => animation.cancel());
        const wait = Math.max(1800, finite(interval, 4600));
        image.animate(
          [
            { transform: "translateY(0px)", offset: 0 },
            { transform: "translateY(0px)", offset: 0.12 },
            { transform: `translateY(${-travel}px)`, offset: 0.92 },
            { transform: `translateY(${-travel}px)`, offset: 1 },
          ],
          { duration: wait + 1400, easing: "ease-in-out", fill: "forwards" },
        );
      };
      if (image.complete) run();
      else image.addEventListener("load", run, { once: true });
    },
    [interval, reduced, scroll],
  );

  const onTabKey = (event: ReactKeyboardEvent, index: number) => {
    let target = -1;
    if (event.key === "ArrowRight") target = (index + 1) % count;
    else if (event.key === "ArrowLeft") target = (index - 1 + count) % count;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = count - 1;
    if (target < 0) return;
    event.preventDefault();
    tabRefs.current[target]?.focus();
    navigate(target);
  };

  const palette = makePalette(dark, accentColor, windowColor, textColor);
  const corner = clamp(finite(radius, 14), 0, 40);
  const inset = frame === "inset";
  const gap = 4;
  const inner = Math.max(0, corner - gap);
  const narrow = width > 0 && width < 420;
  const showNav = controls && !single && count > 1 && !narrow;
  // Local patch: in single-child mode there is nothing to navigate, so the `url` prop is the address. Deriving it
  // here (rather than from the typed state, which is only seeded once) lets a caller change the address in place —
  // e.g. the same window showing a site before and after a rebuild. Re-apply if this component is re-added.
  const parts = splitUrl(single && url ? url : typed);
  const ratio = clamp(finite(aspect, 1.6), 0.4, 4);
  const toolbar = 44;

  const button = (label: string, icon: "back" | "forward" | "reload", onClick: () => void, disabled = false) => (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={(event) => {
        if (!disabled) event.currentTarget.style.background = palette.hover;
      }}
      onMouseLeave={(event) => (event.currentTarget.style.background = "transparent")}
      style={{
        boxSizing: "border-box",
        width: 28,
        height: 28,
        padding: 0,
        display: "grid",
        placeItems: "center",
        flex: "none",
        border: 0,
        borderRadius: 7,
        background: "transparent",
        color: palette.muted,
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "default" : "pointer",
        transition: "background-color 160ms ease, opacity 160ms ease",
      }}
    >
      <Icon name={icon} />
    </button>
  );

  const centered = chrome === "compact" && !narrow;
  const address = (
    <div
      style={{
        position: centered ? "absolute" : "relative",
        left: centered ? "50%" : undefined,
        transform: centered ? "translateX(-50%)" : undefined,
        width: centered ? "min(440px, 52%)" : undefined,
        flex: centered ? undefined : "1 1 auto",
        minWidth: 0,
        boxSizing: "border-box",
        height: 28,
        display: "flex",
        alignItems: "center",
        justifyContent: chrome === "compact" ? "center" : "flex-start",
        gap: 6,
        padding: "0 12px",
        borderRadius: 8,
        background: palette.field,
        fontFamily: SANS,
        fontSize: 12.5,
        fontWeight: 500,
        letterSpacing: "0.005em",
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      <span style={{ color: palette.muted, display: "flex", flex: "none" }}>
        <Icon name="lock" />
      </span>
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
        <span style={{ color: palette.text }}>{parts.host}</span>
        <span style={{ color: palette.muted }}>{parts.path}</span>
        {caret ? (
          <span
            aria-hidden="true"
            style={{ display: "inline-block", width: 1.5, height: "1.05em", marginLeft: 1, verticalAlign: "text-bottom", background: palette.accent }}
          />
        ) : null}
      </span>
    </div>
  );

  const windowDots = (
    <div aria-hidden="true" style={{ display: "flex", gap: 7, flex: "none" }}>
      {(dots === "color" ? ["#FF5F57", "#FEBC2E", "#28C840"] : [palette.dot, palette.dot, palette.dot]).map((color, index) => (
        <span key={index} style={{ width: 11, height: 11, borderRadius: 999, background: color }} />
      ))}
    </div>
  );

  const bar = (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 2,
        pointerEvents: "none",
        opacity: progress.visible ? 1 : 0,
        transition: "opacity 260ms ease",
      }}
    >
      <div
        style={{
          height: "100%",
          background: palette.accent,
          transformOrigin: "0 50%",
          transform: `scaleX(${progress.value})`,
          transition: progress.speed ? `transform ${progress.speed}ms cubic-bezier(0.22, 1, 0.36, 1)` : "none",
          borderRadius: 2,
        }}
      />
    </div>
  );

  const header =
    chrome === "compact" ? (
      <div
        style={{
          position: "relative",
          flex: "none",
          height: toolbar,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: inset ? "0 9px 0 13px" : "0 10px 0 14px",
          background: inset ? "transparent" : palette.bar,
          boxShadow: inset ? undefined : `inset 0 -1px 0 ${palette.divide}`,
        }}
      >
        {windowDots}
        {showNav ? (
          <div style={{ display: "flex", gap: 2, marginLeft: 4 }}>
            {button("Back", "back", () => navigate(pageRef.current - 1), !loop && active === 0)}
            {button("Forward", "forward", () => navigate(pageRef.current + 1), !loop && active === count - 1)}
          </div>
        ) : null}
        {address}
        {centered ? <div style={{ flex: "1 1 auto" }} /> : null}
        {controls && !narrow ? button("Reload", "reload", () => navigate(pageRef.current, true)) : null}
        {loader ? bar : null}
      </div>
    ) : (
      <div style={{ flex: "none", background: inset ? "transparent" : palette.bar, boxShadow: inset ? undefined : `inset 0 -1px 0 ${palette.divide}` }}>
        <div style={{ height: 40, display: "flex", alignItems: "center", gap: 12, padding: inset ? "0 9px 0 13px" : "0 10px 0 14px" }}>
          {windowDots}
          <div
            role="tablist"
            aria-label="Pages"
            style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0, flex: "1 1 auto", overflowX: "auto", scrollbarWidth: "none" }}
          >
            {list.map((item, index) => {
              const selected = index === active;
              const label = item.title || splitUrl(item.url).host;
              return (
                <button
                  key={index}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => navigate(index)}
                  onKeyDown={(event) => onTabKey(event, index)}
                  style={{
                    flex: "none",
                    boxSizing: "border-box",
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "0 11px 0 8px",
                    border: 0,
                    borderRadius: 8,
                    background: selected ? palette.field : "transparent",
                    color: selected ? palette.text : palette.muted,
                    fontFamily: SANS,
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "background-color 200ms ease, color 200ms ease",
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      display: "grid",
                      placeItems: "center",
                      background: selected ? palette.accent : palette.dot,
                      color: selected ? palette.surface : palette.muted,
                      fontSize: 8.5,
                      fontWeight: 700,
                      transition: "background-color 200ms ease, color 200ms ease",
                    }}
                  >
                    {label.slice(0, 1).toUpperCase()}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ position: "relative", height: 40, display: "flex", alignItems: "center", gap: 4, padding: inset ? "0 9px 6px" : "0 10px 6px" }}>
          {controls ? button("Back", "back", () => navigate(pageRef.current - 1), single || count < 2 || (!loop && active === 0)) : null}
          {controls ? button("Forward", "forward", () => navigate(pageRef.current + 1), single || count < 2 || (!loop && active === count - 1)) : null}
          {controls ? button("Reload", "reload", () => navigate(pageRef.current, true)) : null}
          <div style={{ width: controls ? 4 : 0 }} />
          {address}
          {loader ? bar : null}
        </div>
      </div>
    );

  const renderPage = (index: number) => {
    const item = list[index];
    if (!item) return null;
    if (item.content !== undefined) return <div style={{ position: "absolute", inset: 0, overflow: "auto" }}>{item.content}</div>;
    if (!item.src) return null;
    const tall = fit === "cover" && scroll;
    return (
      <img
        ref={tall ? pan : undefined}
        src={item.src}
        alt={item.alt ?? item.title ?? ""}
        draggable={false}
        style={
          tall
            ? { position: "absolute", left: 0, top: 0, width: "100%", minHeight: "100%", objectFit: "cover", objectPosition: "top", display: "block" }
            : { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit, objectPosition: "top", display: "block" }
        }
      />
    );
  };

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label={`Browser window showing ${list[active]?.url ?? ""}`}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") hoverRef.current = true;
      }}
      onPointerLeave={() => {
        hoverRef.current = false;
      }}
      className={cn("relative isolate flex w-full flex-col overflow-hidden", className)}
      style={{
        borderRadius: corner,
        background: inset ? palette.frame : palette.surface,
        boxShadow: inset ? palette.frameShadow : palette.shadow,
        color: palette.text,
        ...style,
      }}
    >
      {header}
      <div
        ref={viewportRef}
        style={{
          position: "relative",
          flex: "none",
          height: height ? Math.max(80, finite(height, 360)) : undefined,
          aspectRatio: height ? undefined : `${ratio}`,
          margin: inset ? `0 ${gap}px ${gap}px` : 0,
          borderRadius: inset ? inner : 0,
          boxShadow: inset ? palette.panel : undefined,
          background: palette.surface,
          overflow: "hidden",
          isolation: "isolate",
        }}
      >
        {layers.map((layer, position) => (
          <div
            key={layer.key}
            ref={enter}
            data-initial={layer.key === 0 ? "" : undefined}
            style={{ position: "absolute", inset: 0, zIndex: position }}
          >
            {renderPage(layer.index)}
          </div>
        ))}
        {inset ? <div aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: inner, boxShadow: palette.panel, pointerEvents: "none", zIndex: 10 }} /> : null}
      </div>
    </div>
  );
});

BrowserWindow.displayName = "BrowserWindow";

export { BrowserWindow };
export default BrowserWindow;
