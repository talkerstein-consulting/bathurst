"use client";

import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

/**
 * The collectible card, as the brand guide draws it (index.html at the project
 * root, 06 Cards, "Collectible card"): the one card in the system with a fill,
 * and the only place the logo mark appears inside a component. Top down: the
 * series line with the mark, a rule straight under it, the title block, then
 * the art taking everything that is left. Nothing else — no number, no foot.
 * One fill, not two, which is why the type sits on the card stock itself in
 * Sea Breeze tints.
 *
 * Tilt and foil follow a mouse pointer (not touch), at the guide's angles.
 * Both are suppressed under prefers-reduced-motion by the stylesheet.
 *
 * Without `art`, the art window is an empty plate and the card says its
 * testimonial is not yet collected: a quote attributed to a real business has
 * to come from that business.
 *
 * The clients row (components/tcg/clients.tsx) fills the optional slots the old
 * Bathurst interview cards carried (components/bathurst/ReelCards.tsx, in git
 * history): the client's logo at the far right of the title, a caption under
 * the art and a foot line. Without `series` the series line and its rule are
 * left out and the title leads.
 */
export function Collectible({
  series,
  title,
  sub,
  n,
  logo,
  art,
  caption,
  foot,
  label,
  onPress,
}: {
  /** The series line, with the TCG mark and a rule under it. Left out when absent. */
  series?: string;
  title: string;
  sub: string;
  /** The card's place in its set, at the end of the series line ("01/07"). */
  n?: string;
  /** The client's own mark, over the title. */
  logo?: ReactNode;
  /** What fills the art window. Empty plate when absent. */
  art?: ReactNode;
  /** A short caption under the art. */
  caption?: ReactNode;
  /** The foot line, under a rule. */
  foot?: ReactNode;
  /** The accessible name of the card, which is one control. */
  label?: string;
  onPress?: () => void;
}) {
  const card = useRef<HTMLButtonElement | null>(null);

  const track = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = card.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    const x = (e.clientX - b.left) / b.width;
    const y = (e.clientY - b.top) / b.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
  };

  const rest = () => {
    const el = card.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <button
      type="button"
      className={caption || foot ? "tc tc-full" : "tc"}
      ref={card}
      onPointerMove={track}
      onPointerLeave={rest}
      onClick={onPress}
      aria-label={label ?? `${title} — testimonial not yet collected`}
    >
      <span className="tc-in">
        {series && (
          <span className="tc-top">
            {/* eslint-disable-next-line @next/next/no-img-element -- the brand mark, a small static SVG */}
            <img className="tc-mark" src="/brand/tcg-icon.svg" alt="" />
            <span className="tc-series">{series}</span>
            {n && <span className="tc-n">{n}</span>}
          </span>
        )}

        <span className={logo ? "tc-title tc-title--logo" : "tc-title"}>
          <b>{title}</b>
          <small>{sub}</small>
          {logo && <span className="tc-logo">{logo}</span>}
        </span>

        <span className="tc-art" aria-hidden="true">{art}</span>

        {caption && <span className="tc-cap">{caption}</span>}
        {foot && <span className="tc-foot">{foot}</span>}
      </span>
      <span className="tc-foil" aria-hidden="true" />
    </button>
  );
}
