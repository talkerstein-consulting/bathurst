"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";

/**
 * The dots under a sideways row of cards: one per card, the one you are on drawn as a bar rather than a dot, and
 * each one a button that scrolls its card to the front. It reads the row's own scrollLeft, so it stays right whether
 * the row was paged with the ‹ › pair, swiped, or scrolled with a trackpad.
 */
export default function RowDots({ row, count, what }: { row: RefObject<HTMLElement | null>; count: number; what: string }) {
  const [at, setAt] = useState(0);
  useEffect(() => {
    const el = row.current;
    if (!el || count < 2) return;
    const sync = () => {
      // how far through the scrollable distance we are, mapped onto the cards
      const span = el.scrollWidth - el.clientWidth;
      const p = span > 0 ? el.scrollLeft / span : 0;
      setAt(Math.round(p * (count - 1)));
    };
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", sync); ro.disconnect(); };
  }, [row, count]);

  const go = (i: number) => {
    const el = row.current;
    if (!el) return;
    const span = el.scrollWidth - el.clientWidth;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: (span * i) / Math.max(1, count - 1), behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="row-dots" role="tablist" aria-label={`Jump to ${what}`}>
      {Array.from({ length: count }, (_, i) => (
        <button key={i} type="button" className={i === at ? "row-dot is-on" : "row-dot"}
          role="tab" aria-selected={i === at} aria-label={`${what} ${i + 1} of ${count}`} onClick={() => go(i)} />
      ))}
    </div>
  );
}
