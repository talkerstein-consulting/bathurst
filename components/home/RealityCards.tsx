import type { CSSProperties, ReactNode } from "react";
import FlipCard from "@/components/FlipCard";
import { TESTIMONIALS } from "@/lib/bathurst/data";

type Testimonial = (typeof TESTIMONIALS)[number];

/**
 * 03 · The Reality, as a stack of cards that lays over the pinned sentence (components/home/SentenceSection.tsx moves
 * them). One card for the section's head, then one per way a business loses the sale.
 *
 * Built from the Bathurst interview cards (components/bathurst/ReelCards.tsx, .tc-* in app/bathurst-map.css): the
 * trading-card format (Steel frame, banner row with its number, art window, name, caption, footer) and their
 * lenticular foil, which here sweeps as each card rises (no hover: layout only). Accents are TCG blue rather than the
 * reels' orange (app/sentence.css).
 *
 * Imagery: a subtle blue/cream halftone of a quietly troubled owner (scripts/halftone-soft.py) with a small UI
 * element over it about the card's topic. ONE SAMPLE so far, on "You're hard to find."; the other two hold a hatched
 * slot until their pictures are made.
 */
export type Card = { key: string; label: string; kind?: string; no?: string; eyebrow?: string; title: string; body: string; foot?: string; heading?: boolean; figure?: ReactNode };

/* the sample's UI element: a search for the owner's trade, the business far down the results (monospace, like the
   ledger type set over the reference picture) */
const SEARCH = (
  <div className="rc-ui rc-search" aria-hidden="true">
    <p className="rc-ui-q">search · “renovation contractor north york”</p>
    <ol>
      <li><span>01</span>Brightline Renovations<em>4.8</em></li>
      <li><span>02</span>North York Home Pros<em>4.6</em></li>
      <li><span>03</span>Avenue Build Co.<em>4.7</em></li>
    </ol>
    <p className="rc-ui-sep">———— page 2 ————</p>
    <ol start={14}>
      <li className="is-you"><span>14</span>Your business<em>—</em></li>
    </ol>
  </div>
);

export const CARDS: Card[] = [
  {
    key: "head", heading: true, label: "Talkerstein", eyebrow: "The reality",
    title: "Getting attention is only half the job.",
    body: "A potential customer finds your business. Can they understand what you offer, trust what they see, and easily get in touch? Small gaps in your digital presence can cost you the sale.",
  },
  {
    key: "find", label: "Visibility", kind: "Search",
    title: "You’re hard to find.",
    body: "Customers can’t choose your business if they don’t come across it when they’re looking.",
    figure: <><img src="/reality/owner-halftone.webp" alt="" loading="lazy" decoding="async" />{SEARCH}</>,
  },
  {
    key: "convince", label: "Website",
    title: "Your website isn’t convincing them.",
    body: "Visitors leave when they can’t quickly understand what makes your business worth choosing.",
  },
  {
    key: "follow", label: "Follow-up",
    title: "Inquiries aren’t turning into sales.",
    body: "Slow responses, scattered messages, and inconsistent follow-ups can leave good opportunities behind.",
  },
];

/**
 * What the last card turns into once the stack is complete: the same trading-card format, the same slots, a real
 * client review in place of the problem (lib/bathurst/data.ts — the Maple Electric Supply testimonial, quote and
 * attribution as published; never write one on a client's behalf). It is the hand-off into 05 · Testimonials.
 */
export const REVIEW_ID = "mes";   // whose review is on the card, so the rail behind it can leave them out

/* the business behind each voice, for the card's banner — the role line reads as a sentence, not a name */
const BRAND: Record<string, string> = {
  fringe: "FRINGE boutique", mes: "Maple Electric Supply", novarrisk: "Nova Risk Transfer",
  gemini: "Gemini Printing", jrcc: "JRCC @ Rockford", uzbek: "Uzbek Delight", iconrocklear: "Icon Rocklear",
};

/* the published quotes run long; a card holds the opening sentences. Cut on a sentence end, never mid-word, and
   never rewrite — §05 plays the clip and shows the quote in full. */
const short = (quote: string, max = 190) => {
  if (quote.length <= max) return quote;
  const head = quote.slice(0, max);
  const stop = Math.max(head.lastIndexOf(". "), head.lastIndexOf("! "), head.lastIndexOf("? "));
  return stop > 60 ? head.slice(0, stop + 1) : `${head.slice(0, head.lastIndexOf(" "))}…`;
};

/** One client's review in the card format: same frame, same slots, their own words and their own still. */
export const reviewCard = (t: Testimonial): Card => ({
  key: t.id, label: BRAND[t.id] ?? t.role, kind: "Client review", foot: "The proof",
  title: t.who,
  body: `“${short(t.quote)}”`,
  figure: <img src={t.poster} alt="" loading="lazy" decoding="async" />,
});

/** The one on the card that turns over: the Maple Electric Supply review. */
/* it is the first of the set of reviews, not the last of the problems: it carries the set's own count, so nothing
   in the banner changes when components/home/ReviewFan.tsx takes the centre slot over from it */
export const TESTIMONIAL_CARD: Card = {
  ...reviewCard(TESTIMONIALS.find((t) => t.id === REVIEW_ID)!),
  no: `01/${String(TESTIMONIALS.length).padStart(2, "0")}`,
};

const nn = (n: number) => String(n).padStart(2, "0");

/** One face of a card: the banner row, the art window, the name, the caption and the footer. */
export function Face({ c, n, of, className }: { c: Card; n: number; of: number; className?: string }) {
  const T = c.heading ? "h2" : "h3";
  return (
    <span className={className ? `tc-in ${className}` : "tc-in"}>
      <span className="tc-top"><b>{c.label}</b><span className="tc-no">{c.heading ? "Section 03" : c.no ?? `${nn(n)}/${nn(of)}`}</span></span>
      {c.heading ? (
        // the head card's art window holds the section's own preheader and heading, cream on blue
        <span className="tc-art rc-art-head">
          {c.eyebrow && <span className="eyebrow rc-eyebrow">{c.eyebrow}</span>}
          <T className="h3 rc-t">{c.title}</T>
        </span>
      ) : (
        <span className={`tc-art rc-art${c.figure ? "" : " is-empty"}`}>
          {c.figure ?? <span className="rc-todo">Image to come</span>}
          {c.kind && <span className="tc-kind">{c.kind}</span>}
        </span>
      )}
      {!c.heading && <T className="tc-name rc-t">{c.title}</T>}
      <span className="tc-cap rc-b">{c.body}</span>
      <span className="tc-foot"><span>{c.foot ?? "The reality"}</span></span>
    </span>
  );
}

/** The card frame: the Steel border and the lenticular foil around one face. */
export function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="tc rc-tc" style={{ "--rx": "0deg", "--ry": "0deg" } as CSSProperties}>
      {children}
      <span className="tc-foil" aria-hidden="true" />
    </div>
  );
}

/**
 * A card. With `morph` it is mounted in a FlipCard (components/FlipCard.jsx, react-bits) holding the problem on the
 * front and the client review on the back: SentenceSection turns it over on the scroll, once the card is upright in
 * the middle of the screen. Same frame, same slots, same type on both faces — only what is in them changes.
 */
export function RealityCard({ c, n, of, morph, flipped }: { c: Card; n: number; of: number; morph?: Card; flipped?: boolean }) {
  const face = <Frame><Face c={c} n={n} of={of} /></Frame>;
  return (
    <article className={`rc${c.heading ? " rc-head" : ""}${morph ? " rc-flip" : ""}`}>
      {morph ? (
        <FlipCard
          className="rc-fc"
          front={face}
          back={<Frame><Face c={morph} n={n} of={of} /></Frame>}
          flipped={!!flipped}
          flipOnClick={false} draggable={false} tilt={false} glare={false} shadow={false}
          background="transparent" radius={16} stiffness={120} damping={18}
          ariaLabel="The reality, and what clients say"
        />
      ) : face}
    </article>
  );
}
