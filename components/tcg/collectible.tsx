"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";

/**
 * The collectible card, ported from the brand guide: the one card in the system
 * with a fill. It reads top down like a Monocle city guide — the series line
 * with the mark and the number, a rule straight under it, the title block, then
 * the art taking everything that is left. One fill, not two, which is why the
 * type sits on the card stock itself in Sea Breeze tints.
 *
 * Tilt and foil follow the pointer. Both are suppressed under
 * prefers-reduced-motion by the stylesheet.
 *
 * PLACEHOLDER CONTENT: no testimonial is written here. A quote attributed to a
 * real business has to come from that business, so the quote slot and the
 * attribution are empty until those arrive.
 */
export function Collectible({
  series,
  n,
  title,
  sub,
}: {
  series: string;
  n: string;
  title: string;
  sub: string;
}) {
  const card = useRef<HTMLButtonElement | null>(null);

  const track = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const el = card.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width;
    const y = (e.clientY - b.top) / b.height;
    el.style.setProperty("--ry", `${(x - 0.5) * 16}deg`);
    el.style.setProperty("--rx", `${(0.5 - y) * 16}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };

  const rest = () => {
    const el = card.current;
    if (!el) return;
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--rx", "0deg");
  };

  return (
    <button
      type="button"
      className="tc"
      ref={card}
      onPointerMove={track}
      onPointerLeave={rest}
      aria-label={`${title} — testimonial not yet collected`}
    >
      <span className="tc-in">
        <span className="tc-top">
          <span className="tc-mark" aria-hidden="true" />
          <span className="tc-series">{series}</span>
          <span className="tc-n">{n}</span>
        </span>

        <span className="tc-title">
          <b>{title}</b>
          <small>{sub}</small>
        </span>

        <span className="tc-art" aria-hidden="true" />
      </span>
      <span className="tc-foil" aria-hidden="true" />
    </button>
  );
}
