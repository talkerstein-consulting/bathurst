"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import "@/app/landing.css";

/**
 * 04 · The Transformation. The heading sits off to the right over empty space, then the section splits: a short list
 * of the three steps holds still on the left while their content scrolls past on the right, and the step being read
 * is the one marked on the list.
 *
 * This is the opposite mechanism to 03 (components/home/RealityPanels.tsx), where the content was pinned and swapped
 * in place. Here only the list is pinned; the blocks beside it scroll normally, so the section is as tall as its
 * content rather than as tall as an invented track.
 *
 * Pinned by hand, and re-measured every frame: this page's sheet (.cover) is a transformed box that the map engine
 * moves from its own scroll handler, so `position: sticky` has no viewport to hold against and a rect read taken
 * while handling `scroll` can still be the sheet's previous position. See RealityPanels for the same note.
 *
 * LOW FIDELITY — the figures are grey placeholder schematics. Replace .tp-fig with the real screens.
 */

const STEPS = [
  {
    nav: "Get noticed",
    title: "Get noticed.",
    body: "Reach the people looking for what you offer through better marketing and search visibility.",
  },
  {
    nav: "Make the right impression",
    title: "Make the right impression.",
    body: "Give potential customers a website that communicates your value and makes taking action easy.",
  },
  {
    nav: "Keep opportunities moving",
    title: "Keep opportunities moving.",
    body: "Capture inquiries, organize leads, and automate follow-ups so fewer opportunities get overlooked.",
  },
];

/** Placeholder screens, one per step — enough shape to read as three different pictures. */
function Figure({ i }: { i: number }) {
  return (
    <div className="tp-fig" aria-hidden="true">
      <span className="tp-fig-bar"><i /><i /><i /></span>
      <div className="tp-fig-body">
        {i === 0 && <>
          <span className="tp-ph tp-ph-field" />
          {[0, 1, 2].map((k) => <span key={k} className="tp-ph tp-ph-row" />)}
          <span className="tp-ph tp-ph-row is-top"><em /></span>
        </>}
        {i === 1 && <>
          <span className="tp-ph tp-ph-hero" />
          <span className="tp-ph tp-ph-line" />
          <span className="tp-ph tp-ph-line is-short" />
          <span className="tp-ph tp-ph-cta" />
        </>}
        {i === 2 && <>
          {[0, 1, 2].map((k) => (
            <span key={k} className="tp-ph tp-ph-lead" style={{ "--i": k } as CSSProperties}><i /><em /></span>
          ))}
          <span className="tp-ph tp-ph-auto" />
        </>}
      </div>
    </div>
  );
}

export default function TransformPanels() {
  const body = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const blocks = useRef<HTMLOListElement>(null);
  const [at, setAt] = useState(0);
  const [flat, setFlat] = useState(true);

  useEffect(() => {
    const m = matchMedia("(min-width: 900px)");
    const set = () => setFlat(!m.matches);
    set();
    m.addEventListener("change", set);
    return () => m.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    const b = body.current, r = rail.current, ol = blocks.current;
    if (!b || !r || !ol) return;
    if (flat) { r.style.removeProperty("--pin"); return; }
    let raf = 0;
    let shown = -1;
    const TOP = 140;   // where the list parks below the top of the screen
    const measure = () => {
      const rect = b.getBoundingClientRect();
      if (rect.bottom < -400 || rect.top > innerHeight + 400) return;
      // the list holds at TOP for as long as the column beside it has content left to scroll
      const span = rect.height - r.offsetHeight;
      const pin = Math.min(Math.max(0, span), Math.max(0, TOP - rect.top));
      r.style.setProperty("--pin", `${pin}px`);
      // the step being read is the last one whose top has passed the reading line
      const line = innerHeight * 0.42;
      let i = 0;
      const navs = r.querySelectorAll<HTMLElement>(".tp-nav");
      for (let k = 0; k < ol.children.length; k += 1) {
        const bk = (ol.children[k] as HTMLElement).getBoundingClientRect();
        if (bk.top <= line) i = k;
        // the rule under each label fills with how far the reader has come through that block
        const p = Math.min(1, Math.max(0, (line - bk.top) / Math.max(1, bk.height)));
        navs[k]?.style.setProperty("--p", p.toFixed(3));
      }
      if (i !== shown) { shown = i; setAt(i); }
    };
    const frame = () => { measure(); raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [flat]);

  const go = (i: number) => {
    const el = blocks.current?.children[i] as HTMLElement | undefined;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollBy({ top: el.getBoundingClientRect().top - 160, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section id="transformation" className="section hs tp" aria-label="Make every part of your digital presence work harder">
      <div className="tp-wrap">
        {/* the heading sits in the right-hand column, over the empty half */}
        <header className="tp-head">
          <p className="eyebrow tp-eyebrow">The transformation</p>
          <h2 className="h2 lp-h">Make every part of your digital presence work harder.</h2>
          <p className="lp-lead">
            From the first time someone discovers your business to the moment they become a customer, every
            interaction matters.
          </p>
        </header>

        <div className="tp-body" ref={body}>
          {/* left: the three steps, held still while the blocks beside them scroll */}
          <nav className="tp-rail" ref={rail} style={{ "--pin": "0px" } as CSSProperties} aria-label="The three steps">
            <ul>
              {STEPS.map((s, i) => (
                <li key={s.nav}>
                  <button type="button" className={i === at ? "tp-nav is-on" : "tp-nav"}
                    aria-current={i === at || undefined} onClick={() => go(i)}>{s.nav}</button>
                </li>
              ))}
            </ul>
          </nav>

          {/* right: the content for each step, one after another */}
          <ol className="tp-blocks" ref={blocks}>
            {STEPS.map((s, i) => (
              <li key={s.title} className="tp-block">
                <h3 className="tp-t">{s.title}</h3>
                <p className="tp-b">{s.body}</p>
                <Figure i={i} />
              </li>
            ))}
          </ol>
        </div>

      </div>
    </section>
  );
}
