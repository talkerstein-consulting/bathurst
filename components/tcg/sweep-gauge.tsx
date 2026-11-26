"use client";

import { useEffect, useState } from "react";

/**
 * The reading dial: one circular loader with the progress figure in the middle.
 *
 * WHAT THE PERCENTAGE IS, AND WHAT IT IS NOT. PageSpeed Insights returns one answer at
 * the end of its run and reports nothing at all while the audit is going, so there is no
 * progress to read. The figure here is therefore ELAPSED TIME against how long a mobile
 * Lighthouse run usually takes — it is an estimate of the wait, not a measurement of the
 * work, and the line under the dial says so in those words.
 *
 * It is shaped so it cannot lie in the one way a progress figure usually does: the curve
 * eases off as it climbs and is capped at 99, so the dial never claims to be finished
 * while the instrument is still waiting. The results stage replaces it the moment Google
 * answers, early or late.
 *
 * ON BRAND: the ring is Steel Blue on a Steel Blue track at the palette's lightest step.
 * It is not orange — the brand keeps orange for things that can be pressed, and a loader
 * cannot be pressed. The figure is set in the heading face with tabular figures, so the
 * number does not jitter as it counts.
 *
 * D11 / reduced motion: the ring still fills, because that fill IS the information, but
 * the sweep transition is dropped so it steps rather than glides.
 */

/** What Google's audit covers. Not a progress sequence — a list, lit one at a time. */
const COVERS = [
  "Reaching the website",
  "Measuring performance",
  "Reviewing accessibility",
  "Checking technical best practices",
  "Preparing your results",
];

/** The ring's geometry. One circle, stroked, turned to start at twelve o'clock. */
const R = 86;
const C = 2 * Math.PI * R;

/**
 * Elapsed seconds to a figure between 0 and 99.
 *
 * An exponential approach rather than a straight line: it moves quickly while the
 * visitor is deciding whether anything is happening, then slows, so a run that takes
 * longer than usual does not sit pinned at 100 waiting. TAU is ~14s, which puts it near
 * 90 at the half minute a mobile run usually takes.
 */
const figure = (seconds: number) => Math.min(99, Math.round(99 * (1 - Math.exp(-seconds / 14))));

export function SweepGauge() {
  const [seconds, setSeconds] = useState(0);
  const [at, setAt] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
    /* The line moves slower than the clock: five items over about half a minute. It
       holds on the last one rather than looping back, because going round again would
       read as a stall. */
    const step = setInterval(() => setAt((i) => Math.min(i + 1, COVERS.length - 1)), 6000);
    return () => {
      clearInterval(tick);
      clearInterval(step);   // G13
    };
  }, []);

  const pct = figure(seconds);

  return (
    <div className="sweep">
      <div className="dial">
        <svg className="dial-face" viewBox="0 0 200 200" aria-hidden="true">
          {/* The track: the whole journey, so the part still to go is visible rather
              than implied by empty space. */}
          <circle className="dial-track" cx="100" cy="100" r={R} />
          {/* The run. Drawn from twelve o'clock by rotating the whole circle, which
              keeps the cap round at both ends. */}
          <circle
            className="dial-run"
            cx="100"
            cy="100"
            r={R}
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct / 100)}
          />
        </svg>
        {/* The figure sits inside the ring, not under it: it is what the ring is of. */}
        <p className="dial-read">
          <span className="dial-num">{pct}</span>
          <span className="dial-pc">%</span>
        </p>
      </div>

      {/* The one line that changes. aria-live so it is announced, polite so it waits. */}
      <p className="sweep-status" aria-live="polite">
        {COVERS[at]}
      </p>
      <p className="sweep-fine">
        {seconds}s elapsed. The figure is how long this usually takes, not how much
        Google has done — the audit reports only at its end.
      </p>
    </div>
  );
}
