"use client";

import { useEffect, useRef, useState } from "react";
import { GOOGLE, REVIEW, onBathurst } from "@/lib/bathurst/data";

const ROTATE_MS = 7000;
const SLIDE_MS = 420;

type Slide = { id: string; person: string; company: string; heading: string; body: string; thumb?: string; photo?: string };

/**
 * Reviews on the cover sheet (replaces the old "Word on the Street" spotlight, same carousel mechanics):
 * the rating summary, then one slide per client. Left: owner photo, name, company, a short heading and the
 * testimonial. Right: the video slot and project photos. Only real quotes are shown as quotes; clients without
 * one show their published work until their words are supplied (never written on their behalf).
 */
export default function Testimonials() {
  const slides: Slide[] = [
    { id: "clutch", person: REVIEW.who, company: REVIEW.org, heading: "Came for marketing. Left with a system.", body: `“${REVIEW.quote}”` },
    ...onBathurst.map((c) => ({
      id: c.id, person: c.testimonial?.who ?? "Owner", company: c.name, thumb: c.thumb,
      heading: c.result ?? c.services.slice(0, 2).join(" and "),
      body: c.testimonial ? `“${c.testimonial.quote}”` : `${c.services.join(", ")} for ${c.name} on ${c.addr}. Their review is on the way.`,
    })),
  ];
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [reduced, setReduced] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  // keep the active client tab in view as the carousel moves
  useEffect(() => {
    const row = tabsRef.current, tab = row?.children[index] as HTMLElement | undefined;   // only the tab row scrolls, never the page
    if (row && tab) row.scrollTo({ left: tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2, behavior: "smooth" });
  }, [index]);
  useEffect(() => setReduced(matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  useEffect(() => {
    if (leaving === null) return;
    const t = setTimeout(() => setLeaving(null), SLIDE_MS);
    return () => clearTimeout(t);
  }, [leaving, index]);
  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => go((index + 1) % slides.length), ROTATE_MS);
    return () => clearTimeout(t);
  });
  const go = (next: number) => {
    if (next === index) return;
    panelRef.current?.style.setProperty("--slide", `${panelRef.current.offsetWidth}px`);
    setLeaving(index);
    setIndex(next);
  };
  const initials = (s: string) => s.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="rv">
      <div className="rv-top">
        <div className="rv-scores">
          <div className="rv-score">
            <b>{REVIEW.rating.toFixed(1)}</b>
            <span><span className="stars" aria-label="5 out of 5">★★★★★</span><small>{REVIEW.count} ratings on Clutch</small></span>
          </div>
          <div className="rv-score">
                        <b>{GOOGLE.rating ? GOOGLE.rating.toFixed(1) : "–"}</b>
            <span><span className={`stars${GOOGLE.rating ? "" : " muted"}`} aria-label={GOOGLE.rating ? `${GOOGLE.rating} out of 5` : undefined}>★★★★★</span><small><a href={GOOGLE.url} target="_blank" rel="noopener">{GOOGLE.count ? `${GOOGLE.count} ratings on Google` : "Rating on Google"}</a></small></span>
          </div>
        </div>
        <button type="button" className="sprout btn orange rv-dir" data-no-tumble aria-label="Get directions" onClick={() => window.dispatchEvent(new Event("tcg:directions"))}>
          <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l9.2 9.2-9.2 9.2L2.8 12z" /><path d="M9 14.5V12a1.5 1.5 0 011.5-1.5H15M13 8.5l2 2-2 2" /></svg>Get directions
        </button>
      </div>

      {/* client tabs across the top; the carousel advances on its own, no stepper */}
      <div className="rv-sel">
      <button type="button" className="sprout btn icon rv-chev" aria-label="Previous review" onClick={() => go((index - 1 + slides.length) % slides.length)}>
        <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 6l-6 6 6 6" /></svg>
      </button>
      <div role="tablist" aria-label="Clients" className="sp-row rv-tabs" ref={tabsRef}>
        {slides.map((s, i) => (
          <button key={s.id} role="tab" id={`rv-tab-${i}`} aria-controls={`rv-panel-${i}`} aria-selected={i === index} type="button" onClick={() => go(i)}
            className={`sp-tab ${i === index ? "on" : ""}`}>
            <span className="font-heading text-lg leading-tight">{s.company}</span>
          </button>
        ))}
      </div>
      <button type="button" className="sprout btn icon rv-chev" aria-label="Next review" onClick={() => go((index + 1) % slides.length)}>
        <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6l6 6-6 6" /></svg>
      </button>
      </div>

      <div ref={panelRef} className="rv-panel">
        {slides.map((s, i) => (
          <article key={s.id} role="tabpanel" id={`rv-panel-${i}`} aria-labelledby={`rv-tab-${i}`} aria-hidden={i !== index}
            className={`rv-slide ${i === index ? "sp-in" : i === leaving ? "sp-out" : "invisible"}`}>
            <div className="rv-left">
              <div className="rv-person">
                {/* TODO(content): owner portrait */}
                <span className="rv-avatar single hair">{s.photo ? <img src={s.photo} alt="" /> : initials(s.person === "Owner" ? s.company : s.person)}</span>
                <span><b>{s.person}</b><small>{s.company}</small></span>
              </div>
              <h2 className="h2">{s.heading}</h2>
              <p className="rv-body">{s.body}</p>
            </div>
            <div className="rv-media">
              <div className="rv-video single hair" role="img" aria-label={`Video testimonial from ${s.company}, coming soon`}>
                {/* TODO(content): client video testimonial */}
                <span className="rv-play" aria-hidden="true"><svg className="glyph" viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" /></svg></span>
                <small>Video testimonial</small>
              </div>
              {[0, 1].map((k) => (
                <div key={k} className="rv-photo single hair">
                  {s.thumb && k === 0 ? <img src={s.thumb} alt="" /> : <small>Project photo</small>}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <button type="button" className="sprout btn orange rv-dir rv-dir-below" data-no-tumble aria-label="Get directions" onClick={() => window.dispatchEvent(new Event("tcg:directions"))}>
        <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l9.2 9.2-9.2 9.2L2.8 12z" /><path d="M9 14.5V12a1.5 1.5 0 011.5-1.5H15M13 8.5l2 2-2 2" /></svg>Get directions
      </button>
    </div>
  );
}
