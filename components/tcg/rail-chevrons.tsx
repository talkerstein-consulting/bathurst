import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * The ‹ › pair for a sideways row. Two placements, one control:
 *
 *   "head"    beside the section heading (tablet and desktop)
 *   "overlay" over the row itself, centred on the cards' height and raised
 *             above them, one at each edge, the way a video site's shelf does
 *             it (phones)
 *
 * Each row renders both and CSS shows the one for the width. D03: chevrons.
 * D04: an end is aria-disabled, so the press is still felt there.
 */
export function RailChevrons({
  place,
  ends,
  onStep,
  prev,
  next,
}: {
  place: "head" | "overlay";
  ends: { start: boolean; end: boolean };
  onStep: (dir: -1 | 1) => void;
  prev: string;
  next: string;
}) {
  return (
    <div className={place === "head" ? "cl-nav rail-nav--head" : "rail-nav--over"}>
      <button
        type="button"
        className="cl-chev"
        aria-label={prev}
        aria-disabled={ends.start}
        onClick={() => !ends.start && onStep(-1)}
      >
        <ChevronLeft className="glyph" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="cl-chev"
        aria-label={next}
        aria-disabled={ends.end}
        onClick={() => !ends.end && onStep(1)}
      >
        <ChevronRight className="glyph" aria-hidden="true" />
      </button>
    </div>
  );
}
