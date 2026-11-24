"use client";

import { useEffect, useRef } from "react";
import { TESTIMONIALS } from "@/lib/bathurst/data";

type Item = (typeof TESTIMONIALS)[number];

const Prev = () => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>;
const Next = () => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>;
const Close = () => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>;

/**
 * The testimonial video and the quote in full, in a native modal dialog (top layer, so neither the cover sheet's
 * transform nor the sentence stage's clips it).
 *
 * One component for every place a review can be opened from: the row of cards in 05 · Testimonials
 * (components/bathurst/Testimonials.tsx) and the fanned-out trading cards over the sentence
 * (components/home/ReviewFan.tsx). The caller owns which review is open (`at`, an index into `items`); this holds
 * the dialog, the keyboard, the page lock and the roll-on to the next one when a video ends.
 */
export default function ReviewVideoModal({
  items, at, setAt, label = "Video testimonial",
}: { items: Item[]; at: number | null; setAt: (i: number | null) => void; label?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const open: Item | null = at === null ? null : items[at] ?? null;
  const step = (d: number) => { if (at !== null) setAt((at + d + items.length) % items.length); };

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
  }, [at, items.length]);

  return (
    <dialog ref={dialog} className="rv-modal" aria-label={open ? `Video testimonial from ${open.who}` : label}
      onClose={() => setAt(null)} onClick={(e) => { if (e.target === dialog.current) setAt(null); }}>
      {open && (
        <div className="rv-modal-in frame" key={open.id}>
          <button type="button" className="sprout btn icon rv-x" aria-label="Close" onClick={() => setAt(null)}><Close /></button>
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
                {items.map((t, i) => (
                  <button type="button" key={t.id} className={i === at ? "on" : ""} aria-label={`${t.who}${i === at ? " (playing)" : ""}`} aria-current={i === at || undefined} onClick={() => setAt(i)} />
                ))}
              </span>
              <button type="button" className="sprout btn icon" aria-label="Next testimonial" onClick={() => step(1)}><Next /></button>
            </nav>
          </div>
        </div>
      )}
    </dialog>
  );
}
