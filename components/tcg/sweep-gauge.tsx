"use client";

import { useEffect, useState } from "react";

/**
 * The reading gauge: one large semicircular instrument, after an elevator floor indicator.
 *
 * IT IS INDETERMINATE, AND SAYS SO. PageSpeed Insights returns one answer at the end of
 * the run; it reports nothing at all while the audit is going. So this needle sweeps the
 * arc rather than climbing it, and the number in the middle is the elapsed time — a thing
 * we actually know — rather than a percentage we would have to make up. A gauge filling
 * to 80% would be a fabricated reading presented as a measurement, which is the one thing
 * this page cannot do.
 *
 * The status line under it names what Google's audit covers, one item at a time. The
 * wording is "what is being measured", not "we are now at step 3 of 5", for the same
 * reason: the audit does not tell us where it is.
 *
 * D11 / reduced motion: the needle parks at the centre of the arc and the line still
 * changes, so the stage reads as working without anything moving.
 */

/** What Google's audit covers. Not a progress sequence — a list, lit one at a time. */
const COVERS = [
  "Reaching the website",
  "Measuring performance",
  "Reviewing accessibility",
  "Checking technical best practices",
  "Preparing your results",
];

const START = -90;   // the arc opens at nine o'clock
const SWEEP = 180;

export function SweepGauge() {
  const [seconds, setSeconds] = useState(0);
  const [at, setAt] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
    /* The line moves slower than the clock: five items over about half a minute, which is
       what a mobile Lighthouse run usually takes. It holds on the last one rather than
       looping back, because going round again would read as a stall. */
    const step = setInterval(() => setAt((i) => Math.min(i + 1, COVERS.length - 1)), 6000);
    return () => {
      clearInterval(tick);
      clearInterval(step);   // G13
    };
  }, []);

  /* The ticks: a long one every fifth. Drawn once, not animated — the needle is the only
     thing on this instrument that moves. */
  const ticks = Array.from({ length: 41 }, (_, i) => {
    const major = i % 5 === 0;
    const angle = ((START + SWEEP * (i / 40)) * Math.PI) / 180;
    const outer = 150;
    const inner = outer - (major ? 18 : 9);
    return {
      major,
      x1: 200 + inner * Math.sin(angle),
      y1: 190 - inner * Math.cos(angle),
      x2: 200 + outer * Math.sin(angle),
      y2: 190 - outer * Math.cos(angle),
    };
  });

  return (
    <div className="sweep">
      <svg className="sweep-face" viewBox="0 0 400 210" aria-hidden="true">
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1.toFixed(1)}
            y1={t.y1.toFixed(1)}
            x2={t.x2.toFixed(1)}
            y2={t.y2.toFixed(1)}
            className={t.major ? "sweep-tick is-major" : "sweep-tick"}
          />
        ))}
        {/* The needle. Its sweep is a CSS animation on the group, so the browser runs it
            off the main thread and a slow network cannot make it stutter. */}
        <g className="sweep-hand">
          <line x1="200" y1="190" x2="200" y2="52" />
          <circle cx="200" cy="190" r="7" />
        </g>
      </svg>

      <p className="sweep-read">
        <span className="sweep-num">{seconds}</span>
        <span className="sweep-unit">seconds elapsed</span>
      </p>

      {/* The one line that changes. aria-live so it is announced, polite so it waits. */}
      <p className="sweep-status" aria-live="polite">
        {COVERS[at]}
      </p>
      <p className="sweep-fine">
        Google runs the audit at its end. It usually takes about half a minute.
      </p>
    </div>
  );
}
