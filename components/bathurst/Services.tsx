"use client";

import { useEffect, useRef, useState } from "react";
import { CAPABILITIES, type Capability } from "@/lib/bathurst/capabilities";
import { CtaButton, CtaLink } from "@/components/style/Cta";
import RowArrows from "./RowArrows";
import { CAP_DIAGRAMS } from "./CapDiagrams";

const book = (service: string) => `/book?${new URLSearchParams({ service })}`;
const SHOWN = 4;   // items on the card; "See more" opens the rest in a modal (D10)
const Chev = () => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6l6 6-6 6" /></svg>;
const Close = () => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>;

/**
 * "What we can do": six capability areas as a sideways row of cards (the Instagram row's convention: the row bleeds to the
 * sheet's edges, ‹ › at the right of the heading, swiped on phones). Each card: a real, client-branded UI of the work
 * (CapDiagrams.tsx), the area, one line and its first services; the foot holds two CTAs side by side: "See more" (outline,
 * opens the full list in a modal) and "Ask about this" (orange, books it). The modal closes with ✕, Esc or a click outside.
 */
export default function Services() {
  const row = useRef<HTMLUListElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState<Capability | null>(null);

  useEffect(() => {
    const d = dialog.current; if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  const Diagram = open ? CAP_DIAGRAMS[open.id] : null;
  return (
    <section id="services" className="section svc-sec">
      <div className="wrap">
        <header className="svc-head rv-reels-h">
          <h2 className="h2">What we can do</h2>
          <RowArrows row={row} what="services" />
        </header>
        <ul ref={row} className="tc-row cap-row">
          {CAPABILITIES.map((c) => {
            const Art = CAP_DIAGRAMS[c.id];
            return (
              <li key={c.id} id={c.id}>
                <article className="cap frame">
                  <div className="cap-art"><Art /></div>
                  <h3 className="cap-t">{c.title}</h3>
                  <p className="cap-line">{c.line}</p>
                  <ul className="cap-list">{c.items.slice(0, SHOWN).map((s) => <li key={s}>{s}</li>)}</ul>
                  <div className="cap-foot">
                    <CtaButton label={`See all ${c.items.length} ${c.title.toLowerCase()} services`} small className="cap-see" aria-haspopup="dialog" onClick={() => setOpen(c)}>
                      See more
                    </CtaButton>
                    <CtaLink href={book(c.title)} label={`Ask about ${c.title.toLowerCase()}`} small className="cap-ask">
                      Ask about this<Chev />
                    </CtaLink>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>

      <dialog ref={dialog} className="rv-modal cap-modal" aria-label={open ? open.title : "Service"}
        onClose={() => setOpen(null)} onClick={(e) => { if (e.target === dialog.current) setOpen(null); }}>
        {open && Diagram && (
          <div className="rv-modal-in cap-modal-in frame" key={open.id}>
            <button type="button" className="sprout btn icon rv-x" aria-label="Close" onClick={() => setOpen(null)}><Close /></button>
            <div className="cap-art cap-modal-art"><Diagram /></div>
            <div className="cap-modal-text">
              <h3 className="cap-modal-t">{open.title}</h3>
              <p className="cap-modal-d">{open.line}</p>
              <ul className="cap-list cap-list-2">{open.items.map((s) => <li key={s}>{s}</li>)}</ul>
              <CtaLink href={book(open.title)} label={`Ask about ${open.title.toLowerCase()}`} className="cap-ask cap-modal-cta">
                Ask about this<Chev />
              </CtaLink>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
