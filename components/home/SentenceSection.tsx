"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import { CARDS, RealityCard } from "./RealityCards";
import "@/app/sentence.css";

/**
 * The first stretch of the sheet that rises over the client map: one centred sentence, after the editorial contents
 * pages it was briefed from, held on screen while 03 · The Reality's cards stack over it.
 *
 * 1. The sentence arrives as type alone; one scroll later the words slide apart and a square still opens in each gap
 *    (one of each client's own hero), on the text's baseline, one cap height tall. The gaps fall irregularly on purpose.
 * 2. The sentence then holds still (pinned) while the cards rise from below, one at a time, and settle over it in a
 *    loose stack, each at its own angle. After the last one the whole stage scrolls on.
 *
 * Pinned by hand, like components/home/RealityPanels.tsx: the sheet (.cover) is transformed, so `sticky` has no
 * viewport to hold against; the stage is translated by exactly how far its track has scrolled past. The sheet moves
 * by transform too, so "one scroll" for the sentence is measured from the page scroll at which the engine marks the
 * sheet fully up (#stick.covered).
 */
const STEP = 60;   // px of page scroll past the sheet arriving that opens the pictures (one wheel notch is ~100)

// three fixed lines on desktop, so opening the gaps spreads each line from its centre instead of re-wrapping it;
// "@name" puts that client's picture there
const LINES: string[][] = [
  ["Your", "business", "is", "@aria", "built", "to"],
  ["@kidicare", "go", "further.", "Your", "digital"],
  ["infrastructure", "@esther", "should", "be", "@cleverpays", "too."],
];

// each card's resting place in the stack: angle (deg) and a small offset (px), never in a repeating pattern
const REST = [[-2.5, -10, 6], [3.2, 14, -4], [-1.2, -4, 10], [2, 8, 0]];   // [deg, x px, y px]
// track layout, in screens: a lead for the sentence to open, then one step per card, then a short hold
const LEAD = 0.7, PER = 0.8, HOLD = 0.4;

function Pic({ src }: { src: string }) {
  return (
    <span className="sx-slot" aria-hidden="true">
      <img src={`/sentence/${src}.webp`} alt="" loading="lazy" decoding="async" />
    </span>
  );
}

const easeOut = (x: number) => 1 - (1 - x) ** 3;

export default function SentenceSection() {
  const [open, setOpen] = useState(false);
  const at = useRef<number | null>(null);   // page scroll at which the sheet was first fully up
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const stack = useRef<HTMLDivElement>(null);

  // the sentence's one-scroll opening
  useEffect(() => {
    const stick = document.getElementById("stick");
    if (!stick) return;
    const check = () => {
      if (!stick.classList.contains("covered")) { at.current = null; setOpen(false); return; }
      if (at.current === null) at.current = scrollY;
      // arriving with no scroll left to give (a reload part-way down, a jump link): open straight away
      const room = document.documentElement.scrollHeight - innerHeight - at.current;
      setOpen(room < STEP || scrollY > at.current + STEP);
    };
    check();
    addEventListener("scroll", check, { passive: true });
    // the engine sets .covered on its own frame, not always on a scroll event
    const watch = new MutationObserver(check);
    watch.observe(stick, { attributes: true, attributeFilter: ["class"] });
    return () => { removeEventListener("scroll", check); watch.disconnect(); };
  }, []);

  // the pin and the cards. Re-measured every frame, not on scroll: the engine moves the sheet from its own handler,
  // so a rect read during `scroll` can be a step behind (the reason RealityPanels does the same).
  useEffect(() => {
    const el = track.current, st = stage.current;
    if (!el || !st) return;
    let raf = 0;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -400 || r.top > innerHeight + 400) return;
      const H = innerHeight;
      const past = Math.min(Math.max(0, r.height - H), Math.max(0, -r.top));
      st.style.setProperty("--pin", `${past}px`);
      const s = past / H;   // screens scrolled into the track
      stack.current?.querySelectorAll<HTMLElement>(".rc").forEach((c, k) => {
        const t = Math.min(1, Math.max(0, (s - LEAD - k * PER) / PER));
        const e = easeOut(t);
        const [rot, x, y] = REST[k % REST.length];
        // from just below the screen, a little more turned, to its resting place in the stack
        c.style.transform = `translate3d(${x}px, ${((1 - e) * H * 1.05 + y).toFixed(1)}px, 0) rotate(${(rot * (1 + (1 - e) * 1.6)).toFixed(2)}deg)`;
        c.style.visibility = t > 0 ? "visible" : "hidden";
        // the lenticular foil sweeps across the card as it rises
        const tc = c.firstElementChild as HTMLElement | null;
        if (tc) { tc.style.setProperty("--mx", `${(15 + 70 * e).toFixed(1)}%`); tc.style.setProperty("--my", `${(85 - 60 * e).toFixed(1)}%`); }
      });
    };
    const frame = () => { measure(); raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const trackH = `calc(100svh + ${((LEAD + CARDS.length * PER + HOLD) * 100).toFixed(0)}svh)`;

  return (
    <section id="further" className={`section sx${open ? " is-open" : ""}`} aria-label="Your digital infrastructure">
      <div className="sx-track" ref={track} style={{ height: trackH } as CSSProperties}>
        <div className="sx-stage" ref={stage}>
          <div className="wrap">
            <h2 className="h2 sx-h">
              {LINES.map((line, l) => (
                <span className="sx-line" key={l}>
                  {line.map((w, i) => (
                    <Fragment key={i}>
                      {/* a picture brings its own trailing space, so the closed sentence keeps single spaces */}
                      {i > 0 && !line[i - 1].startsWith("@") && " "}
                      {w.startsWith("@") ? <Pic src={w.slice(1)} /> : w}
                    </Fragment>
                  ))}
                  {l < LINES.length - 1 && " "}
                </span>
              ))}
            </h2>
          </div>
          {/* 03 · The Reality: the cards, over the sentence */}
          <div className="rc-stack" ref={stack} id="reality">
            {CARDS.map((c, k) => <RealityCard key={c.key} c={c} n={k} of={CARDS.length - 1} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
