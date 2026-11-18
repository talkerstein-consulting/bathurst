"use client";

import { useEffect, useRef, useState } from "react";
import "@/app/landing.css";

/**
 * 06 · What We Do. Three columns that hold still while you scroll through them:
 *
 *   left    all three titles, spread down the column and staying exactly where they are. The one being read is in
 *           full Steel Blue; the other two sit back, so the section always shows what came before and what is next.
 *   middle  the picture for the one being read.
 *   right   its explanation.
 *
 * Only the middle and right change — the titles never move, which is what makes the change read as the same section
 * turning over rather than as three sections going past.
 *
 * Pinned by hand and re-measured every frame, for the same reasons as components/home/RealityPanels.tsx: this page's
 * sheet (.cover) is a transformed box the map engine moves from its own scroll handler, so `position: sticky` has no
 * viewport to hold against and a rect read taken while handling `scroll` can be a frame behind.
 *
 * LOW FIDELITY — the middle column is a grey placeholder. Replace .cp-fig with the real image.
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

/** The placeholder picture, one per capability. */
const Figure = ({ i }: { i: number }) => (
  <div className="cp-fig" aria-hidden="true"><span>{i + 1}</span></div>
);

export default function CapabilityPanels() {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
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
    const el = track.current, st = stage.current;
    if (!el || !st) return;
    if (flat) { st.style.removeProperty("--pin"); return; }
    let raf = 0;
    let shown = -1;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -400 || r.top > innerHeight + 400) return;
      const travel = r.height - innerHeight;
      if (travel <= 0) { st.style.setProperty("--pin", "0px"); return; }
      const past = Math.min(travel, Math.max(0, -r.top));
      st.style.setProperty("--pin", `${past}px`);   // straight to the DOM: state would land a frame late
      const i = Math.min(CAPABILITIES.length - 1, Math.floor((past / travel) * CAPABILITIES.length));
      if (i !== shown) { shown = i; setAt(i); }
    };
    const frame = () => { measure(); raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [flat]);

  const head = (
    <header className="cp-head">
      <p className="eyebrow cp-eyebrow">What we do</p>
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
                  <p className="cp-n">{c.name}</p>
                  <h3 className="cp-t">{c.title.split("\n").map((l, k) => <span key={k}>{l}</span>)}</h3>
                  <Figure i={i} />
                  <p className="cp-b">{c.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="capabilities" className="section hs cp" aria-label="One partner, more ways to move your business forward">
      <div className="cp-track" ref={track}>
        <div className="cp-stage" ref={stage}>
          {head}
          <div className="cp-cols">
            {/* left: every title, fixed in place, the one being read in full strength */}
            <ol className="cp-names">
              {CAPABILITIES.map((c, i) => (
                <li key={c.name} className={i === at ? "is-on" : undefined} aria-current={i === at || undefined}>
                  <p className="cp-n">{c.name}</p>
                  <h3 className="cp-t">{c.title.split("\n").map((l, k) => <span key={k}>{l}</span>)}</h3>
                </li>
              ))}
            </ol>

            {/* middle: the picture for the one being read */}
            <div className="cp-figs">
              {CAPABILITIES.map((c, i) => (
                <div key={c.name} className={i === at ? "cp-slot is-on" : "cp-slot"} aria-hidden={i !== at}>
                  <Figure i={i} />
                </div>
              ))}
            </div>

            {/* right: its explanation */}
            <div className="cp-bodies">
              {CAPABILITIES.map((c, i) => (
                <p key={c.name} className={i === at ? "cp-slot cp-b is-on" : "cp-slot cp-b"} aria-hidden={i !== at}>
                  {c.body}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
