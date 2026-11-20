"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Face, Frame, reviewCard, REVIEW_ID } from "./RealityCards";
import ReviewVideoModal from "@/components/bathurst/ReviewVideoModal";
import { setReviewFocus } from "./reviewFocus";
import { TESTIMONIALS } from "@/lib/bathurst/data";

/**
 * The rest of what clients say, fanned out behind the card that turned over (components/home/SentenceSection.tsx
 * runs the beat, app/sentence.css holds the geometry).
 *
 * It replaces the react-bits album rail that was here: the rail draws its items as flat pictures in WebGL, so the
 * cards behind could never carry the trading-card frame, the banner, the quote or the footer the review on the
 * front has. These are the same cards, in the DOM, so the set reads as one set.
 *
 * The card that turned over is the first of them — it is the fan's own centre slot, not a thing standing in front
 * of it — so SentenceSection hides the flipping card once this is out and the centre card below takes its place
 * without anything moving.
 *
 * Two numbers drive every card: `--fan` (0 → 1, written per frame by the scroll) spreads the set out from behind
 * the centre, and `--d` (which slot a card is in, counted from the centre) is transitioned on its own when the
 * controller pages, so paging animates while the scroll keeps writing `--fan` without being interpolated.
 *
 * A card is the review's own video: clicking (or Enter/Space on) any of them opens it in the same dialog
 * 05 · Testimonials uses (components/bathurst/ReviewVideoModal.tsx). The deck also takes a sideways drag or
 * swipe — a horizontal pointer gesture pages it, a vertical one is left to the page's own scroll.
 */

/** the set, the one that turned over first: it is the card already on screen */
const ORDER = [
  ...TESTIMONIALS.filter((t) => t.id === REVIEW_ID),
  ...TESTIMONIALS.filter((t) => t.id !== REVIEW_ID),
];
/* the cards themselves, in the fan's own order: the section below draws the one in the centre slot again as it
   carries it into its first diagram (components/home/CapabilityPanels.tsx) */
export const REVIEW_SET = ORDER.map(reviewCard);
const SET = REVIEW_SET;

export const FAN_COUNT = SET.length;

const SWIPE = 44;   // px of sideways travel that counts as a page, not a tap or a scroll

export default function ReviewFan({ live = true }: { live?: boolean }) {
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState<number | null>(null);   // which review's video is open, if any
  const hold = useRef(false);   // a page the reader asked for: stop stepping on its own

  const go = useCallback((step: number) => {
    hold.current = true;
    setAt((i) => (i + step + FAN_COUNT) % FAN_COUNT);
  }, []);

  // it turns itself over slowly once it is out, until the reader takes it — and it holds still while a video plays
  useEffect(() => {
    if (!live || playing !== null) return;
    const t = setInterval(() => { if (!hold.current) setAt((i) => (i + 1) % FAN_COUNT); }, 5200);
    return () => clearInterval(t);
  }, [live, playing]);

  // the section below carries this same card on into its first diagram, so it has to know which one is in the
  // centre slot right now (components/home/reviewFocus.ts)
  useEffect(() => { setReviewFocus(at); }, [at]);

  // sideways drag / swipe across the deck. Only a gesture that is clearly horizontal pages the fan; anything more
  // vertical than sideways is a scroll and is left alone, so the page still scrolls through this stretch.
  const down = useRef<{ x: number; y: number; id: number } | null>(null);
  const dragged = useRef(false);
  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    down.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    dragged.current = false;
  };
  const onMove = (e: React.PointerEvent) => {
    const d = down.current;
    if (!d || d.id !== e.pointerId || dragged.current) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.abs(dx) < SWIPE || Math.abs(dx) <= Math.abs(dy)) return;
    dragged.current = true;          // this gesture is a page, so the click it ends with is not a tap
    down.current = null;
    go(dx < 0 ? 1 : -1);             // dragging left brings the next card in, as a row of cards would
  };
  const onUp = () => { down.current = null; };

  const open = (i: number) => { hold.current = true; setAt(i); setPlaying(i); };

  return (
    <div className="rvf" aria-label="What other clients say">
      <div className="rvf-deck" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        {SET.map((c, i) => {
          // where this card sits counted from the centre, by the shorter way round
          let d = i - at;
          if (d > FAN_COUNT / 2) d -= FAN_COUNT;
          if (d < -FAN_COUNT / 2) d += FAN_COUNT;
          const away = Math.abs(d);
          return (
            <div
              key={c.key}
              className={`rvf-card${d === 0 ? " is-at" : ""}`}
              style={{ "--d": d, "--away": away, zIndex: FAN_COUNT - away } as CSSProperties}
              aria-hidden={d !== 0}
              inert={d !== 0}
              role="button"
              tabIndex={d === 0 ? 0 : -1}
              aria-label={`Play video from ${ORDER[i].who}, ${ORDER[i].role}`}
              onClick={() => { if (!dragged.current) open(i); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); } }}
            >
              <Frame><Face c={c} n={i + 1} of={FAN_COUNT} /></Frame>
            </div>
          );
        })}
      </div>
      <div className="rvf-bar">
        <button type="button" className="rvf-arr" onClick={() => go(-1)} aria-label="Previous review">‹</button>
        <span className="rvf-dots">
          {SET.map((c, i) => (
            <button
              key={c.key} type="button"
              className={`rvf-dot${i === at ? " is-at" : ""}`}
              aria-current={i === at || undefined}
              aria-label={`${c.title}, ${c.label}`}
              onClick={() => { hold.current = true; setAt(i); }}
            />
          ))}
        </span>
        <button type="button" className="rvf-arr" onClick={() => go(1)} aria-label="Next review">›</button>
      </div>
      <ReviewVideoModal items={ORDER} at={playing} setAt={setPlaying} />
    </div>
  );
}
