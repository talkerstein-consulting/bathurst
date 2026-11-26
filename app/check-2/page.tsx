import type { Metadata } from "next";
import { Instrument } from "@/components/tcg/instrument";
import { TopBar } from "@/components/tcg/topbar";
import { assessHref } from "@/lib/book";
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
        <Instrument bookHref={assessHref()} />
      </main>
    </>
  );
}
