"use client";

import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { CtaButton } from "@/components/style/Cta";

const chev = (d: string) => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>;

/**
 * The ‹ › pair for a sideways row of cards (Services, Instagram), one convention for every row (Jakob's Law):
 * at the right of the section header, the two arrows together and nothing else in the group, each one disabled
 * at its end of the row. Phones hide the pair (CSS .row-arrows): there the row is swiped, the next card peeking in.
 */
export default function RowArrows({ row, what }: { row: RefObject<HTMLElement | null>; what: string }) {
  const [ends, setEnds] = useState({ start: true, end: false });
  useEffect(() => {
    const el = row.current; if (!el) return;
    const sync = () => setEnds({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    sync(); el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync); ro.observe(el);
    return () => { el.removeEventListener("scroll", sync); ro.disconnect(); };
  }, [row]);
  const page = (d: number) => row.current?.scrollBy({ left: d * row.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div className="row-arrows">
      <CtaButton variant="icon" label={`Previous ${what}`} disabled={ends.start} onClick={() => page(-1)}>{chev("M14 6l-6 6 6 6")}</CtaButton>
      <CtaButton variant="icon" label={`Next ${what}`} disabled={ends.end} onClick={() => page(1)}>{chev("M10 6l6 6-6 6")}</CtaButton>
    </div>
  );
}
