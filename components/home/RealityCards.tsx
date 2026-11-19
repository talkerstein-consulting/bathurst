import type { CSSProperties, ReactNode } from "react";

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
type Card = { key: string; label: string; kind?: string; eyebrow?: string; title: string; body: string; heading?: boolean; figure?: ReactNode };

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

const nn = (n: number) => String(n).padStart(2, "0");

export function RealityCard({ c, n, of }: { c: Card; n: number; of: number }) {
  const T = c.heading ? "h2" : "h3";
  return (
    <article className={`rc${c.heading ? " rc-head" : ""}`}>
      <div className="tc rc-tc" style={{ "--rx": "0deg", "--ry": "0deg" } as CSSProperties}>
        <span className="tc-in">
          <span className="tc-top"><b>{c.label}</b><span className="tc-no">{c.heading ? "Section 03" : `${nn(n)}/${nn(of)}`}</span></span>
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
          <span className="tc-foot"><span>The reality</span></span>
        </span>
        <span className="tc-foil" aria-hidden="true" />
      </div>
    </article>
  );
}
