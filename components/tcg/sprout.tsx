"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { rrect } from "./frame";
import { TOK, useBox } from "./use-box";

/**
 * The sprouting outline, shared.
 *
 * It used to live inside ./cta.tsx, which meant it was the hover of every
 * control on the page EXCEPT the feature cards — and those are controls too.
 * They had a one-off border animation of their own instead, which is the
 * thing that made them read as broken: the same gesture answered two
 * different ways on one page. One source now, drawn with the same seeds,
 * the same timing and the same grunge filter.
 */

export type Seed = {
  seed: number;
  from: number;
  len: number;
  rest: number;
  delay: number;
};

/**
 * One seed per ~70px of perimeter, 3–7 of them, evenly spaced from a random
 * start and jittered ±30% of the spacing, so no two outlines sprout alike.
 */
export function makeSeeds(
  w: number,
  h: number,
  r: number,
  underline?: boolean,
) {
  if (!w || !h) return { inner: "", outer: "", seeds: [] as Seed[] };
  const { so, si, gap } = TOK;
  /* The underline is one straight run along the bottom edge in place of the
     rounded rect. The seed maths below is path-agnostic — it works on a
     normalised pathLength — so the line grows from the same several points and
     closes the same way the outline does. There is no resting line: an
     underline at rest would read as a link, and nothing in this system is
     underlined until it is hovered. */
  const inner = underline ? "" : rrect(w, h, r, so + gap + si / 2);
  const outer = underline
    ? `M${so / 2} ${h - so / 2}H${w - so / 2}`
    : rrect(w, h, r, so / 2);
  const R = Math.max(0, Math.min(r, h / 2, w / 2) - so / 2);
  const per = underline
    ? w - so
    : 2 * (w - so - 2 * R) + 2 * (h - so - 2 * R) + 2 * Math.PI * R;
  const n = Math.max(3, Math.min(7, Math.round(per / 70)));
  const step = 1 / n;
  const start = Math.random();
  const pts = Array.from(
    { length: n },
    (_, k) => start + k * step + (Math.random() - 0.5) * 0.6 * step,
  );
  const seeds: Seed[] = pts.map((sd, k) => {
    const prev = k ? pts[k - 1] : pts[n - 1] - 1;
    const next = k < n - 1 ? pts[k + 1] : pts[0] + 1;
    const from = (prev + sd) / 2;
    const to = (sd + next) / 2;
    const len = Math.min(1, to - from + 0.002);
    const seed = ((sd % 1) + 1) % 1;
    return {
      seed,
      from: seed - (sd - from),
      len,
      rest: 1 - len,
      delay: Math.round(Math.random() * 90),
    };
  });
  return { inner, outer, seeds };
}

/**
 * The outline as a layer over whatever box it is dropped into, for boxes that
 * are not themselves a Cta — the feature card, and the plus on it.
 *
 * It measures its own border box, which is the parent's padding box, so the
 * parent needs nothing but `position: relative`. Whether it is sprouted is
 * left to CSS: these two are driven by the CARD's hover, not their own, so
 * that one pass of the pointer answers in one gesture.
 *
 * `inner` draws the resting hairline as well — the plus wants one, the card
 * already has its frame.
 */
export function SproutStroke({
  inner: withInner,
  className = "",
}: {
  inner?: boolean;
  className?: string;
}) {
  const [ref, box] = useBox<HTMLSpanElement>();
  const [geom, setGeom] = useState<{
    inner: string;
    outer: string;
    seeds: Seed[];
  }>({ inner: "", outer: "", seeds: [] });

  /* Random, so generated in an effect rather than during render: a value
     computed in render is baked into the prerendered HTML, which freezes the
     randomness and trips Next's unstable-value check. */
  useEffect(() => {
    if (!box.w || !box.h) return;
    setGeom(makeSeeds(box.w + 2 * TOK.so, box.h + 2 * TOK.so, box.r + TOK.so));
  }, [box.w, box.h, box.r]);

  return (
    <span ref={ref} className={`sprout-layer ${className}`} aria-hidden="true">
      <svg className="stroke">
        <g filter="url(#grunge)">
          {withInner && <path className="inner" d={geom.inner} />}
          {geom.seeds.map((s, i) => (
            <path
              key={i}
              className="outer"
              pathLength="1"
              d={geom.outer}
              style={
                {
                  "--seed": s.seed,
                  "--from": s.from,
                  "--len": s.len,
                  "--rest": s.rest,
                  "--delay": `${s.delay}ms`,
                } as CSSProperties
              }
            />
          ))}
        </g>
      </svg>
    </span>
  );
}
