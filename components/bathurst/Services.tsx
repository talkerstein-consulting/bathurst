"use client";

import { useRef, useState } from "react";
import { CAPABILITIES } from "@/lib/bathurst/capabilities";
import { CtaLink } from "@/components/style/Cta";
import RowArrows from "./RowArrows";
import { CAP_DIAGRAMS } from "./CapDiagrams";

const book = (service: string) => `/book?${new URLSearchParams({ service })}`;
const SHOWN = 4;   // items before "See more" (D10: long text gets a Read more that expands the card)

/**
 * "What we can do": six capability areas as a sideways row of cards (the Instagram row's convention: the row bleeds to the
 * sheet's edges, ‹ › at the right of the heading, swiped on phones). Each card: a real UI of the work
 * (CapDiagrams.tsx), the area, one line, its services (four, then "See more" under them) and an outline link to book it.
 * After the row: the section's one filled CTA.
 */
export default function Services() {
  const row = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <section id="services" className="section svc-sec">
      <div className="wrap">
        <header className="svc-head rv-reels-h">
          <h2 className="h2">What we can do</h2>
          <RowArrows row={row} what="services" />
        </header>
        <ul ref={row} className="tc-row cap-row">
          {CAPABILITIES.map((c) => {
            const Diagram = CAP_DIAGRAMS[c.id], all = !!open[c.id];
            return (
              <li key={c.id} id={c.id}>
                <article className="cap frame">
                  <div className="cap-art"><Diagram /></div>
                  <h3 className="cap-t">{c.title}</h3>
                  <p className="cap-line">{c.line}</p>
                  <ul className="cap-list" id={`${c.id}-list`}>
                    {(all ? c.items : c.items.slice(0, SHOWN)).map((s) => <li key={s}>{s}</li>)}
                  </ul>
                  {c.items.length > SHOWN && (
                    <button type="button" className="cap-more" aria-expanded={all} aria-controls={`${c.id}-list`}
                      onClick={() => setOpen((o) => ({ ...o, [c.id]: !all }))}>
                      {all ? "See less" : "See more"}
                    </button>
                  )}
                  <div className="cap-foot">
                    <CtaLink href={book(c.title)} label={`Ask about ${c.title.toLowerCase()}`} small className="cap-ask">
                      Ask about this<svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6l6 6-6 6" /></svg>
                    </CtaLink>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
        {/* after the cards: the one filled CTA, for anyone not sure where to start */}
        <div className="svc-after">
          <p className="svc-after-t">Not sure where to start?</p>
          <CtaLink href={book("Diagnostics")} label="Book Free Consult" className="dc-go svc-cta">
            <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l9.2 9.2-9.2 9.2L2.8 12z" /><path d="M9 14.5V12a1.5 1.5 0 011.5-1.5H15M13 8.5l2 2-2 2" /></svg>Book Free Consult
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
