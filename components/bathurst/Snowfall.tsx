"use client";

import { useEffect, useRef } from "react";

/*
  Snow over the front-page cityscape. A 2D canvas laid over the WebGL stage, cut to the rounded window by CSS
  (app/bathurst-map.css, #snow: the neatline's --wt/--wr/--wb/--wl/--wrad). It only runs while the window is open
  (#stick.hero-fade, set by lib/bathurst/engine.ts) and the tab is visible; it never runs with reduced motion.
*/
type Flake = { x: number; y: number; r: number; vy: number; sway: number; phase: number; a: number };

export default function Snowfall() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current, stick = cv?.closest("#stick");
    if (!cv || !stick) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0, raf = 0, last = 0;
    let flakes: Flake[] = [];
    const make = (y?: number): Flake => {
      const depth = Math.random();   // 0 far (small, slow, faint) → 1 near (large, quicker, bright)
      return { x: Math.random() * W, y: y ?? Math.random() * H, r: .8 + depth * 2.4, vy: 18 + depth * 52,
        sway: 6 + depth * 14, phase: Math.random() * Math.PI * 2, a: .45 + depth * .5 };
    };
    const size = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(260, Math.round(W * H / 7000));
      flakes = Array.from({ length: n }, () => make());
    };

    const draw = (ts: number) => {
      const dt = Math.min(.05, (ts - last) / 1000 || 0); last = ts;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      for (const f of flakes) {
        f.y += f.vy * dt; f.phase += dt * .9;
        const x = f.x + Math.sin(f.phase) * f.sway;
        if (f.y - f.r > H) { Object.assign(f, make(-f.r)); continue; }
        ctx.globalAlpha = f.a;
        ctx.beginPath(); ctx.arc(x, f.y, f.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    const on = () => stick.classList.contains("hero-fade") && !document.hidden && !motion.matches;
    const sync = () => {
      if (on()) { if (!raf) { last = 0; raf = requestAnimationFrame(draw); } }
      else { cancelAnimationFrame(raf); raf = 0; ctx.clearRect(0, 0, W, H); }
    };

    const ro = new ResizeObserver(() => { size(); sync(); });
    ro.observe(cv);
    const mo = new MutationObserver(sync);
    mo.observe(stick, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    size(); sync();

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); mo.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
    };
  }, []);

  return <canvas id="snow" ref={ref} aria-hidden="true" />;
}
