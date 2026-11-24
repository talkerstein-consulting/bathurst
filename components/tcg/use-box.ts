"use client";

import { useLayoutEffect, useRef, useState } from "react";

export type Box = { w: number; h: number; r: number };

/**
 * Measures an element's border box and its computed corner radius, so the line
 * system can draw strokes that sit outside the padding box without being
 * clipped. Ported from the brand guide.
 */
export function useBox<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [box, setBox] = useState<Box>({ w: 0, h: 0, r: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      const b = e.borderBoxSize && e.borderBoxSize[0];
      /* Rounded on purpose. A CTA's outline is drawn from randomly placed
         seeds, regenerated whenever this box changes — so a sub-pixel change
         reshuffles the dashes and the outline visibly jumps. The sticky bar
         animates its transform, which is exactly the thing that produces those
         fractional measurements, and the buttons inside it flickered on every
         frame. Whole pixels are all the geometry needs. */
      const w = Math.round(b ? b.inlineSize : el.offsetWidth);
      const h = Math.round(b ? b.blockSize : el.offsetHeight);
      const r = Math.round(
        parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0,
      );
      setBox((p) => (p.w === w && p.h === h && p.r === r ? p : { w, h, r }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, box] as const;
}

/** The three stroke tokens the line system draws with. */
export const TOK = { so: 1.5, si: 0.5, gap: 4 } as const;
