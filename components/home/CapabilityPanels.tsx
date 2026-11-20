"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { CAPABILITY_FIGURES } from "./Interfaces";
import { Face, Frame } from "./RealityCards";
import { REVIEW_SET } from "./ReviewFan";
import { getReviewFocus } from "./reviewFocus";
import "@/app/landing.css";

/**
 * 06 · What We Do — the hand-off out of the reviews.
 *
 *   left    the three capabilities, one at a time: the name, the title, the line and the services under it. The
 *           column steps from one to the next as you scroll, and snaps — it never sits between two of them.
 *   right   one drawn interface, pinned, that morphs into the next capability's as the text on its left changes.
 *
 * The right-hand panel holds still for the whole section, so the change reads as one thing turning over rather
 * than three sections going past; the figure is the same furniture §03's cards show not working, so this answers
 * those. (The diagram itself is still the low-fidelity drawing in components/home/Interfaces.tsx — TBD.)
 *
 * Pinned by hand and re-measured every frame, for the same reasons as components/home/RealityPanels.tsx: this page's
 * sheet (.cover) is a transformed box the map engine moves from its own scroll handler, so `position: sticky` has no
 * viewport to hold against and a rect read taken while handling `scroll` can be a frame behind.
 */


/* The services are set as bullets rather than run together in a sentence: it is a list of things offered, and
   someone scanning for one of them should not have to read a paragraph to find it. The lists are the brief's. */
const CAPABILITIES = [
  {
    name: "Growth",
    title: "Bring more customers\ninto the picture.",
    body: "So the people already looking for what you offer actually find you.",
    items: ["Marketing strategy", "Content campaigns", "Search engine optimization", "Email marketing", "Digital advertising"],
  },
  {
    name: "Digital Experiences",
    title: "Give customers a better\nreason to choose you.",
    body: "So your offer is easy to understand and easy to act on.",
    items: ["Business websites", "Custom development", "Shopify stores", "Web applications", "Conversion-focused landing pages"],
  },
  {
    name: "Technology & Systems",
    title: "Make it easier\nto manage the business.",
    body: "So scattered tools come together in one place.",
    items: ["AI implementation", "CRM systems", "Workflow automation", "Business integrations", "Custom business tools"],
  },
];

/** The drawn interface for a capability (components/home/Interfaces.tsx). */
const Figure = ({ i }: { i: number }) => {
  const Fig = CAPABILITY_FIGURES[i];
  return <div className="cp-fig" aria-hidden="true"><Fig /></div>;
};

const easeOut = (x: number) => 1 - (1 - x) ** 3;

/* whether we are past hydration: the card in flight is portalled to the body, which there is no document for on
   the server. Read as an external store rather than set from an effect — the answer comes from outside React. */
const noop = () => () => {};
const onClient = () => true, onServer = () => false;

/* the review card's own shape in the fan (app/sentence.css: .rvf-card is 400px wide and the frame is 63/88),
   so the flight can start exactly on the card the reader is looking at rather than near it */
const FAN_W = 400, FAN_RATIO = 88 / 63;

export default function CapabilityPanels() {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);   // where the diagram's card rests, once the stage is pinned
  const reel = useRef<HTMLOListElement>(null);   // the column of capabilities, moved by hand so one sits centred
  const fly = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const [flat, setFlat] = useState(true);
  const [flown, setFlown] = useState<number | null>(null);   // which review is making the crossing
  const mounted = useSyncExternalStore(noop, onClient, onServer);   // the card in flight waits for the client

  useEffect(() => {
    const m = matchMedia("(min-width: 900px)");
    const set = () => setFlat(!m.matches);
    set();
    m.addEventListener("change", set);
    return () => m.removeEventListener("change", set);
  }, []);

  // the column is moved by hand rather than by whole windows, because the three blocks are not the same height
  // and the one being read has to sit in the middle of the window with its neighbours showing past it. Measured
  // from the blocks themselves, and again on a resize, so it stays centred however the text wraps.
  useEffect(() => {
    const ol = reel.current;
    if (!ol) return;
    if (flat) { ol.style.removeProperty("--shift"); return; }
    const place = () => {
      const row = ol.children[at] as HTMLElement | undefined;
      if (!row) return;
      const win = ol.parentElement;   // the window is the wrapper: the list itself is as tall as its blocks
      if (!win) return;
      const mid = row.offsetTop + row.offsetHeight / 2;
      ol.style.setProperty("--shift", `${(win.clientHeight / 2 - mid).toFixed(1)}px`);
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(ol);
    if (ol.parentElement) ro.observe(ol.parentElement);
    for (const c of ol.children) ro.observe(c);
    return () => ro.disconnect();
  }, [at, flat]);

  useEffect(() => {
    const el = track.current, st = stage.current;
    if (!el || !st) return;
    if (flat) { st.style.removeProperty("--pin"); return; }
    let raf = 0;
    let shown = -1;
    let held: number | null = null;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -400 || r.top > innerHeight + 400) return;
      const travel = r.height - innerHeight;
      if (travel <= 0) { st.style.setProperty("--pin", "0px"); return; }
      const past = Math.min(travel, Math.max(0, -r.top));
      st.style.setProperty("--pin", `${past}px`);   // straight to the DOM: state would land a frame late
      const i = Math.min(CAPABILITIES.length - 1, Math.floor((past / travel) * CAPABILITIES.length));
      if (i !== shown) { shown = i; setAt(i); }

      // ---- the crossing: one card out of the fan becomes this section's first diagram ----
      // It runs over the screen of scroll before the stage pins: 0 with the section one screen below, 1 the moment
      // it is pinned. The end is measured against the stage rather than the viewport, so it is where the card WILL
      // rest once pinned — the live rect is still below the fold for most of the flight.
      const fl = fly.current, cd = card.current;
      if (!fl || !cd) return;
      const f = Math.min(1, Math.max(0, 1 - r.top / innerHeight));
      const live = f > 0.004 && f < 0.999;
      if (live && held === null) { held = getReviewFocus(); setFlown(held); }
      if (!live && held !== null) { held = null; setFlown(null); }
      // the fan lets go of its centre card for the length of the flight, so one card crosses rather than two
      document.documentElement.classList.toggle("rvf-handoff", live);
      st.classList.toggle("is-handoff", live);
      fl.style.visibility = live ? "visible" : "hidden";
      if (!live) return;
      const box = cd.firstElementChild as HTMLElement | null;   // the card itself, not the column it is centred in
      if (!box) return;
      const sr = st.getBoundingClientRect(), cr = box.getBoundingClientRect();
      const ex = cr.left, ey = cr.top - sr.top, ew = cr.width, eh = cr.height;
      const sw = Math.min(FAN_W, innerWidth - 48), sh = sw * FAN_RATIO;
      const sx = (innerWidth - sw) / 2, sy = (innerHeight - sh) / 2;
      const e = easeOut(f);
      fl.style.setProperty("--x", `${(sx + (ex - sx) * e).toFixed(1)}px`);
      fl.style.setProperty("--y", `${(sy + (ey - sy) * e).toFixed(1)}px`);
      fl.style.setProperty("--w", `${(sw + (ew - sw) * e).toFixed(1)}px`);
      fl.style.setProperty("--h", `${(sh + (eh - sh) * e).toFixed(1)}px`);
      // the face turns over late, once the card is most of the way across and already the right shape
      fl.style.setProperty("--face", Math.min(1, Math.max(0, (f - 0.55) / 0.3)).toFixed(3));
    };
    const frame = () => { measure(); raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("rvf-handoff");
    };
  }, [flat]);

  // The head is inside the pinned stage: it holds on screen over the three capabilities, so the section keeps
  // saying what it is while the columns turn over under it. The stage packs everything up from the top rather
  // than centring one block (app/landing.css), which is what leaves the columns their room below it.
  const head = (
    <header className="cp-head">
      <h2 className="h2 lp-h cp-h">
        <span className="cp-h-lead">One partner.</span>
        <span className="cp-h-trail">More ways to move your business forward.</span>
      </h2>
      <p className="lp-lead">
        Growing a business takes more than one solution. We bring together marketing, digital experiences, and
        technology to help businesses attract customers and operate better.
      </p>
    </header>
  );

  // phones: no pin, no columns — each capability in full, one after another
  if (flat) {
    return (
      <section id="capabilities" className="section hs cp" aria-label="One partner, more ways to move your business forward">
        <div className="cp-track is-flat" ref={track}>
          <div className="cp-stage" ref={stage}>
            {head}
            <ol className="cp-rows">
              {CAPABILITIES.map((c, i) => (
                <li key={c.name} className="cp-row">
                  <h3 className="cp-t">{c.title.split("\n").map((l, k) => <span key={k}>{l}</span>)}</h3>
                  <Figure i={i} />
                  <p className="cp-b">{c.body}</p>
                  {/* the same services the wide layout lists: a phone reader should not have to take the line on trust */}
                  <ul className="cp-items">{c.items.map((it) => <li key={it}>{it}</li>)}</ul>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    );
  }

  /* The capability card's own slots, as components/home/RealityCards.tsx sets them: the banner, the art window,
     the footer rule. Divs rather than that file's spans — a drawn interface is flow content and cannot sit inside
     a span. One definition, drawn both where the card rests and on the card still in flight. */
  const capFace = (
    <div className="tc-in">
      <div className="tc-top">
        <b>{CAPABILITIES[at].name}</b>
        <span className="tc-no">{String(at + 1).padStart(2, "0")}/{String(CAPABILITIES.length).padStart(2, "0")}</span>
      </div>
      <div className="tc-art">
        <div className="cp-figs">
          {CAPABILITIES.map((c, i) => (
            <div key={c.name} className={i === at ? "cp-slot is-on" : "cp-slot"} aria-hidden={i !== at}>
              <Figure i={i} />
            </div>
          ))}
        </div>
      </div>
      <div className="tc-foot"><span>What we do</span></div>
    </div>
  );

  return (
    <section id="capabilities" className="section hs cp" aria-label="One partner, more ways to move your business forward">
      {/* The crossing: the card the reader was just looking at in the fan of reviews lifts out of it and lands as
          this section's first diagram, so the two sections read as one run rather than as two. It is portalled to
          the body on purpose — the cover sheet it would otherwise sit in is a transformed box, which would make
          `fixed` resolve against the sheet instead of the viewport and clip the card on its way. The fan lets go
          of its centre card meanwhile, and the resting card below is covered until the flight lands on it.
          Decoration: the real card carries the text. */}
      {mounted && !flat && createPortal(
        <div className="cp-fly" ref={fly} aria-hidden="true">
          {/* the review is the card's front and the diagram its back: it turns over on the way, as the one at the
              end of the fan does (components/FlipCard.jsx), rather than one picture dissolving into another */}
          <div className="cp-fly-in">
            <div className="cp-fly-face cp-fly-rv">
              <Frame><Face c={REVIEW_SET[flown ?? 0]} n={(flown ?? 0) + 1} of={REVIEW_SET.length} /></Frame>
            </div>
            <div className="cp-fly-face cp-fly-cp"><Frame>{capFace}</Frame></div>
          </div>
        </div>, document.body)}
      <div className="cp-track" ref={track}>
        <div className="cp-stage" ref={stage}>
          {head}
          <div className="cp-cols cp-two">
            {/* left: the three run down one column and the column travels up it — nothing fades in or out, it is
                the same text moving past. The ones before and after stay on the page, softened into the edges of
                the window by the mask rather than clipped away, so you can always see where you are in the three.
                It only ever rests on a capability, never between two of them. */}
            <div className="cp-reel">
              <ol className="cp-reel-in" ref={reel}>
                {CAPABILITIES.map((c, i) => (
                  <li key={c.name} className={`cp-item${i === at ? " is-on" : ""}`} aria-current={i === at || undefined}>
                    <p className="eyebrow cp-name">{c.name}</p>
                    <h3 className="cp-t">{c.title.split("\n").map((l, k) => <span key={k}>{l}</span>)}</h3>
                    <p className="cp-b">{c.body}</p>
                    <ul className="cp-items">
                      {c.items.map((it) => <li key={it}>{it}</li>)}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>

            {/* right: the card the review turned over on, settled here and holding the drawn interface. The card
                holds still for the whole section; only what is in its art window changes. */}
            <div className="cp-card" ref={card}>
              <Frame>{capFace}</Frame>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
