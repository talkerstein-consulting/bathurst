import type { Metadata } from "next";
import { HeroGround } from "@/components/tcg/hero-ground";
import { Instrument } from "@/components/tcg/instrument";
import { ProofBar } from "@/components/tcg/proof-bar";
import { TopBar } from "@/components/tcg/topbar";
/* Awards carries .hero-awards, which lives with the map's stylesheet. It is imported
   before check-2.css so this page's own rules still win where the two meet. */
import "../bathurst-map.css";
import "../check-2.css";

/**
 * The silent-leak assessment as one instrument, in one viewport.
 *
 * Enter website → watch the reading → see the result → ask for a review. Nothing else:
 * no sections, no testimonials, no footer. The condensed bar stays because the page
 * still has to say whose instrument this is, and it keeps the appointment on the right
 * for anyone who would rather skip straight to it.
 *
 * The page itself holds nothing but the bar and the panel; everything that happens is in
 * components/tcg/instrument.tsx, which explains the four stages and what in them is a
 * real measurement and what is not.
 *
 * /check is the other treatment of the same campaign — the scrolling landing page. This
 * one does not replace it; both are live so they can be put side by side.
 */
export const metadata: Metadata = {
  title: "Check your website — TCG",
  description:
    "Enter your website address for a free performance and accessibility reading, and see what your customers experience.",
  robots: { index: false, follow: false },
};

export default function CheckTwo() {
  return (
    <>
      <TopBar always />
      <main className="inst-page">
        {/* The ground: the home hero's dither, full screen, in a vintage beige — warmer
            and brighter than the map's own paper, so the page reads as aged stock
            rather than grey card. The pair is deliberately narrow: the paper is near the
            top of the range and the dark end only a few steps below it, which keeps the
            whole ground light and the mid steps out of mud — the dither quantises
            BETWEEN these two, so the darkest thing on screen is the second value and
            nothing is darker. Red is the highest channel in both colours and blue
            the lowest, which is what keeps every quantised step between them warm; a
            pair that straddles neutral puts a third hue in the middle steps. Steel Blue
            type measures 11.4:1 on the darkest of those steps, so the headline clears AA
            against the whole range. The instrument sits on it with no plate of its own.

            FLAGGED, D00.2: these two are literal hex, not tokens. They are a printed
            ground rather than UI colour, and the canvas reads them in JS where a custom
            property is not available; the loading state in app/check-2.css carries the
            paper value a second time and follows these by hand. */}
        <HeroGround ink="#E9E0D2" paper="#FCF8F1" />
        <Instrument />
        <ProofBar />
      </main>
    </>
  );
}
