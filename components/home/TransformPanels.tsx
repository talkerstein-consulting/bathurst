"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Phone } from "./Interfaces";
import "@/app/landing.css";

/**
 * 04 · The Transformation. The section splits: a phone holds still on the left while the three steps scroll past on
 * the right, and the phone shows the screen for whichever step is being read. It used to be a list of the three
 * step names pinned there with a grey screen drawn inside every block — the phone says the same thing once, and
 * shows it at the size someone would actually meet it on.
 *
 * This is the opposite mechanism to 03 (components/home/RealityPanels.tsx), where the content was pinned and swapped
 * in place. Here only the list is pinned; the blocks beside it scroll normally, so the section is as tall as its
 * content rather than as tall as an invented track.
 *
 * Pinned by hand, and re-measured every frame: this page's sheet (.cover) is a transformed box that the map engine
 * moves from its own scroll handler, so `position: sticky` has no viewport to hold against and a rect read taken
 * while handling `scroll` can still be the sheet's previous position. See RealityPanels for the same note.
 *
 * The phone unpins exactly as the last step ends: the travel is measured against the BLOCKS, not the whole body, so
 * its foot and the foot of "Keep opportunities moving" leave the screen together rather than the phone hanging on
 * through the whitespace below.
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
      const rect = ol.getBoundingClientRect();
      if (rect.bottom < -400 || rect.top > innerHeight + 400) return;
      // The phone holds at TOP for as long as the BLOCKS beside it have content left. Measuring against the whole
      // body (which carries the heading above the two columns) kept it pinned past the end of the last step.
      const span = ol.offsetHeight - r.offsetHeight + (ol.offsetTop - r.offsetTop);
      const pin = Math.min(Math.max(0, span), Math.max(0, TOP - rect.top));
      r.style.setProperty("--pin", `${pin}px`);
      // the step being read is the last one whose top has passed the reading line
      const line = innerHeight * 0.42;
      let i = 0;
      for (let k = 0; k < ol.children.length; k += 1) {
        if ((ol.children[k] as HTMLElement).getBoundingClientRect().top <= line) i = k;
      }
      if (i !== shown) { shown = i; setAt(i); }
    };
    const frame = () => { measure(); raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [flat]);

  return (
    <section id="transformation" className="section hs tp" aria-label="Make every part of your digital presence work harder">
      <div className="tp-wrap">
        {/* The head is INSIDE the body's grid, in the same column as the blocks. It used to sit above the grid with a
            percentage left margin, which put it 40px to the left of "Get noticed." underneath it — close enough to
            read as a mistake rather than as a second column. Sharing the grid, the two edges cannot drift. */}
        <div className="tp-body" ref={body}>
          <header className="tp-head">
            <h2 className="h2 lp-h">Make every part of your digital presence work harder.</h2>
            <p className="lp-lead">
              From the first time someone discovers your business to the moment they become a customer, every
              interaction matters.
            </p>
          </header>

          {/* left: the phone, held still, showing the screen for the step being read */}
          <div className="tp-rail" ref={rail} style={{ "--pin": "0px" } as CSSProperties}>
            <Phone at={at} />
          </div>

          {/* right: the content for each step, one after another */}
          <ol className="tp-blocks" ref={blocks}>
            {STEPS.map((s) => (
              <li key={s.title} className="tp-block">
                <h3 className="tp-t">{s.title}</h3>
                <p className="tp-b">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>

      </div>
    </section>
  );
}
