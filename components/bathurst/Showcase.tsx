"use client";

import { useEffect, useRef, useState } from "react";
import { SHOWCASE, type ShowcaseCollection, type ShowcaseModule } from "@/lib/bathurst/showcase";
import { CtaButton, CtaLink } from "@/components/style/Cta";
import RowArrows from "./RowArrows";
import { SHOWCASE_DIAGRAMS } from "./ShowcaseDiagrams";

const book = (service: string) => `/book?${new URLSearchParams({ service })}`;
const Close = () => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>;
const Chev = () => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6l6 6-6 6" /></svg>;

/** a phone recording of the live build being operated; plays only while on screen, never with reduced motion */
function PhoneVideo({ id, label }: { id: string; label: string }) {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = v.current; if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { el.pause(); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) el.play().catch(() => {}); else el.pause(); }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className="u-screen s-stage">
      <div className="s-phone">
        <video ref={v} muted loop playsInline preload="metadata" poster={`/showcase/${id}-poster.webp`} aria-label={label}>
          <source src={`/showcase/${id}.webm`} type="video/webm" />
          <source src={`/showcase/${id}.mp4`} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}

/** the build: the live site operated on a phone (video), a real capture of it (shot), or drawn in the client's branding */
function Screen({ m, big = false }: { m: ShowcaseModule; big?: boolean }) {
  if (m.video) return <PhoneVideo id={m.id} label={`${m.title} on the ${m.clientName} website, used on a phone`} />;
  if (m.shot) return <img className="sc-real" src={`/showcase/${m.id}${big ? "" : "-sm"}.webp`} alt={`${m.title} on the ${m.clientName} website`} loading="lazy" />;
  const D = SHOWCASE_DIAGRAMS[m.id];
  return D ? <D /> : null;
}

/** One collection as its own "What we can do" block (Services.tsx): heading with ‹ ›, its line, a short row of four .cap cards */
function Collection({ c, onOpen }: { c: ShowcaseCollection; onOpen: (m: ShowcaseModule) => void }) {
  const row = useRef<HTMLUListElement>(null);
  return (
    <section id={`sc-${c.id}`} className="section svc-sec sc-sec">
      <div className="wrap">
        <header className="svc-head rv-reels-h">
          <h2 className="h2">{c.title}</h2>
          <RowArrows row={row} what={c.title.toLowerCase()} />
        </header>
        <p className="sc-line">{c.line}</p>
        <ul ref={row} className="tc-row cap-row">
          {c.modules.map((m) => (
            <li key={m.id} id={`sc-${m.id}`}>
              <article className="cap frame sc-card">
                {/* the screen and the title open the explainer; the outline link books it */}
                <button type="button" className="sc-open cap-art" aria-haspopup="dialog" aria-label={`How a ${m.title.toLowerCase()} works`} onClick={() => onOpen(m)}>
                  <Screen m={m} />
                </button>
                <h3 className="cap-t"><button type="button" className="sc-title" aria-haspopup="dialog" onClick={() => onOpen(m)}>{m.title}</button></h3>
                <p className="cap-line">{m.line}</p>
                <ul className="cap-list" aria-label="Built for">{m.who.map((w) => <li key={w}>{w}</li>)}</ul>
                <div className="cap-foot">
                  <CtaButton label={`How a ${m.title.toLowerCase()} works`} small className="cap-see" aria-haspopup="dialog" onClick={() => onOpen(m)}>
                    See more
                  </CtaButton>
                  <CtaLink href={book(m.title)} label={`Ask about a ${m.title.toLowerCase()}`} small className="cap-ask">
                    Ask about this<Chev />
                  </CtaLink>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * Twelve builds in three separate rows: Win, Run and Automate (lib/bathurst/showcase.ts), each on the "What we can do"
 * template, so no row is longer than four cards. Each card shows the build as a working screen in a client's own branding; clicking
 * the screen, the title or "How it works" opens a modal (the reel modal's shell) that explains the build. The modal's
 * "Ask about this" is its one filled CTA; it closes with ✕, Esc or a click outside.
 */
export default function Showcase() {
  const [open, setOpen] = useState<ShowcaseModule | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current; if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {SHOWCASE.map((c) => <Collection key={c.id} c={c} onOpen={setOpen} />)}
      <dialog ref={dialog} className="rv-modal sc-modal" aria-label={open ? open.title : "Feature"}
        onClose={() => setOpen(null)} onClick={(e) => { if (e.target === dialog.current) setOpen(null); }}>
        {open && (
          <div className="rv-modal-in sc-modal-in frame" key={open.id}>
            <button type="button" className="sprout btn icon rv-x" aria-label="Close" onClick={() => setOpen(null)}><Close /></button>
            <figure className="sc-modal-shot">
              <div className="cap-art"><Screen m={open} big /></div>
              <figcaption>{open.video ? `The ${open.clientName} website we built, used on a phone` : open.shot ? `Live on the ${open.clientName} website we built` : `Shown in ${open.clientName}’s branding`}</figcaption>
            </figure>
            <div className="sc-modal-text">
              <h3 className="sc-modal-t">{open.title}</h3>
              <p className="sc-modal-d">{open.detail}</p>
              <ul className="cap-list">{open.points.map((p) => <li key={p}>{p}</li>)}</ul>
              <p className="sc-modal-who"><b>Built for</b> {open.who.join(" · ")}</p>
              <CtaLink href={book(open.title)} label={`Ask about a ${open.title.toLowerCase()}`} className="dc-go sc-modal-cta">
                Ask about this<Chev />
              </CtaLink>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
