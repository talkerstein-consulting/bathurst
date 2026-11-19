"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Face, Frame, reviewCard, REVIEW_ID } from "./RealityCards";
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
 */

/** the set, the one that turned over first: it is the card already on screen */
const SET = [
  ...TESTIMONIALS.filter((t) => t.id === REVIEW_ID),
  ...TESTIMONIALS.filter((t) => t.id !== REVIEW_ID),
].map(reviewCard);

export const FAN_COUNT = SET.length;

export default function ReviewFan({ live = true }: { live?: boolean }) {
  const [at, setAt] = useState(0);
  const hold = useRef(false);   // a page the reader asked for: stop stepping on its own

  const go = useCallback((step: number) => {
    hold.current = true;
    setAt((i) => (i + step + FAN_COUNT) % FAN_COUNT);
  }, []);

  // it turns itself over slowly once it is out, until the reader takes it
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => { if (!hold.current) setAt((i) => (i + 1) % FAN_COUNT); }, 5200);
    return () => clearInterval(t);
  }, [live]);

  return (
    <div className="rvf" aria-label="What other clients say">
      <div className="rvf-deck">
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
    </div>
  );
}
