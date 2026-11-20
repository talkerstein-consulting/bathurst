"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { GOOGLE, REVIEW, TESTIMONIALS } from "@/lib/bathurst/data";
import ReviewVideoModal from "./ReviewVideoModal";
import RowArrows from "./RowArrows";
import RowDots from "./RowDots";
import { useCoverNear } from "./useCoverNear";

type Item = (typeof TESTIMONIALS)[number];
type Tile = { key: string; node: ReactNode };



const Play = () => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>;

/**
 * Reviews on the cover sheet (STYLE.md: Sea Breeze surfaces, double-line frames, outline CTAs).
 * The two ratings side by side, then one side-swiping row of framed video cards (‹ › on desktop, swipe on phones). A card: the video's own poster in a hairline frame, then one row with the logo,
 * name and position, and the outline play button. On hover the quote shows, truncated, over the poster's foot.
 * Play opens a dialog with the video and the whole testimonial. Only real quotes are shown.
 */
export default function Testimonials({ heading, split = false }: { heading?: ReactNode; split?: boolean } = {}) {
  const [cols, setCols] = useState(3);
  const [at, setAt] = useState<number | null>(null);
  const setOpen = (s: Item | null) => setAt(s ? TESTIMONIALS.indexOf(s) : null);
  const swipe = useRef<HTMLDivElement>(null);
  const near = useCoverNear();   // posters load once the visitor heads for the sheet, not with the first page load

  useEffect(() => {
    const m = matchMedia("(max-width: 759px)"), set = () => setCols(m.matches ? 1 : 3);   // 1 = the phone layout
    set(); m.addEventListener("change", set); return () => m.removeEventListener("change", set);
  }, []);
  const rating = (key: string, href: string, score: string, label: string, stars: string | undefined, muted = false): Tile => ({
    key,
    node: (
      <a className="rv-score rv-tile frame" href={href} target="_blank" rel="noopener">
        <b>{score}</b>
        <span><span className={`stars${muted ? " muted" : ""}`} aria-label={stars}>★★★★★</span><small>{label}</small></span>
      </a>
    ),
  });

  const cards: Tile[] = TESTIMONIALS.map((s) => ({
    key: s.id,
    node: (
      <article className="rv-card rv-tile frame" tabIndex={0} role="button" data-sprout-host aria-label={`Play video from ${s.who}, ${s.role}`}
        onClick={() => setOpen(s)} onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setOpen(s); } }}>
        <div className="rv-media single hair">
          {/* cards get a 600px poster (phones 400px); the full 848×1498 frame is only the video's poster in the modal */}
          <picture className="rv-pic">
            {near && <source media="(max-width: 759px)" srcSet={s.poster.replace(/\.jpg$/, "-sm.jpg")} />}
            <img className="rv-thumb" src={near ? s.poster.replace(/\.jpg$/, "-md.jpg") : undefined} alt="" loading="lazy" decoding="async" />
          </picture>
          {/* the play button sits on the video itself; the whole card opens it */}
          <button type="button" className="sprout btn icon orange rv-playbtn" tabIndex={-1} aria-hidden="true" onClick={(e) => { e.stopPropagation(); setOpen(s); }}><Play /></button>
        </div>
        <div className="rv-id">
          <span className="rv-logo single hair"><img src={near ? s.logo : undefined} alt="" /></span>
          <span className="rv-who"><b>{s.who}</b><small>{s.role}</small></span>
        </div>
      </article>
    ),
  }));

  const clutch = rating("clutch", "https://clutch.co/profile/talkerstein-consulting", REVIEW.rating.toFixed(1), `${REVIEW.count} ratings on Clutch`, `${REVIEW.rating} out of 5`);
  const google = rating("google", GOOGLE.url, GOOGLE.rating ? GOOGLE.rating.toFixed(1) : "–", GOOGLE.count ? `${GOOGLE.count} ratings on Google` : "Rating on Google",
    GOOGLE.rating ? `${GOOGLE.rating} out of 5` : undefined, !GOOGLE.rating);

  const modal = <ReviewVideoModal items={TESTIMONIALS} at={at} setAt={setAt} />;

  // split: the heading and the ratings hold the left column, the cards run off the right edge of the sheet, and the
  // dots under the ratings say where in the row you are (the landing's section 05)
  if (split) return (
    <div className={`rv rv-phone rv-split${cols === 1 ? "" : " rv-desk"}`}>
      <div className="rv-split-l">
        {heading}
        <div className="rv-rates">{clutch.node}{google.node}</div>
        <div className="rv-split-foot">
          <RowDots row={swipe} count={TESTIMONIALS.length} what="testimonial" />
          <RowArrows row={swipe} what="testimonials" />
        </div>
      </div>
      <div ref={swipe} className="rv-swipe" aria-label="Video testimonials">
        {cards.map((t) => <div key={t.key} className="rv-slot">{t.node}</div>)}
      </div>
      {modal}
    </div>
  );

  // one side-swiping row of video cards at every width (desktop pages it with the ‹ › pair, phones swipe with the next card peeking in)
  return (
    <div className={`rv rv-phone${cols === 1 ? "" : " rv-desk"}`}>
      <div className="rv-reels-h">
        {/* the landing's section 05 supplies its own head (components/home/LandingSections.tsx); area pages keep this one */}
        {heading ?? <h2 className="h2 rv-title">Word on the Street</h2>}
        <RowArrows row={swipe} what="testimonials" />
      </div>
      <div className="rv-rates">{clutch.node}{google.node}</div>
      <div ref={swipe} className="rv-swipe" aria-label="Video testimonials">
        {cards.map((t) => <div key={t.key} className="rv-slot">{t.node}</div>)}
      </div>
      {modal}
    </div>
  );
}
