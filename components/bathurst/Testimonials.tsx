"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { GOOGLE, REVIEW, TESTIMONIALS } from "@/lib/bathurst/data";
import ReelCards from "./ReelCards";

type Item = (typeof TESTIMONIALS)[number];
type Tile = { key: string; weight: number; node: ReactNode; rating?: boolean };

/** Share of its column each video card takes; cycles so neighbouring columns stagger like a masonry wall. */
const WEIGHTS = [7, 6, 5, 6, 7, 5, 6];

/** The hover teaser: the quote cut at a word boundary with an ellipsis (the whole testimonial is in the modal). */
const teaser = (q: string, n = 110) => (q.length <= n ? q : q.slice(0, q.lastIndexOf(" ", n)).replace(/[\s,.;:!?-]+$/, "") + "…");

const Play = () => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>;
const Prev = () => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>;
const Next = () => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>;
const Close = () => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>;

/**
 * Reviews on the cover sheet (STYLE.md: Sea Breeze surfaces, double-line frames, outline CTAs).
 * A masonry wall of framed video cards with the two ratings as tiles in it; every column stretches to the same
 * height (flat bottom edge). A card: the video's own poster in a hairline frame, then one row with the logo,
 * name and position, and the outline play button. On hover the quote shows, truncated, over the poster's foot.
 * Play opens a dialog with the video and the whole testimonial. Only real quotes are shown.
 */
export default function Testimonials() {
  const [cols, setCols] = useState(3);
  const [at, setAt] = useState<number | null>(null);
  const open: Item | null = at === null ? null : TESTIMONIALS[at];
  const setOpen = (s: Item | null) => setAt(s ? TESTIMONIALS.indexOf(s) : null);
  const step = (d: number) => setAt((i) => (i === null ? i : (i + d + TESTIMONIALS.length) % TESTIMONIALS.length));
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const m = matchMedia("(max-width: 759px)"), set = () => setCols(m.matches ? 1 : 3);   // 1 = the phone layout
    set(); m.addEventListener("change", set); return () => m.removeEventListener("change", set);
  }, []);
  useEffect(() => {
    const d = dialog.current; if (!d) return;
    if (open && !d.open) { d.showModal(); video.current?.play().catch(() => {}); }
    if (!open && d.open) d.close();
    // the page underneath stays put while the dialog is up
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);
  // ← / → move between testimonials while the dialog is open
  useEffect(() => {
    if (at === null) return;
    const k = (e: KeyboardEvent) => { if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }, [at]);

  const rating = (key: string, href: string, score: string, label: string, stars: string | undefined, muted = false): Tile => ({
    key, weight: 0, rating: true,
    node: (
      <a className="rv-score rv-tile frame" href={href} target="_blank" rel="noopener">
        <b>{score}</b>
        <span><span className={`stars${muted ? " muted" : ""}`} aria-label={stars}>★★★★★</span><small>{label}</small></span>
      </a>
    ),
  });

  const cards: Tile[] = TESTIMONIALS.map((s, i) => ({
    key: s.id, weight: WEIGHTS[i % WEIGHTS.length],
    node: (
      <article className="rv-card rv-tile frame" tabIndex={0} role="button" data-sprout-host aria-label={`Play video from ${s.who}, ${s.role}`}
        onClick={() => setOpen(s)} onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setOpen(s); } }}>
        <div className="rv-media single hair">
          {/* cards get a 600px poster (phones 400px); the full 848×1498 frame is only the video's poster in the modal */}
          <picture className="rv-pic">
            <source media="(max-width: 759px)" srcSet={s.poster.replace(/\.jpg$/, "-sm.jpg")} />
            <img className="rv-thumb" src={s.poster.replace(/\.jpg$/, "-md.jpg")} alt="" loading="lazy" decoding="async" />
          </picture>
          <p className="rv-quote">“{teaser(s.quote)}”</p>
        </div>
        <div className="rv-id">
          <span className="rv-logo single hair"><img src={s.logo} alt="" /></span>
          <span className="rv-who"><b>{s.who}</b><small>{s.role}</small></span>
          <button type="button" className="sprout btn icon rv-playbtn" tabIndex={-1} aria-hidden="true" onClick={(e) => { e.stopPropagation(); setOpen(s); }}><Play /></button>
        </div>
      </article>
    ),
  }));

  const clutch = rating("clutch", "https://clutch.co/profile/talkerstein-consulting", REVIEW.rating.toFixed(1), `${REVIEW.count} ratings on Clutch`, `${REVIEW.rating} out of 5`);
  const google = rating("google", GOOGLE.url, GOOGLE.rating ? GOOGLE.rating.toFixed(1) : "–", GOOGLE.count ? `${GOOGLE.count} ratings on Google` : "Rating on Google",
    GOOGLE.rating ? `${GOOGLE.rating} out of 5` : undefined, !GOOGLE.rating);

  const modal = (
    <>
      {/* the video with the rest of the testimonial; a native modal dialog (top layer, so the sheet's transform never clips it) */}
      <dialog ref={dialog} className="rv-modal" aria-label={open ? `Video testimonial from ${open.who}` : "Video testimonial"}
        onClose={() => setOpen(null)} onClick={(e) => { if (e.target === dialog.current) setOpen(null); }}>
        {open && (
          <div className="rv-modal-in frame" key={open.id}>
            <button type="button" className="sprout btn icon rv-x" aria-label="Close" onClick={() => setOpen(null)}><Close /></button>
            <div className="rv-modal-video single hair">
              <video ref={video} src={open.video} poster={open.poster} controls playsInline autoPlay onEnded={() => step(1)} />
            </div>
            <div className="rv-modal-text">
              <div className="rv-id">
                <span className="rv-logo single hair"><img src={open.logo} alt="" /></span>
                <span className="rv-who"><b>{open.who}</b><small>{open.role}</small></span>
              </div>
              <blockquote className="rv-full">“{open.quote}”</blockquote>
              {/* move through every testimonial without closing; a video that finishes rolls on to the next */}
              <nav className="rv-nav" aria-label="More testimonials">
                <button type="button" className="sprout btn icon" aria-label="Previous testimonial" onClick={() => step(-1)}><Prev /></button>
                <span className="rv-dots" aria-live="polite">
                  {TESTIMONIALS.map((t, i) => (
                    <button type="button" key={t.id} className={i === at ? "on" : ""} aria-label={`${t.who}${i === at ? " (playing)" : ""}`} aria-current={i === at || undefined} onClick={() => setAt(i)} />
                  ))}
                </span>
                <button type="button" className="sprout btn icon" aria-label="Next testimonial" onClick={() => step(1)}><Next /></button>
              </nav>
            </div>
          </div>
        )}
      </dialog>
    </>
  );

  // TCG's Instagram reels, as trading cards (components/bathurst/ReelCards.tsx)
  const reels = <ReelCards />;

  // phones: the ratings side by side, then one swipeable row of full-size video cards
  if (cols === 1) return (
    <div className="rv rv-phone">
      <div className="rv-rates">{clutch.node}{google.node}</div>
      <div className="rv-swipe" aria-label="Video testimonials">
        {cards.map((t) => <div key={t.key} className="rv-slot">{t.node}</div>)}
      </div>
      {reels}
      {modal}
    </div>
  );

  // deal the cards into columns, then give the ratings to the shortest columns (Clutch on top, Google mid-way)
  const columns: Tile[][] = Array.from({ length: cols }, () => []);
  cards.forEach((c, i) => columns[i % cols].push(c));
  const short = columns.map((c, i) => [c.length, i]).sort((a, b) => a[0] - b[0] || b[1] - a[1]).map(([, i]) => i);
  columns[short[0]].unshift(clutch);
  columns[short[1]].splice(1, 0, google);

  return (
    <div className="rv">
      <div className="rv-wall" style={{ "--cols": cols } as CSSProperties} aria-label="Video testimonials">
        {columns.map((col, c) => (
          <div className="rv-col" key={c}>
            {col.map((t) => (
              <div key={t.key} className={`rv-cell${t.rating ? " rating" : ""}`} style={t.rating ? undefined : { flexGrow: t.weight }}>{t.node}</div>
            ))}
          </div>
        ))}
      </div>

      {reels}
      {modal}
    </div>
  );
}
