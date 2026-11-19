"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import { CARDS, RealityCard, TESTIMONIAL_CARD, REVIEW_ID } from "./RealityCards";
import { AlbumRail, type AlbumRailItem } from "@/components/react-bits/album-rail";
import { TESTIMONIALS } from "@/lib/bathurst/data";
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
// how the stack clears on the last beat: nothing is thrown off screen. Every card still in the stack unwinds to
// the same place as the one that stays — square, centred, no angle — so they read as a deck lined up behind it and
// fade out there. One transform per card per frame, no travel across the viewport for the compositor to repaint.
const ALIGN = 0.45;       // the share of the last beat spent lining up: nothing turns over until it is done
const CLEAR = 1.3;        // how fast a card behind fades once it has lined up — it holds in the deck, then goes
// the sentence goes the same cheap way: the whole block lifts and fades as one layer, rather than each word taking
// its own path. One transform instead of twenty-odd per frame.
const LIFT = 0.62;        // how far up the sentence travels on the last beat, in screens
// 05 · Testimonials' heading is already waiting below the sentence, at full strength and under the cards: it is
// covered by the stack rather than faded in, and rides up into the sentence's place as the sentence clears.
const HEAD_RISE = 0.5;    // how far below its resting place the heading starts, in screens
// track layout, in screens: a lead for the sentence to open, then one step per card, then a short hold, then the
// last beat — the stack clears and the card that stays turns upright in the middle and becomes the review
const LEAD = 0.7, PER = 0.8, HOLD = 0.4, OUTRO = 1.1;

function Pic({ src }: { src: string }) {
  return (
    <span className="sx-slot" aria-hidden="true">
      <img src={`/sentence/${src}.webp`} alt="" loading="lazy" decoding="async" />
    </span>
  );
}

const easeOut = (x: number) => 1 - (1 - x) ** 3;

/* The rest of the reviews, waiting behind the card that turned over: everyone but the client already on it. Their
   own video posters, with who said it under them (lib/bathurst/data.ts — §05 Testimonials plays the clips). */
const RAIL: AlbumRailItem[] = TESTIMONIALS.filter((t) => t.id !== REVIEW_ID).map((t) => ({
  src: t.poster, alt: `${t.who} — ${t.role}`, title: t.who, subtitle: t.role,
}));

export default function SentenceSection() {
  const [open, setOpen] = useState(false);
  const at = useRef<number | null>(null);   // page scroll at which the sheet was first fully up
  const [flipped, setFlipped] = useState(false);   // the last card turns over once it is upright and alone
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const stack = useRef<HTMLDivElement>(null);
  const words = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const turned = useRef(false);
  const rail = useRef<HTMLDivElement>(null);
  const [onRail, setOnRail] = useState(false);   // the rail is only mounted (and WebGL started) near its beat

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
      // the last beat: 0 until the stack is complete and its hold is over, then 0 → 1 across OUTRO
      const o = Math.min(1, Math.max(0, (s - (LEAD + CARDS.length * PER + HOLD)) / OUTRO));
      // the beat runs in two halves. `a` lines the deck up and clears the sentence; only once it is finished does
      // `b` turn the card over and bring the rest of the reviews up behind it.
      const a = Math.min(1, o / ALIGN);
      const oe = easeOut(a);
      const b = Math.min(1, Math.max(0, (o - ALIGN) / (1 - ALIGN)));
      const last = CARDS.length - 1;
      stack.current?.querySelectorAll<HTMLElement>(".rc").forEach((c, k) => {
        const t = Math.min(1, Math.max(0, (s - LEAD - k * PER) / PER));
        const e = easeOut(t);
        const [rot, x, y] = REST[k % REST.length];
        // from just below the screen, a little more turned, to its resting place in the stack
        let tx = x, ty = (1 - e) * H * 1.05 + y, trot = rot * (1 + (1 - e) * 1.6), extra = "", opacity = 1;
        if (k === last) {
          // the one that stays: it unwinds to dead centre, upright, and grows a little as it comes forward
          tx *= 1 - oe; ty *= 1 - oe; trot *= 1 - oe;
          extra = ` scale(${(1 + 0.07 * oe).toFixed(3)})`;
        } else if (o > 0) {
          // the rest line up behind it — same centre, no angle — and fade out there, before the review has
          // finished arriving
          tx *= 1 - oe; ty *= 1 - oe; trot *= 1 - oe;
          opacity = Math.max(0, 1 - a * CLEAR);
        }
        c.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) rotate(${trot.toFixed(2)}deg)${extra}`;
        c.style.opacity = opacity === 1 ? "" : opacity.toFixed(3);
        c.style.visibility = t > 0 && opacity > 0 ? "visible" : "hidden";
        // the lenticular foil sweeps across the card as it rises, and once more as the last one turns upright
        // (the flipping card has a frame per face, so both are written)
        const f = k === last ? Math.min(1, e + oe) : e;
        c.querySelectorAll<HTMLElement>(".rc-tc").forEach((tc) => {
          tc.style.setProperty("--mx", `${(15 + 70 * f).toFixed(1)}%`);
          tc.style.setProperty("--my", `${(85 - 60 * f).toFixed(1)}%`);
        });
      });
      // the sentence clears the screen with the other cards, so the card that stays is alone: the whole block
      // lifts straight up and fades as one layer — one transform, one opacity, however many words are in it.
      const w = words.current;
      if (w) {
        w.style.transform = o ? `translate3d(0, ${(-oe * H * LIFT).toFixed(1)}px, 0)` : "";
        w.style.opacity = o ? Math.max(0, 1 - a * 1.6).toFixed(3) : "";
      }
      // 05's heading has been waiting a half screen below the sentence: it rides up on the same beat, into the
      // place the sentence is leaving, and stops at the top of the stage with the rail under it.
      const hd = head.current;
      if (hd) hd.style.transform = o ? `translate3d(0, ${((1 - oe) * H * HEAD_RISE).toFixed(1)}px, 0)` : "";
      // the turn itself: state, not a per-frame write — it crosses once, and FlipCard springs it over
      const over = o >= ALIGN;
      if (over !== turned.current) { turned.current = over; setFlipped(over); }
      // the other reviews come up behind the card as it finishes turning, so the one on it is the first of a set
      setOnRail((on) => (on === o > ALIGN - 0.12 ? on : o > ALIGN - 0.12));
      const rl = rail.current;
      if (rl) {
        // The rail is pinned by its own `top`, not by the stage's transform, and sits outside it: a WebGL canvas
        // inside a layer translated by thousands of pixels is laid out correctly but never painted, while the
        // cards (ordinary DOM) are fine. Same position on screen, no transform over it.
        rl.style.top = `${past.toFixed(1)}px`;
        rl.style.opacity = Math.min(1, Math.max(0, (b - 0.25) / 0.45)).toFixed(3);
      }
    };
    const frame = () => { measure(); raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const trackH = `calc(100svh + ${((LEAD + CARDS.length * PER + HOLD + OUTRO) * 100).toFixed(0)}svh)`;

  return (
    <section id="further" className={`section sx${open ? " is-open" : ""}`} aria-label="Your digital infrastructure">
      <div className="sx-track" ref={track} style={{ height: trackH } as CSSProperties}>
        {/* the rest of the reviews, behind the card once it has turned over (components/react-bits/album-rail.tsx).
            It never takes the wheel or the drag: the page's own scroll owns this stretch. The card that turned over
            stands in the rail's own centre slot — it is the first of the set, not a thing in front of it — so the
            rest are sized and spread to fan out from behind its edges. */}
        <div className="rc-rail" ref={rail} aria-hidden={!flipped}>
          {onRail && (
            <AlbumRail items={RAIL} aspect={0.63} size={0.66} spread={1.12} fan={9} turn={26} depth={0.62}
              visible={5} vinyl={false} controls={false} draggable={false} wheel={false} autoplay interval={3.2}
              shadow={0.5} dim={0.58} ariaLabel="More of what clients say" />
          )}
        </div>
        <div className="sx-stage" ref={stage}>
          <div className="wrap sx-words" ref={words}>
            <h2 className="h2 sx-h">
              {LINES.map((line, l) => (
                <span className="sx-line" key={l}>
                  {line.map((w, i) => (
                    <Fragment key={i}>
                      {/* a picture brings its own trailing space, so the closed sentence keeps single spaces */}
                      {i > 0 && !line[i - 1].startsWith("@") && " "}
                      {w.startsWith("@") ? <Pic src={w.slice(1)} /> : <span className="sx-w">{w}</span>}
                    </Fragment>
                  ))}
                  {l < LINES.length - 1 && " "}
                </span>
              ))}
            </h2>
          </div>
          {/* 05 · Testimonials' heading: always there, under the cards, waiting below the sentence */}
          <div className="wrap sx-head" ref={head} aria-hidden={!flipped}>
            <h2 className="h2 sx-head-t">Don’t just take our word for it.</h2>
          </div>
          {/* 03 · The Reality: the cards, over the sentence */}
          <div className="rc-stack" ref={stack} id="reality">
            {CARDS.map((c, k) => (
              <RealityCard key={c.key} c={c} n={k} of={CARDS.length - 1}
                morph={k === CARDS.length - 1 ? TESTIMONIAL_CARD : undefined} flipped={flipped} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
