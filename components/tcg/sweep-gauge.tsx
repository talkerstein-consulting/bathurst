"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The reading gauge: a speedometer with a needle, a full scale and a running arc, and
 * under it the line that says what the audit is doing, changing every second.
 *
 * The needle, the run and the figure share one clock (see the effect below) and climb
 * together at one steady rate from 0 to 95 over ~32s, then hold.
 *
 * WHAT THE PERCENTAGE IS, AND WHAT IT IS NOT. PageSpeed Insights returns one answer at
 * the end of its run and reports nothing while the audit is going, so there is no
 * progress to read. The needle is ELAPSED TIME against how long a mobile Lighthouse run
 * usually takes — an estimate of the wait, not a measurement of the work — and the line
 * on the page no longer says so (removed on request — FLAGGED). It holds at 95, so the
 * gauge never claims to be finished while the instrument is still waiting; the results
 * stage replaces it the moment Google answers, early or late.
 *
 * The status lines are the same kind of thing: a walk through what the audit covers,
 * one line a second, in five phases. They are not a log of Google's progress. They hold
 * on the second-to-last line rather than looping, because going round again reads as a
 * stall, and "Assessment complete." is never shown here — the results stage is that.
 *
 * ON BRAND: Steel Blue throughout. Not orange — the brand keeps orange for things that
 * can be pressed, and a gauge cannot be pressed.
 *
 * D11 / reduced motion: the needle and arc still move, because that IS the information,
 * but in one step a second instead of a glide, and the lines swap without tumbling.
 */

const PHASES: { name: string; lines: string[] }[] = [
  {
    name: "Initial scan",
    lines: [
      "Establishing connection…",
      "Locating your website…",
      "Mapping the digital footprint…",
      "Identifying entry points…",
      "Checking the site’s vital signs…",
      "Reading the structure of your website…",
    ],
  },
  {
    name: "Code & performance",
    lines: [
      "Decoding page structure…",
      "Inspecting the source code…",
      "Measuring load performance…",
      "Tracing resource bottlenecks…",
      "Examining scripts and stylesheets…",
      "Checking what’s slowing things down…",
      "Running performance diagnostics…",
    ],
  },
  {
    name: "Search & discoverability",
    lines: [
      "Checking how search engines see your site…",
      "Mapping indexable pages…",
      "Inspecting search signals…",
      "Checking your visibility in search…",
      "Reading your site’s metadata…",
      "Assessing your search readiness…",
    ],
  },
  {
    name: "AI & accessibility",
    lines: [
      "Checking how AI reads your website…",
      "Evaluating machine-readable content…",
      "Inspecting content clarity…",
      "Checking mobile usability…",
      "Testing accessibility signals…",
      "Measuring how easily visitors can navigate…",
    ],
  },
  {
    name: "Final assessment",
    lines: [
      "Compiling performance findings…",
      "Cross-checking diagnostic results…",
      "Identifying opportunities for improvement…",
      "Preparing your website report…",
      "Translating findings into next steps…",
    ],
  },
];

/** Every line in order, each knowing its phase. */
const LINES = PHASES.flatMap((p, phase) => p.lines.map((text) => ({ text, phase })));

/* ---- geometry -------------------------------------------------------------------
   One centre, a 240° sweep from eight o'clock to four o'clock. Angles are measured
   from twelve o'clock, clockwise, so 0% sits at -120° and 100% at +120°. */
const CX = 160;
const CY = 150;
const SWEEP = 240;
const angleOf = (pct: number) => -SWEEP / 2 + (SWEEP * pct) / 100;
const at = (pct: number, r: number) => {
  const a = (angleOf(pct) * Math.PI) / 180;
  /* Rounded to two places: the server and the browser disagree in the last digits of
     sin/cos, and an unrounded figure fails hydration on every tick. */
  const round = (n: number) => Math.round(n * 100) / 100;
  return [round(CX + r * Math.sin(a)), round(CY - r * Math.cos(a))] as const;
};
const arc = (r: number) => {
  const [x0, y0] = at(0, r);
  const [x1, y1] = at(100, r);
  return `M ${x0} ${y0} A ${r} ${r} 0 1 1 ${x1} ${y1}`;
};

const R_RUN = 132;      // the running arc
const R_TICK = 120;     // outer edge of the scale
const R_LABEL = 94;     // the figures
const R_INNER = 74;     // the inner ring of fine dots

/** 0–100 in steps of 2: a major mark every 10, a half mark every 5, a fine mark between. */
const TICKS = Array.from({ length: 51 }, (_, i) => i * 2);

/** How long the steady climb from 0 to CAP takes — about a mobile Lighthouse run. */
export const CLIMB_MS = 32_000;
export const CAP = 95;

/** How far the needles have travelled after `ms` of the climb. The instrument's one
 *  rate: the big gauge, the three small ones and anything that has to settle onto a
 *  reading afterwards all read it from here. */
export const sweptBy = (ms: number) => Math.min(CAP, (ms / CLIMB_MS) * CAP);

/** The catch-up when Google answers early: how long the needle takes to run from
 *  wherever it had got to up to a finished reading. */
export const FINISH_MS = 480;

export function SweepGauge({ finish = false }: { finish?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  /** Set the moment the answer lands: where the needle was, and when. */
  const done = useRef<{ from: number; at: number } | null>(null);
  const [pct, setPct] = useState(0);
  const [line, setLine] = useState(0);

  /* ONE CLOCK. The needle, the arc and the figure all come from the same elapsed time
     on one animation frame loop, so they always read the same number. The climb is
     linear (0 → CAP over CLIMB_MS) and holds at CAP. Needle and arc are set through
     --p on the root so the loop does not re-render React; the figure and the line
     re-render only when their whole value changes. Reduced motion: one step a second. */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    let raf = 0;
    let shown = -1;
    let said = -1;
    const frame = (now: number) => {
      const ms = calm ? Math.floor((now - t0) / 1000) * 1000 : now - t0;
      /* THE CATCH-UP. The climb is paced for a slow Lighthouse run, so an answer that
         lands in eight seconds used to cut the gauge off at a fifth of its scale and
         jump to the result. When the answer is in, the needle runs on from where it
         had got to and FINISHES the reading first — the same travel, in less time. */
      const p = done.current !== null
        ? done.current.from + (100 - done.current.from) * Math.min(1, (now - done.current.at) / FINISH_MS)
        : sweptBy(ms);
      el.style.setProperty("--p", p.toFixed(3));
      const whole = Math.floor(p);
      if (whole !== shown) { shown = whole; setPct(whole); }
      const l = Math.min(Math.floor((now - t0) / 1000), LINES.length - 1);
      if (l !== said) { said = l; setLine(l); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf); // G13
  }, []);

  /* Noted in a ref, not state: the loop above owns the needle and must not be torn
     down and restarted to hear about this. */
  useEffect(() => {
    if (!finish || done.current) return;
    const el = root.current;
    done.current = { from: Number(el?.style.getPropertyValue("--p") || 0), at: performance.now() };
  }, [finish]);

  const now = LINES[line];

  return (
    <div className="gauge" ref={root}>
      <svg className="gauge-face" viewBox="0 0 320 210" aria-hidden="true">
        {/* The track and the run: the whole journey, and the part already gone. Both the
            run and the needle read --p, the same value the figure shows. */}
        <path className="gauge-track" d={arc(R_RUN)} />
        <path className="gauge-run" d={arc(R_RUN)} pathLength={100} />

        {/* The scale. */}
        {TICKS.map((v) => {
          const major = v % 10 === 0;
          const half = !major && v % 5 === 0;
          const len = major ? 14 : half ? 9 : 5;
          const [x0, y0] = at(v, R_TICK);
          const [x1, y1] = at(v, R_TICK - len);
          return (
            <line
              key={v}
              className={major ? "gauge-tick is-major" : "gauge-tick"}
              x1={x0} y1={y0} x2={x1} y2={y1}
            />
          );
        })}
        {TICKS.filter((v) => v % 20 === 0).map((v) => {
          const [x, y] = at(v, R_LABEL);
          return (
            <text key={v} className="gauge-fig" x={x} y={y}>
              {v}
            </text>
          );
        })}

        {/* The inner ring: a fine dot every 5, and the ring itself. */}
        <path className="gauge-inner" d={arc(R_INNER)} />
        {TICKS.filter((v) => v % 5 === 0).map((v) => {
          const [x, y] = at(v, R_INNER - 7);
          return <circle key={v} className="gauge-dot" cx={x} cy={y} r={1.3} />;
        })}

        {/* The needle, drawn pointing at twelve and turned by --p: a tapered blade with
            a lit spine and a diamond shoulder, a jewel at the shoulder, a counterweight
            tail behind the hub, and a hub of a ring, a disc, an eye and a pin. */}
        <g className="gauge-needle">
          <path
            className="needle-tail"
            d={`M ${CX - 2.6} ${CY} L ${CX - 2} ${CY + 20} L ${CX + 2} ${CY + 20} L ${CX + 2.6} ${CY} Z`}
          />
          <circle className="needle-weight" cx={CX} cy={CY + 23} r={6} />
          <circle className="needle-weight-eye" cx={CX} cy={CY + 23} r={2.2} />
          <path
            className="needle-blade"
            d={`M ${CX - 5} ${CY} L ${CX - 3} ${CY - 60} L ${CX - 5.5} ${CY - 68} L ${CX - 1.1} ${CY - 78} L ${CX} ${CY - R_TICK + 6} L ${CX + 1.1} ${CY - 78} L ${CX + 5.5} ${CY - 68} L ${CX + 3} ${CY - 60} L ${CX + 5} ${CY} Z`}
          />
          <line className="needle-spine" x1={CX} y1={CY - 14} x2={CX} y2={CY - 62} />
          <circle className="needle-jewel" cx={CX} cy={CY - 68} r={1.7} />
        </g>
        <circle className="gauge-hub-ring" cx={CX} cy={CY} r={15} />
        <circle className="gauge-hub" cx={CX} cy={CY} r={11} />
        <circle className="gauge-hub-eye" cx={CX} cy={CY} r={5.5} />
        <circle className="gauge-hub-pin" cx={CX} cy={CY} r={2.4} />
      </svg>

      <p className="gauge-read">
        <span className="gauge-num">{pct}</span>
        <span className="gauge-pc">%</span>
      </p>

      {/* The line that changes every second. Two copies at the change — the old one
          tumbles out as the new one tumbles in. aria-live so it is announced; polite
          so it never interrupts. */}
      <p className="gauge-line" aria-live="polite">
        {line > 0 && (
          <span key={`out-${line}`} className="gauge-line-text is-out" aria-hidden="true">
            {LINES[line - 1].text}
          </span>
        )}
        <span key={`in-${line}`} className="gauge-line-text is-in">
          {now.text}
        </span>
      </p>

    </div>
  );
}
