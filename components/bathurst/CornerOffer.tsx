"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The corner offer, after vacation.inc's: a small right triangle in the bottom-right corner, shown while the
 * footer is on screen. Click opens a coupon modal (dashed cut line, serial, barcode, image slot) with an email intake;
 * the × on the ribbon hides it for good (remembered per browser).
 * TODO(content): confirm the offer and its terms; TODO(integration): send the email to the list and the code.
 */
const HIDE_KEY = "tcg-offer-hidden";
const SERIAL = "043718";
// a fixed barcode (deterministic bar widths), purely decorative
const BARS = Array.from({ length: 46 }, (_, i) => 1 + ((i * 7 + (i % 5) * 3) % 4));

export default function CornerOffer() {
  const [hidden, setHidden] = useState(true);
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const modal = useRef<HTMLDivElement>(null);
  const [atFooter, setAtFooter] = useState(false);
  // other CTAs (the hero's Book a free call) open this modal: window.dispatchEvent(new Event("tcg:offer"))
  useEffect(() => { const on = () => setOpen(true); addEventListener("tcg:offer", on); return () => removeEventListener("tcg:offer", on); }, []);
  useEffect(() => { try { setHidden(localStorage.getItem(HIDE_KEY) === "1"); } catch { setHidden(false); } }, []);
  // the corner only shows while the footer is on screen
  useEffect(() => {
    let io: IntersectionObserver | null = null, t = 0;
    const watch = () => { const f = document.getElementById("site-footer"); if (!f) { t = window.setTimeout(watch, 500); return; }
      io = new IntersectionObserver(([e]) => setAtFooter(e.isIntersecting), { threshold: 0.15 }); io.observe(f); };
    watch();
    return () => { clearTimeout(t); io?.disconnect(); };
  }, []);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => input.current?.focus(), 250);
    // dialog conventions: Escape closes, Tab stays inside, focus returns to the corner on close
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return setOpen(false);
      if (e.key !== "Tab" || !modal.current) return;
      const f = modal.current.querySelectorAll<HTMLElement>("button, input");
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    addEventListener("keydown", onKey);
    const back = opener.current;
    return () => { clearTimeout(t); removeEventListener("keydown", onKey); back?.focus(); };
  }, [open]);
  const dismiss = () => { setHidden(true); try { localStorage.setItem(HIDE_KEY, "1"); } catch {} };

  let x = 0;
  return (
    <>
      {!hidden && (
        <div className={`offer-corner${atFooter ? " on" : ""}`} aria-hidden={!atFooter}>
          {/* a small right triangle tucked into the corner */}
          <button ref={opener} type="button" className="offer-tri" onClick={() => setOpen(true)} aria-haspopup="dialog" tabIndex={atFooter ? 0 : -1}><span className="offer-lbl"><span className="l1">Get</span><span className="l2">10% off</span></span></button>
          <button type="button" className="offer-x" onClick={dismiss} aria-label="Hide the offer" tabIndex={atFooter ? 0 : -1}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      )}
      <div className={`offer-scrim${open ? " on" : ""}`} onClick={() => setOpen(false)} aria-hidden={!open}>
        <div ref={modal} className="offer-modal" role="dialog" aria-modal="true" aria-label="Get 10% off your first project" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="offer-close" onClick={() => setOpen(false)} aria-label="Close">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          {/* the coupon: a dashed cut line around it, like a clipped newspaper offer */}
          <div className="coupon">
            <div className="coupon-img">
              {/* TODO(content): coupon photo */}
              <img src="/brand/tcg-icon.svg" alt="" />
            </div>
            <div className="coupon-copy">
              <div className="coupon-top"><span>Sign up and get</span><small>No. {SERIAL}</small></div>
              <b className="coupon-big">10% off</b>
              <span className="coupon-sub">your first project</span>
              <div className="coupon-foot">
                <p>This introductory offer applies once per business to a first engagement with Talkerstein Consulting Group. Not combinable with other offers. Terms may change; ask us for details.</p>
                <svg className="barcode" viewBox={`0 0 ${BARS.reduce((a, b) => a + b + 1, 0)} 40`} preserveAspectRatio="none" aria-hidden="true">
                  {BARS.map((w, i) => { const r = <rect key={i} x={x} y="0" width={i % 3 === 2 ? 1 : w} height={i % 9 === 0 ? 40 : 34} />; x += w + 1; return r; })}
                </svg>
              </div>
            </div>
          </div>
          {sent ? (
            <p className="offer-done"><b>You’re in.</b> Mention code <b>TCG{SERIAL}</b> when you book your first project.</p>
          ) : (
            <form className="offer-form" onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
              <input ref={input} type="email" required placeholder="Email address" aria-label="Email address" autoComplete="email" />
              <button type="submit" className="sprout" data-no-tumble>Continue</button>
            </form>
          )}
          <p className="offer-fine">Sign up with your email to receive the discount code straight to your inbox. By subscribing, you agree to receive occasional emails from Talkerstein Consulting Group. You can unsubscribe at any time.</p>
        </div>
      </div>
    </>
  );
}
