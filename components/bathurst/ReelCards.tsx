"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { CONTACT } from "@/lib/bathurst/data";
import RowArrows from "./RowArrows";
import REELS from "@/lib/bathurst/reels.json";

type Reel = (typeof REELS)[number];

const Play = () => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>;
const Close = () => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>;
const Ig = () => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".6" /></svg>;

/**
 * "From our Instagram": TCG's sit-down reels as a row of trading cards that bleeds edge to edge and scrolls sideways
 * (same row logic as Services). A card: brand banner and number, the reel's poster in an art window, guest and
 * category, a two-line caption, a foil sheen that follows the pointer. A click plays the reel in a modal.
 * Posters, captions and videos: scripts/fetch-reels.mjs.
 */
export default function ReelCards() {
  const [open, setOpen] = useState<Reel | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const row = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const d = dialog.current; if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  // the foil and a slight tilt follow the pointer across the card
  const tilt = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    e.currentTarget.style.setProperty("--mx", `${x * 100}%`); e.currentTarget.style.setProperty("--my", `${y * 100}%`);
    e.currentTarget.style.setProperty("--rx", `${(0.5 - y) * 8}deg`); e.currentTarget.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
  };
  const untilt = (e: PointerEvent<HTMLButtonElement>) => { ["--rx", "--ry"].forEach((k) => e.currentTarget.style.setProperty(k, "0deg")); };

  return (
    <section className="rv-reels tc-sec" aria-label="Businesses in Bathurst: interviews on Instagram">
      <div className="rv-reels-h">
        <h2 className="h2">Businesses in Bathurst</h2>
        <RowArrows row={row} what="interviews" />
      </div>
      <ul ref={row} className="tc-row">
        {REELS.map((r, i) => (
          <li key={r.id}>
            <button type="button" className="tc" onClick={() => setOpen(r)} onPointerMove={tilt} onPointerLeave={untilt}
              aria-label={`Play the reel with ${r.guest}, ${r.brand}`} style={{ "--rx": "0deg", "--ry": "0deg" } as CSSProperties}>
              <span className="tc-in">
                <span className="tc-top"><b>{r.brand}</b><span className="tc-no">{String(i + 1).padStart(2, "0")}/{String(REELS.length).padStart(2, "0")}</span></span>
                <span className="tc-art">
                  <img src={r.poster} alt="" loading="lazy" decoding="async" />
                  <span className="sprout btn icon orange tc-play"><Play /></span>
                  <span className="tc-kind">{r.kind}</span>
                </span>
                <span className="tc-name">{r.guest}</span>
                <span className="tc-cap">{r.caption}</span>
                <span className="tc-foot"><Ig /><span>Sit-down series</span><span className="tc-set">TCG</span></span>
              </span>
              <span className="tc-foil" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      {/* after the interviews: follow the account for the next ones */}
      <div className="tc-foot-cta">
        <a className="sprout btn orange tc-follow" href={CONTACT.instagram} target="_blank" rel="noopener" aria-label="Follow us on Instagram, @talkersteinconsulting">
          <Ig /><span>Follow us on Instagram</span>
        </a>
      </div>

      <dialog ref={dialog} className="rv-modal tc-modal" aria-label={open ? `Reel: ${open.brand}` : "Reel"}
        onClose={() => setOpen(null)} onClick={(e) => { if (e.target === dialog.current) setOpen(null); }}>
        {open && (
          <div className="rv-modal-in frame" key={open.id}>
            <button type="button" className="sprout btn icon rv-x" aria-label="Close" onClick={() => setOpen(null)}><Close /></button>
            <div className="rv-modal-video single hair">
              <video src={open.video} poster={open.poster} controls playsInline autoPlay />
            </div>
            <div className="rv-modal-text">
              <div className="tc-mh"><small>{open.kind} · Sit-down series</small><b>{open.brand}</b><span>{open.guest}</span></div>
              <p className="tc-mcap">{open.caption}</p>
              <a className="sprout btn tc-ig" href={`https://www.instagram.com/reel/${open.id}/`} target="_blank" rel="noopener"><Ig /><span>Watch on Instagram</span></a>
            </div>
          </div>
        )}
      </dialog>
    </section>
  );
}
