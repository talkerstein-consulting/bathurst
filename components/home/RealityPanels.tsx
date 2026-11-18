"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import "@/app/landing.css";

/**
 * 03 · The Reality. A split section: the heading holds still on the left while the three ways a business loses the
 * sale move past under it, one at a time, and the diagram on the right changes with whichever one is being read.
 *
 * Pinned by hand, like components/home/LeadSystem.tsx: this page's sheet (.cover) is a transformed, clipped box, so
 * `position: sticky` and `fixed` have no viewport to hold against. The stage is translated by exactly how far its
 * track has scrolled past, which holds it still on screen for the length of the track.
 *
 * One scroll progress (0 → 1) drives everything: it picks the active item, slides the list so that item sits at the
 * top of the column, and crossfades the diagram beside it.
 *
 * Narrow screens drop the track, the pin and the slide: every item is shown in full, each above its own diagram.
 *
 * LOW FIDELITY — the diagrams are grey placeholder schematics. Replace .rp-fig-* with the real drawings; the pin,
 * the list and the crossfade can stay as they are.
 */

/** Lucide-shaped line icons on the 24px grid (STYLE.md: line only, round caps, currentColor). */
const ICONS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  monitor: <><rect x="2.5" y="3.5" width="19" height="13" rx="2" /><path d="M8 20.5h8M12 16.5v4" /></>,
  inbox: <><path d="M3.5 12.5h4l1.5 3h6l1.5-3h4" /><path d="M5.2 5.6a1.5 1.5 0 011.4-1.1h10.8a1.5 1.5 0 011.4 1.1l2.2 6.9v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4z" /></>,
} as const;

const Icon = ({ g, className }: { g: keyof typeof ICONS; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICONS[g]}</svg>
);

const ITEMS = [
  {
    icon: "search" as const,
    title: "You’re hard to find.",
    body: "Customers can’t choose your business if they don’t come across it when they’re looking.",
  },
  {
    icon: "monitor" as const,
    title: "Your website isn’t convincing them.",
    body: "Visitors leave when they can’t quickly understand what makes your business worth choosing.",
  },
  {
    icon: "inbox" as const,
    title: "Inquiries aren’t turning into sales.",
    body: "Slow responses, scattered messages, and inconsistent follow-ups can leave good opportunities behind.",
  },
];

/** The placeholder diagram for each item: a rough schematic, enough to read as three different pictures. */
function Figure({ at }: { at: number }) {
  return (
    <div className="rp-fig" aria-hidden="true">
      {/* 01 · a result list where the business is nowhere near the top */}
      <div className={`rp-fig-in${at === 0 ? " on" : ""}`}>
        <span className="rp-bar rp-bar-q" />
        {[0, 1, 2, 3].map((i) => <span key={i} className="rp-row" />)}
        <span className="rp-row is-you"><i /></span>
      </div>
      {/* 02 · a page whose message and action never land */}
      <div className={`rp-fig-in${at === 1 ? " on" : ""}`}>
        <span className="rp-win">
          <span className="rp-win-bar" />
          <span className="rp-blk rp-blk-lg" />
          <span className="rp-blk" />
          <span className="rp-blk rp-blk-sm" />
          <span className="rp-cta is-weak" />
        </span>
      </div>
      {/* 03 · inquiries arriving and going nowhere */}
      <div className={`rp-fig-in${at === 2 ? " on" : ""}`}>
        <span className="rp-flow">
          {[0, 1, 2].map((i) => <span key={i} className="rp-note" style={{ "--i": i } as CSSProperties} />)}
          <span className="rp-gap" />
          <span className="rp-drop" />
        </span>
      </div>
    </div>
  );
}

export default function RealityPanels() {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const [at, setAt] = useState(0);
  const [flat, setFlat] = useState(true);   // narrow screens: no track, no pin, every item in full

  useEffect(() => {
    const m = matchMedia("(min-width: 900px)");
    const set = () => setFlat(!m.matches);
    set();
    m.addEventListener("change", set);
    return () => m.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    const el = track.current, st = stage.current;
    if (!el || !st) return;
    // flat: nothing is pinned or slid, and each item renders its own diagram, so `at` is not read
    if (flat) { st.style.removeProperty("--pin"); list.current?.style.removeProperty("--slide"); return; }
    let raf = 0;
    let shown = -1;   // the index the list is parked on, so the slide is only rewritten when it actually changes
    const measure = () => {
      const r = el.getBoundingClientRect();
      // nowhere near the screen: nothing to pin, and no reason to keep writing styles
      if (r.bottom < -400 || r.top > innerHeight + 400) return;
      const travel = r.height - innerHeight;
      if (travel <= 0) { st.style.setProperty("--pin", "0px"); return; }
      const past = Math.min(travel, Math.max(0, -r.top));
      // The pin is written straight to the DOM, never through React state: state lands a frame late, so the stage
      // would paint unpinned for one frame on every scroll and snap back on the next — a visible jump the size of
      // the scroll delta. The active index below can afford that frame; the transform cannot.
      st.style.setProperty("--pin", `${past}px`);
      const p = travel ? past / travel : 0;
      const i = Math.min(ITEMS.length - 1, Math.floor(p * ITEMS.length));
      if (i !== shown) {
        shown = i;
        const target = list.current?.children[i] as HTMLElement | undefined;
        list.current?.style.setProperty("--slide", `${target ? target.offsetTop : 0}px`);
        setAt(i);
      }
    };
    // Re-measured every frame rather than on the scroll event. The track sits inside the map's sheet (.cover), and
    // the engine moves that sheet from its own handler, so a rect read taken while handling `scroll` can still be
    // the sheet's previous position — the stage would then be pinned to where the track *was*, one step behind, for
    // as long as the page keeps scrolling. A frame loop always reads the position that was actually laid out, and
    // corrects on the very next frame instead of waiting for another scroll event.
    const frame = () => { measure(); raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [flat]);

  return (
    <section id="reality" className="section hs rp" aria-label="Getting attention is only half the job">
      <div className={flat ? "rp-track is-flat" : "rp-track"} ref={track}>
        <div className="rp-stage" ref={stage}>
          {/* left half: the heading holds still, the three items move past under it */}
          <div className="rp-left">
            <header className="rp-head">
              <p className="eyebrow rp-eyebrow">The reality</p>
              <h2 className="h2 lp-h">Getting attention is only half the job.</h2>
              <p className="lp-lead">
                A potential customer finds your business. Can they understand what you offer, trust what they see, and
                easily get in touch? Small gaps in your digital presence can cost you the sale.
              </p>
            </header>
            <div className="rp-viewport">
              <ol className="rp-list" ref={list}>
                {ITEMS.map((item, i) => (
                  <li key={item.title} className={`rp-item${i === at ? " is-on" : ""}`}>
                    <h3 className="rp-t"><Icon g={item.icon} className="rp-i" />{item.title}</h3>
                    <p className="rp-b">{item.body}</p>
                    {/* phones show each item's own diagram with it; the pinned one is for the split layout */}
                    {flat && <div className="rp-fig-flat"><Figure at={i} /></div>}
                  </li>
                ))}
              </ol>
            </div>
          </div>
          {/* right half: the diagram for whichever item is being read */}
          {!flat && <div className="rp-right"><Figure at={at} /></div>}
        </div>
      </div>
    </section>
  );
}
