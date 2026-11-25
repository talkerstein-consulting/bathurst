"use client";

import { RailChevrons } from "./rail-chevrons";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The feature cards' rail and its chevrons — the clients row's pattern
 * (./clients.tsx), so the page drives its two sideways rows the same way.
 *
 * The cards keep their full size; the row runs out to the screen edges and
 * the chevrons move it one card at a time. D03: chevrons, not arrows. D04: an
 * end chevron is aria-disabled, not removed or natively disabled, so the press
 * is still felt there. G13: the scroll listener and observer are released.
 */
export function FeatureRail({
  heading,
  children,
}: {
  /** The section's h2, set on the chevrons' row like the clients heading. */
  heading: ReactNode;
  children: ReactNode;
}) {
  const row = useRef<HTMLDivElement | null>(null);
  const [ends, setEnds] = useState({ start: true, end: false });

  const readEnds = useCallback(() => {
    const el = row.current;
    if (!el) return;
    setEnds({
      start: el.scrollLeft <= 2,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    readEnds();
    el.addEventListener("scroll", readEnds, { passive: true });
    const ro = new ResizeObserver(readEnds);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", readEnds);
      ro.disconnect();
    };
  }, [readEnds]);

  const nudge = (dir: -1 | 1) => {
    const el = row.current;
    if (!el) return;
    /* The distance between the first two cards' left edges: one card plus the
       gap, measured, so it holds whatever the gap computes to ("normal" on
       the phone tray would otherwise make the step NaN). */
    const [a, b] = Array.from(el.children) as HTMLElement[];
    const by =
      a && b
        ? b.getBoundingClientRect().left - a.getBoundingClientRect().left
        : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * by, behavior: "smooth" });
  };

  return (
    <>
      <div className="sec-head cl-head fr-head">
      {heading}
      <RailChevrons place="head" ends={ends} onStep={nudge} prev="Previous services" next="More services" />
      </div>
      <div className="rail-wrap">
        <div className="card-row card-row--framed" ref={row}>
          {children}
        </div>
      </div>
    </>
  );
}
