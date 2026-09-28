"use client";

import { useEffect, useRef, useState } from "react";
import { CtaButton } from "@/components/style/Cta";

/**
 * "Built for what's next." in Slowly Signature, written like ink on paper: each letter's outline is traced
 * (a stroke drawing along the glyph), one letter after another, and its ink fills in behind the pen.
 * Letters are laid out by measuring the loaded font, so every one can be traced on its own. Plays when it scrolls in.
 */
const TEXT = "Built for what’s next.";

export default function SignatureLine() {
  const box = useRef<HTMLDivElement>(null);
  const [glyphs, setGlyphs] = useState<{ ch: string; x: number }[]>([]);
  const [size, setSize] = useState({ w: 1000, h: 200, fs: 160, family: "cursive" });
  const [play, setPlay] = useState(false);

  // lay the letters out with the real font metrics (after the face has loaded)
  useEffect(() => {
    let dead = false;
    const layout = async () => {
      const el = box.current; if (!el) return;
      const family = getComputedStyle(el).fontFamily;
      const fs = Math.max(64, Math.min(200, el.clientWidth * 0.13));
      await document.fonts.load(`${fs}px ${family}`, TEXT).catch(() => {});
      if (dead) return;
      const ctx = document.createElement("canvas").getContext("2d")!;
      ctx.font = `${fs}px ${family}`;
      let x = 0; const out: { ch: string; x: number }[] = [];
      for (const ch of TEXT) { out.push({ ch, x }); x += ctx.measureText(ch).width; }
      setGlyphs(out); setSize({ w: Math.ceil(x + fs * 0.4), h: Math.ceil(fs * 1.5), fs, family });
    };
    layout();
    const ro = new ResizeObserver(layout); if (box.current) ro.observe(box.current);
    return () => { dead = true; ro.disconnect(); };
  }, []);
  // write it when it comes into view (again each time it re-enters)
  useEffect(() => {
    const el = box.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setPlay(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  let n = 0;   // index among the visible (non-space) letters, for the stagger
  return (
    <section className="sig" aria-label="Built for what’s next.">
      <div ref={box} className={`sig-line${play ? " on" : ""}`}>
        <svg viewBox={`0 0 ${size.w} ${size.h}`} role="img" aria-label={TEXT} style={{ fontFamily: size.family }}>
          {glyphs.map((g, i) => {
            if (g.ch === " ") return null;
            const d = n++;
            return (
              <text key={i} x={g.x + size.fs * 0.2} y={size.fs * 1.08} fontSize={size.fs}
                style={{ ["--d" as string]: `${d * 0.16}s` }}>{g.ch}</text>
            );
          })}
        </svg>
      </div>
      <CtaButton label="Start your route" onClick={() => window.dispatchEvent(new Event("tcg:directions"))}>Start your route</CtaButton>
    </section>
  );
}
