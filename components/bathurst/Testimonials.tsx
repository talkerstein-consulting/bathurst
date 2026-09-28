"use client";

import { useEffect, useRef, useState } from "react";
import { GOOGLE, REVIEW, TESTIMONIALS } from "@/lib/bathurst/data";

const ROTATE_MS = 7000;
const SLIDE_MS = 420;

type Slide = (typeof TESTIMONIALS)[number];

/**
 * Reviews on the cover sheet (replaces the old "Word on the Street" spotlight, same carousel mechanics):
 * the rating summary, then one slide per client. Left: owner photo, name, company, a short heading and the
 * testimonial. Right: the video slot and project photos. Only real quotes are shown as quotes; clients without
 * one show their published work until their words are supplied (never written on their behalf).
 */
export default function Testimonials() {
  const slides: Slide[] = TESTIMONIALS;
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const [playing, setPlaying] = useState(false);
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
    if (reduced || playing) return;
    const t = setTimeout(() => go((index + 1) % slides.length), ROTATE_MS);
    return () => clearTimeout(t);
  });
  const go = (next: number) => {
    if (next === index) return;
    panelRef.current?.style.setProperty("--slide", `${panelRef.current.offsetWidth}px`);
    videos.current[index]?.pause();
    setPlaying(false);
    setLeaving(index);
    setIndex(next);
  };

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
            <img className={`rv-tab-logo${s.tall ? " tall" : ""}`} src={s.logo} alt={s.role} />
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
                <span><b>{s.who}</b><small>{s.role}</small></span>
              </div>
              <p className="rv-body">“{s.quote}”</p>
            </div>
            <div className="rv-video single hair">
              <video ref={(el) => { videos.current[i] = el; }} src={s.video} poster={s.poster} controls playsInline preload="none"
                onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
                aria-label={`Video testimonial from ${s.who}, ${s.role}`} />
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
