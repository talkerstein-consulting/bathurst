"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type InputHTMLAttributes, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { Check, ChevronRight } from "lucide-react";
import { completeDomain, toSiteUrl } from "@/lib/domain";
import { CONTACT } from "@/lib/bathurst/data";
import Awards from "@/components/bathurst/Awards";
import { Cta } from "./cta";
import { Frame } from "./frame";
import { FINISH_MS, SweepGauge, sweptBy } from "./sweep-gauge";
import { byDay, slotDay, slotTime, tzLabel, useSlots, type Slot } from "./slots";

/**
 * The silent-leak assessment, as one instrument operated through four stages inside a
 * single viewport. Nothing scrolls and nothing navigates: the same panel changes state.
 *
 *   01 INPUT        the instrument is dormant — the address field and nothing else
 *   02 MEASUREMENT  it comes alive — one semicircular gauge, sweeping (./sweep-gauge.tsx)
 *   03 DIAGNOSIS    it reveals its readings — that one gauge becomes three
 *   04 CONSULTATION it makes room — the readings move to a strip and the booking opens
 *
 * The continuity is deliberate: 02 and 03 are the same semicircular face at two sizes
 * (the dial's `meter` variant), and 04 keeps those same three faces at the top of the
 * panel rather than replacing them. Position, shape and hierarchy carry across; nothing
 * slides in from off screen.
 *
 * WHAT IS REAL AND WHAT IS NOT:
 *  - The scores are Google's, from /api/pagespeed. Nothing here re-weights or re-grades
 *    them; the headline reading and the sentence under it are both derived from the
 *    numbers that came back, using Google's own bands.
 *  - The gauge in 02 is indeterminate, because PageSpeed reports nothing until it is
 *    done. See ./sweep-gauge.tsx.
 *  - The rating shown in 04 is the real Google Business Profile figure recorded in
 *    lib/bathurst/data.ts, not a number written for this page.
 *  - 04 sends a request; it does not book a time. There are no slots on this page,
 *    because there is no calendar behind it to read them from. It posts the same payload
 *    to the same endpoint as the site's own booking form
 *    (components/bathurst/BookingForm.tsx), and falls back to a pre-filled email the same
 *    way when that endpoint is not there.
 *
 * This is a PageSpeed assessment, not a security scan, and the copy in 03 says so in as
 * many words before anyone is asked for anything.
 *
 * UX REVIEW, applied: the panel is a real bounded region (Common Region); the stage rail
 * is connected rather than four loose labels (Uniform Connectedness); the weakest score
 * is the one thing set large, because that is what the visitor came to find out
 * (Von Restorff, Selective Attention); the reading stage can be abandoned (Doherty); the
 * end of the sequence is a proper confirmation rather than a line of text (Peak–End); and
 * the scores stay readable while the booking is being filled in (Working Memory).
 */

type Stage = "input" | "reading" | "results" | "booking";

type Scores = { performance: number | null; accessibility: number | null; practices: number | null };
type Result = {
  url: string;
  scores: Scores;
  timings: { paint: string | null; usable: string | null };
  /** Lighthouse's failing audits, ranked by app/api/pagespeed/route.ts. Google's wording. */
  fixes?: { id: string; title: string; detail: string | null }[];
};

/** Lighthouse titles mark code with backticks (`[alt]`); shown here as plain text. */
const plain = (t: string) => t.replace(/`/g, "");

const DIALS: Array<[keyof Scores, string]> = [
  ["performance", "Performance"],
  ["accessibility", "Accessibility"],
  ["practices", "Best practices"],
];

const STAGES: Stage[] = ["input", "reading", "results", "booking"];


/**
 * A made-up reading, used only to open 03 and 04 directly (see the effect in
 * Instrument). The numbers are plausible rather than real. The fixes are real
 * Lighthouse audit titles, but which ones fail and by how much is made up for the
 * sample. FLAGGED: the face no longer says on screen that this is a sample.
 */
const SAMPLE: Result = {
  url: "https://example.com",
  scores: { performance: 34, accessibility: 72, practices: 93 },
  timings: { paint: "2.8 s", usable: "9.1 s" },
  fixes: [
    { id: "render-blocking-resources", title: "Eliminate render-blocking resources", detail: "Potential savings of 1,850 ms" },
    { id: "unused-javascript", title: "Reduce unused JavaScript", detail: "Potential savings of 412 KiB" },
    { id: "uses-responsive-images", title: "Properly size images", detail: "Potential savings of 286 KiB" },
    { id: "server-response-time", title: "Reduce initial server response time", detail: "Root document took 1,240 ms" },
    { id: "modern-image-formats", title: "Serve images in modern formats", detail: "Potential savings of 198 KiB" },
    { id: "image-alt", title: "Image elements do not have `[alt]` attributes", detail: null },
    { id: "color-contrast", title: "Background and foreground colors do not have a sufficient contrast ratio.", detail: null },
  ],
};

/** Google's own bands: 0–49 poor, 50–89 needs improvement, 90–100 good. */
type Band = "good" | "fair" | "poor";
function bandOf(score: number): Band {
  if (score >= 90) return "good";
  if (score >= 50) return "fair";
  return "poor";
}

/** The band in plain words, for any category (a score is not always speed). */
const BAND_NAME: Record<Band, string> = {
  good: "In good shape",
  fair: "Could be better",
  poor: "Needs attention",
};

/** Google's own band and its range, said beside the plain name. */
const BAND_RANGE: Record<Band, string> = {
  good: "Google rates 90–100 good",
  fair: "Google rates 50–89 needs improvement",
  poor: "Google rates 0–49 poor",
};

/* ---- the small gauges ------------------------------------------------------------
 * The same instrument as the big one on 02 (./sweep-gauge.tsx), drawn with less on it.
 *
 * Same 240° sweep from eight o'clock to four o'clock, same track-and-run arc, same
 * needle-on-a-hub. What is left off is the detail that only reads at the big one's
 * size: the fine inner ring of dots, the half ticks, the counterweight, the lit spine
 * and the jewel. A major tick every 20 and a figure at 0, 50 and 100 is all that
 * survives the scale.
 *
 * ONE SET OF DIALS, TWO STATES. On 02 they sweep with no number and no band; on 03 the
 * same three carry the readings. The stage shift settles them rather than swapping one
 * row of dials for another.
 */
const D_CX = 64;
const D_CY = 62;
const D_SWEEP = 240;
const R_D_RUN = 52;   // the track and the run
const R_D_TICK = 46;  // outer edge of the scale
const R_D_FIG = 30;   // the figures

const r2 = (n: number) => Math.round(n * 100) / 100; // fixed digits: SSR and client agree
/** A point on the dial. 0% sits at -120° from twelve, 100% at +120°, clockwise. */
const dialAt = (v: number, r: number) => {
  const a = ((-D_SWEEP / 2 + (D_SWEEP * v) / 100) * Math.PI) / 180;
  return [r2(D_CX + r * Math.sin(a)), r2(D_CY - r * Math.cos(a))] as const;
};
const dialArc = (r: number, from = 0, to = 100) => {
  const [x0, y0] = dialAt(from, r);
  const [x1, y1] = dialAt(to, r);
  const big = (to - from) / 100 > 0.5 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${big} 1 ${x1} ${y1}`;
};

/**
 * Which third of the scale a reading lands in — the colour of the run on a small dial.
 * The first third is red, the second amber, the last green.
 *
 * FLAGGED: thirds are not Google's bands, which are 0–49 poor, 50–89 needs improvement
 * and 90–100 good (bandOf). They agree in the middle and part at the edges: 49 is
 * Google's poor but this scale's amber, 89 is Google's middle but this scale's green.
 * The figure and the words under each dial are Google's and are unchanged; only the
 * length of coloured arc follows the thirds.
 */
const thirdOf = (v: number): Band => (v < 33.3 ? "poor" : v < 66.6 ? "fair" : "good");
/** 0–100 every 10: a major mark every 20, a minor between. */
const NOTCHES = Array.from({ length: 11 }, (_, i) => i * 10);

/**
 * `sweep` is the dial BEFORE it has a reading. The needle makes ONE slow run from the
 * left of the scale to the right and holds there — at the big gauge's own rate, 0 to 95
 * over the same 32s, so the three of them travel with it rather than against it. It
 * carries no number and no run arc: PageSpeed reports nothing at all until the end (see
 * ./sweep-gauge.tsx), so any figure here would be invented. What moves is the
 * instrument, not a score.
 */
function ScoreDial({
  label,
  value,
  band,
  sweep = false,
  delay = 0,
  from = 0,
  vt,
}: {
  label: string;
  value?: number;
  band?: Band;
  sweep?: boolean;
  /** Where on the scale this needle starts its settle — where the sweeping dial of the
   *  same category had got to when the reading landed. */
  from?: number;
  /** The view-transition name this dial keeps across the 02 → 03 handoff. The sweeping
   *  dial on 02 and the dial carrying the same category's reading on 03 share it, which
   *  is what lets the browser morph one into the other instead of crossing them over. */
  vt?: string;
  /** Staggers the settle on 03. The sweep on 02 takes no delay — all three run with
   *  the big gauge, and an offset would read as three different clocks. */
  delay?: number;
}) {
  const v = sweep ? 0 : value ?? 0;
  return (
    <figure
      className={sweep ? "score-dial is-sweeping" : "score-dial"}
      data-band={sweep || value === undefined ? undefined : thirdOf(value)}
      style={{ "--v": v, "--from": from, "--delay": `${delay}ms`, viewTransitionName: vt } as CSSProperties}
      aria-label={sweep ? `${label}: measuring` : `${label}: ${value} out of 100, ${BAND_NAME[band!]}`}
    >
      <svg viewBox="0 0 128 96" aria-hidden="true">
        <path className="score-dial-track" d={dialArc(R_D_RUN)} />
        {/* The run — the big gauge's own arc. On 03 it is filled to the score; on 02 it
            grows with the needle and changes colour as it crosses each third, so the
            dial reads bad, then fair, then good while it climbs rather than sitting
            grey until the end. It is the TRAVEL that is coloured, not a result: nothing
            is known about any category until Google answers, which is why no figure
            stands under a sweeping dial. */}
        <path className="score-dial-run" d={dialArc(R_D_RUN)} pathLength={100} />
        {NOTCHES.map((n) => {
          const major = n % 20 === 0;
          const [x0, y0] = dialAt(n, R_D_TICK);
          const [x1, y1] = dialAt(n, R_D_TICK - (major ? 9 : 5));
          return (
            <line key={n} className={major ? "score-dial-notch is-long" : "score-dial-notch"} x1={x0} y1={y0} x2={x1} y2={y1} />
          );
        })}
        {[0, 50, 100].map((n) => {
          const [x, y] = dialAt(n, R_D_FIG);
          return (
            <text key={n} className="score-dial-fig" x={x} y={y}>
              {n}
            </text>
          );
        })}
        {/* The needle: the big one's tapered blade, without its spine, jewel or tail. */}
        <g className="score-dial-needle">
          <path d={`M ${D_CX - 2.6} ${D_CY} L ${D_CX - 1.6} ${D_CY - 28} L ${D_CX} ${D_CY - R_D_TICK + 3} L ${D_CX + 1.6} ${D_CY - 28} L ${D_CX + 2.6} ${D_CY} Z`} />
        </g>
        <circle className="score-dial-hub-ring" cx={D_CX} cy={D_CY} r={6.5} />
        <circle className="score-dial-hub" cx={D_CX} cy={D_CY} r={4.5} />
        <circle className="score-dial-pin" cx={D_CX} cy={D_CY} r={1.6} />
      </svg>
      <figcaption>
        {/* Nothing stands where the score goes until there is one. An em rule was
            tried here and read as a hairline over the label, not as a blank. */}
        {!sweep && <strong>{value}</strong>}
        <b>{label}</b>
        {!sweep && <span>{BAND_NAME[band!]}</span>}
      </figcaption>
    </figure>
  );
}

/** The weakest category that came back — the reading this whole page exists to surface. */
function weakest(scores: Scores) {
  const got = DIALS.map(([key, label]) => ({ key, label, value: scores[key] })).filter(
    (s): s is { key: keyof Scores; label: string; value: number } => s.value !== null,
  );
  if (got.length === 0) return null;
  return got.reduce((a, b) => (b.value < a.value ? b : a));
}

/* Module scope, both of them: reading the clock is not something a component may do as
   it renders, and the lint rule cannot tell that these are only ever reached from an
   event handler. */
const nowMs = () => performance.now();
/** How far the needles have climbed since `t0`, or 0 if nothing was running. */
function sweptSince(t0: number) {
  return t0 ? sweptBy(nowMs() - t0) : 0;
}

export function Instrument() {
  const [stage, setStage] = useState<Stage>("input");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  /** True while the readings on screen are the sample, not Google's. */
  const [sample, setSample] = useState(false);
  /** When the climb began, and how far it had got when Google answered.
   *
   *  The small dials do not run to the end of their scale and wait there. They are
   *  SEEKING: the needle travels while the instrument is reading, and when the answer
   *  lands it settles onto the score from wherever it had got to — forward if the score
   *  is above it, back if the score is below. Starting the diagnosis dials from zero
   *  instead threw the needle back to the peg and climbed again, which reads as three
   *  new instruments rather than the same three coming to rest. */
  const startedAt = useRef(0);
  const [swept, setSwept] = useState(0);
  /** True from the moment Google answers until 03 is on screen: the reading face runs
   *  its needle up to a finished reading rather than being cut off mid-climb. */
  const [finishing, setFinishing] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  /** The run in flight, so the reading stage can be abandoned rather than waited out. */
  const run = useRef<AbortController | null>(null);

  const tail = completeDomain(url);
  const locked = stage !== "input";

  /* Each stage takes the focus to the top of what it just put on screen, so the keyboard
     follows the instrument instead of being left on a control that is now inert. */
  useEffect(() => {
    if (stage === "input") {
      field.current?.focus({ preventScroll: true });
      return;
    }
    panel.current?.focus({ preventScroll: true });
  }, [stage]);

  /* G13: a run still open when the instrument unmounts is cancelled, not left hanging. */
  useEffect(() => () => run.current?.abort(), []);

  /* The page below the first screen is a landing page and scrolls like one. The
     instrument does not: from 02 onwards it is a full-screen modal, and the document
     behind it must not move under the visitor's thumb while the reading runs.
     *
     * The flag is a class on <body> rather than a style written here, so the lock and
     * the modal itself are both described in app/check-2.css and there is one place to
     * read what "open" does to the page. It is removed on unmount as well as on the
     * way back to 01, so a navigation away mid-reading cannot leave the document
     * frozen. */
  useEffect(() => {
    document.body.classList.toggle("inst-open", stage !== "input");
    return () => document.body.classList.remove("inst-open");
  }, [stage]);

  /**
   * Put a stage on screen without running a reading.
   *
   * Used by the query string on load. 02 needs an address to
   * name, and 03 and 04 need a reading to show, so both are supplied from SAMPLE — and
   * `sample` stays true while they are, which is what makes the diagnosis face say so
   * instead of naming Google as the source.
   */
  const show = (want: Stage) => {
    run.current?.abort();
    run.current = null;
    setError("");
    setFinishing(false);
    if (want === "input") {
      setResult(null);
      setSample(false);
    } else {
      setUrl((u) => u || SAMPLE.url.replace(/^https?:\/\//, ""));
      if (want === "reading") {
        setResult(null);
      } else if (!result) {
        /* A real reading already on screen is kept: only an empty instrument is given
           the sample, so jumping back to 03 after a genuine run still shows the run. */
        setResult(SAMPLE);
        setSample(true);
      }
    }
    setStage(want);
  };

  /* The other three stages, opened directly.
   *
   * 02, 03 and 04 are only reachable by running a real reading, which takes half a
   * minute, needs the PageSpeed key and gives whatever scores the site happens to have
   * that day — so the three faces that carry most of this page's design could not be
   * looked at, or shown to anyone, without that. `?stage=reading|results|booking` opens
   * one of them. 03 and 04 need a reading to show, so they are given the SAMPLE below.
   *
   * This is for looking at the page, not for using it: the scores it shows are made up,
   * which is why the face says so in as many words while the sample is on, and why the
   * page is noindex (see app/check-2/page.tsx). Nothing here changes what a real run
   * does — a reading started from 01 replaces the sample with Google's own answer. */
  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps --
     the query string can only be read after mount: putting it in the initial state
     would make the server's render (always stage 01) disagree with the client's. It
     runs once. */
  useEffect(() => {
    const want = new URLSearchParams(window.location.search).get("stage");
    if (want && STAGES.includes(want as Stage)) show(want as Stage);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */


  const start = async (e: FormEvent) => {
    e.preventDefault();
    const site = toSiteUrl(url + tail);
    if (!site) {
      setError("That doesn’t look like a website address. Try it as example.com.");
      field.current?.focus();
      return;
    }
    setUrl(url + tail);          // the field keeps what was actually checked
    setError("");
    setResult(null);
    startedAt.current = nowMs();
    setStage("reading");

    const ctl = new AbortController();
    run.current = ctl;
    try {
      const answer = await fetch("/api/pagespeed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: site }),
        signal: ctl.signal,
      });
      const data = await answer.json().catch(() => null);
      if (!answer.ok) {
        /* No key, no route, or Google refused. Rather than dead-ending at 01 — which is
           where this page spent its whole life while PAGESPEED_API_KEY was unset, with
           no way to reach 02, 03 or 04 at all — the sequence carries on against the
           sample. It is labelled as a sample on the face itself, so nobody can mistake
           it for a measurement of the address they typed. */
        fallBack(site);
        return;
      }
      /* The answer is in, but the gauge is paced for a slow run. Let it finish the
         reading first — a beat, not a wait — and hand over to 03 on the other side of
         it, with the dials settling from where the catch-up left them. */
      setFinishing(true);
      await new Promise((r) => setTimeout(r, FINISH_MS));
      if (ctl.signal.aborted) return;
      land(() => {
        setResult(data as Result);
        setSample(false);
        setStage("results");
        setFinishing(false);
      });
    } catch (err) {
      /* An abort is the visitor's own decision, not a failure: say nothing. */
      if ((err as Error)?.name === "AbortError") return;
      fallBack(site);
    } finally {
      run.current = null;
    }
  };

  /**
   * THE 02 → 03 HANDOFF, as a morph rather than a cut.
   *
   * The three small gauges on the reading face and the three carrying the readings on
   * the diagnosis face are the same three instruments, and they are named as such
   * (`view-transition-name: dial-<category>`). Run the state change inside a view
   * transition and the browser tweens each named element from where it was to where it
   * now is — position, size and picture — so the dials travel up into the diagnosis
   * layout instead of one row fading out while another fades in. Everything else on the
   * two faces cross-fades underneath, which is what the faces already do.
   *
   * `flushSync` because the API snapshots the DOM, calls this, and snapshots again: a
   * React update that has not committed by the time it returns is not in the second
   * snapshot. Where the API is missing, or the visitor asked for less motion, the state
   * simply changes and the faces blur over as before.
   */
  const land = (apply: () => void) => {
    /* Where the needles are at this instant, for the dials on the far side to settle
       from. Zero when nothing was running — a stage opened from ?stage= or the rail
       has no climb behind it, so those dials come up from the peg as before.
       Set here rather than read off a ref in the render: this runs from an event, and
       the render that `apply` causes picks it up with everything else. */
    setSwept(sweptSince(startedAt.current));
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!doc.startViewTransition || calm) {
      apply();
      return;
    }
    /* A transition can be refused for reasons that have nothing to do with this page —
       the tab is in the background, another one is already running — and it rejects
       `ready` when it is. The DOM change has happened either way, so the rejection is
       swallowed rather than left as an unhandled promise. */
    const vt = doc.startViewTransition(() => flushSync(apply)) as { ready?: Promise<void> };
    vt?.ready?.catch(() => {});
  };

  /* THE BAR'S APPOINTMENT CONTROL. On this page the booking is a stage, not another
     route, so the bar opens 04 in place rather than leaving for /book — a reading
     already on screen is still behind it when it does. The bar is given the event name
     in app/check-2/page.tsx; its href is the answer for anything that does not run
     this. Held in a ref because the listener is bound once and `show` closes over the
     reading, which it must read as it is pressed, not as it was at mount. */
  const openBook = useRef<(() => void) | null>(null);
  useEffect(() => { openBook.current = () => land(() => show("booking")); });
  useEffect(() => {
    const open = () => openBook.current?.();
    window.addEventListener("tcg:book", open);
    return () => window.removeEventListener("tcg:book", open); // G13
  }, []);

  /**
   * Carry on without Google.
   *
   * The reading could not be made — no PAGESPEED_API_KEY, no /api/pagespeed, or the
   * request failed — so the instrument shows the SAMPLE and walks the rest of the
   * sequence. The visitor can still see what the assessment gives them and still ask
   * for a review; the numbers simply are not theirs, and the face says so where it
   * would otherwise name Google as the source.
   *
   * FLAGGED: this makes a FAILED check look like a working one to anyone who misses the
   * label. It is right for a page being shown and reviewed before the key is placed; it
   * is NOT right once the key is in and a real failure should be reported as a failure.
   * When PAGESPEED_API_KEY is set, this should become an error path again.
   */
  const fallBack = (site: string) => {
    land(() => {
      setResult({ ...SAMPLE, url: site });
      setSample(true);
      setError("");
      setStage("results");
    });
  };

  const stats = result
    ? DIALS.filter(([key]) => result.scores[key] !== null).map(([key, label]) => ({
        key,
        label,
        value: result.scores[key] as number,
        min: 0,
        max: 100,
      }))
    : [];
  const low = result ? weakest(result.scores) : null;
  const fixes = result?.fixes ?? [];

  return (
    <div className="inst" data-stage={stage}>
      {/* The instrument itself: one unbounded region on the page's own ground. The
          plate and the stage rail are gone — the sequence is carried by the faces
          themselves, which crossfade in the same place. The ref is here so each stage
          can take the focus to the top of what it just put on screen. */}

      <div className="inst-panel" ref={panel} tabIndex={-1}>

        {/* ----------------------------------------------- 01 · INPUT ------ */}
        <section className="inst-face" data-face="input" aria-hidden={stage !== "input"} inert={stage !== "input"}>
          <div className="inst-say">
            {/* The two companies, each as the thing a reader recognises, and each in a
                pill of its own.
                *
                * The pill is doing work, not decoration: these are two foreign marks
                * dropped into a sentence set in the brand's own face, and without an
                * edge around them they read as debris in the line. The pill says "this
                * is a thing being named", and it gives Google's colour wordmark a piece
                * of plain paper to sit on so the dither never runs under it.
                *
                * Both marks are the companies' own artwork in their own colours, not
                * repainted: Google is its full colour wordmark from Google's asset
                * host; ChatGPT is the blossom-and-wordmark lockup chatgpt.com itself
                * puts in its header, in black.
                * See public/brand/third-party/README.md. */}
            <h1 className="inst-h1">
              <span className="inst-h1-a">Your website looks fine.</span>
              <span className="inst-h1-b">
                But does{" "}
                <span className="inst-pill">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="inst-pill-mark inst-pill-mark--google"
                    src="/brand/third-party/google-wordmark.png"
                    alt="Google"
                    width={540}
                    height={179}
                  />
                </span>{" "}
                and{" "}
                <span className="inst-pill">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="inst-pill-mark inst-pill-mark--chatgpt"
                    src="/brand/third-party/chatgpt-wordmark.svg"
                    alt="ChatGPT"
                    width={118}
                    height={28}
                  />
                </span>{" "}
                think so?
              </span>
            </h1>
            <p className="inst-lede">Find out what your customers experience.</p>
          </div>

          {/* ONE CONTAINER for the whole intake: the address field, the button that
              acts on it, and the four marks that say why you would. They were three
              things stacked on the page's ground; the box makes them one, and the
              ratings stop reading as a separate band that happens to be nearby.

              The form spans the box — full width inside it, field and button on one
              line — and the ratings sit under it across the same span. */}
          <div className="inst-intake">
          <form className="inst-form" onSubmit={start} noValidate>
            <label className="sr-only" htmlFor="inst-url">
              Your website address
            </label>
            <Frame className="inst-field" single>
              <span className="inst-ghost" aria-hidden="true">
                <i>{url}</i>
                {tail}
              </span>
              <input
                id="inst-url"
                ref={field}
                className="inst-input"
                type="text"
                inputMode="url"
                autoComplete="url"
                spellCheck={false}
                placeholder="yourwebsite.com"
                aria-describedby="inst-url-hint"
                value={url}
                readOnly={locked}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={(e) => {
                  if (!tail) return;
                  const el = e.currentTarget;
                  const atEnd = el.selectionStart === url.length && el.selectionEnd === url.length;
                  if (e.key === "Tab" || (e.key === "ArrowRight" && atEnd)) {
                    e.preventDefault();
                    setUrl(url + tail);
                  }
                }}
              />
              {/* The completion is offered in grey behind the caret; nothing on screen
                  said how to take it, so this does — to everyone, not only to a screen
                  reader. It is only there while there is something to accept. */}
              {tail && !locked && (
                <span className="inst-tab" id="inst-url-hint">
                  <kbd>Tab</kbd> to accept {tail}
                </span>
              )}
            </Frame>
            <Cta
              as="button"
              type="submit"
              primary
              className="inst-go"
              label="Check my website"
              disabled={url.trim().length === 0}
              reason="Enter your website address first."
            >
              Check my website
              <ChevronRight className="glyph" aria-hidden="true" />
            </Cta>
          </form>

          {/* The line that used to stand here ("Free check · 30 seconds") is gone. The
              paragraph stays, because it is also where a bad address is reported: it is
              empty and out of the flow until there is an error to carry, so nothing
              holds space under the button in the ordinary case. */}
          {error && (
            <p className="inst-fine is-bad" role="alert">
              {error}
            </p>
          )}

          {/* The ratings belong to the intake, not to the bottom of the screen. They
              are the answer to "why would I hand you my address", so they sit with the
              thing they are vouching for — under the field, inside the same face,
              close enough to read as one block. They go when the face does, which is
              what the foot used to do on its own. */}
          <Awards className="inst-awards inst-awards--intake" logos />
          </div>
        </section>

        {/* ----------------------------------------- 02 · MEASUREMENT ------ */}
        <section className="inst-face" data-face="reading" aria-hidden={stage !== "reading"} inert={stage !== "reading"}>
          {/* The same h2 as the other faces, so the four stages share one heading size. */}
          <h2 className="inst-h2">
            Reading {hostOf(url)}
            {/* Three dots that rise in turn while the reading runs. Decorative only. */}
            <span className="inst-dots" aria-hidden="true">
              <i>.</i><i>.</i><i>.</i>
            </span>
          </h2>
          {/* Mounted only while this face is up, so its clock starts when the reading
              does — mounted from page load it was already near 99% at the first press. */}
          {stage === "reading" && <SweepGauge finish={finishing} />}

          {/* The three category dials, in the same row and the same order they hold on
              03. They are not a second progress bar: nothing is known about any category
              until Google answers, so they carry no number and no band — what travels is
              the needle. When the reading lands, the stage shift settles these same three
              onto their readings instead of putting a new row of dials on screen.

              Mounted on the stage, for the same reason SweepGauge is: their climb is a
              CSS animation, and a CSS animation starts when the element is painted, not
              when the stage opens. Rendered from page load, the 32s run was finished and
              filled forwards long before anyone pressed Check — three needles parked at
              the end of their scale, holding still. */}
          {stage === "reading" && (
            <ul className="inst-dials" aria-label="Scores by category">
              {DIALS.map(([key, label]) => (
                <li key={label}>
                  <ScoreDial label={label} sweep vt={`dial-${key}`} />
                </li>
              ))}
            </ul>
          )}
          {/* FLAGGED (D06): the "Stop the reading" control was removed on request. This
              face now has no way back but the browser's own back. */}
        </section>

        {/* -------------------------------------------- 03 · DIAGNOSIS ----- */}
        <section className="inst-face" data-face="results" data-sample={sample ? "" : undefined} aria-hidden={stage !== "results"} inert={stage !== "results"}>
          {result && low && (
            <>
              {/* No source line. It has been asked for twice now: the face opens on the
                  heading. The receipt still prints "<host> · mobile" at its head, which
                  is where the source is named. Do not put it back. */}
              <h2 className="inst-h2">Results for {hostOf(result.url)}</h2>

              {/* One centred column, at every width: the reading, then the dials, then
                  what it means, then the fixes with the ask laid over them. The two-column
                  split this replaces put the ask beside the reading rather than after it,
                  so the face had two places to start. */}
              <div className="inst-results">
              {/* The headline reading: the weakest of the three, set large, out of 100,
                  with the band named in plain words and Google's own band beside it. */}
              {/* No ground of its own: the box is a WINDOW onto the page's one ground,
                  not a second print of it. It used to mount its own <HeroGround />, which
                  is a separate WebGL canvas with its own clock and its own wave scaled to
                  the box — so the pattern inside never lined up with the pattern behind
                  it, and every stage shift remounted it and restarted the wave from zero
                  while the page's kept running. That is the jump. One canvas, one plane. */}
              {/* The name is carried by whichever face is ON STAGE, never by both: a
                  view-transition name must be unique in the document at the moment it
                  is captured, and 03's box and 04's are in the DOM together the whole
                  time. Named unconditionally, the browser refuses the whole transition
                  ("duplicate view-transition-name") and nothing morphs at all. */}
              <div
                className="inst-headline"
                data-band={bandOf(low.value)}
                style={{ viewTransitionName: stage === "results" ? "reading" : "none" } as CSSProperties}
              >
                <span className="inst-headline-num">
                  {low.value}
                  <small>/100</small>
                </span>
                <span className="inst-headline-say">
                  <b>{low.label}</b>
                  <i>
                    <span className="inst-band" data-band={bandOf(low.value)}>
                      {BAND_NAME[bandOf(low.value)]}
                    </span>
                    <span aria-hidden="true"> · </span>
                    {BAND_RANGE[bandOf(low.value)]}
                  </i>
                </span>
              </div>

              {/* The three categories, each a white half dial: the arc filled to the
                  score in its band's colour, the score in that colour, the name under it. */}
              <ul className="inst-dials" aria-label="Scores by category">
                {stats.map((s, i) => (
                  <li key={s.label}>
                    {/* The same stagger the sweeping dials carry on 02, so the three
                        settle in the order they were travelling in. */}
                    <ScoreDial label={s.label} value={s.value} band={bandOf(s.value)} delay={i * 120} from={swept} vt={`dial-${s.key}`} />
                  </li>
                ))}
              </ul>

              {/* Every category Google answered with is in its good band. `stats` is
                  already the categories that came back, so a missing one cannot make a
                  reading look clean by being absent. */}
              <Fixes
                fixes={fixes}
                green={stats.length > 0 && stats.every((s) => bandOf(s.value) === "good")}
                onBook={() => land(() => setStage("booking"))}
              />
              </div>
            </>
          )}
        </section>

        {/* ----------------------------------------- 04 · CONSULTATION ----- */}
        <section className="inst-face" data-face="booking" aria-hidden={stage !== "booking"} inert={stage !== "booking"}>
          {/* The reading stays on screen while the form is filled in — it is what the
              visitor is deciding about, so it is not turned into wallpaper.

              It is the SAME module 03 leads with (.inst-headline), not a summary of it:
              the score, the category, the band and Google's range, in the double rule.
              A one-line pill said less and looked like a breadcrumb. The address is not
              repeated here — it was asked for two stages ago and is in the form below,
              so saying it a third time is furniture. It carries the headline's own
              view-transition name, so 03 → 04 moves this module up the screen rather
              than swapping one for another. */}
          {low && (
            <>
              <div
                className="inst-headline inst-headline--recap"
                data-band={bandOf(low.value)}
                style={{ viewTransitionName: stage === "booking" ? "reading" : "none" } as CSSProperties}
              >
                <span className="inst-headline-num">
                  {low.value}
                  <small>/100</small>
                </span>
                <span className="inst-headline-say">
                  <b>{low.label}</b>
                  <i>
                    <span className="inst-band" data-band={bandOf(low.value)}>
                      {BAND_NAME[bandOf(low.value)]}
                    </span>
                    <span aria-hidden="true"> · </span>
                    {BAND_RANGE[bandOf(low.value)]}
                  </i>
                </span>
              </div>
            </>
          )}

          <BookingPanel
            site={result?.url ?? url}
            onBack={() => land(() => setStage("results"))}
          />
        </section>
      </div>
    </div>
  );
}

/**
 * The fixes, as a left-aligned list printed on a sheet of paper, cut mid-sentence.
 *
 * It replaces the receipt printer (components/receipt-printer.tsx), which this page no
 * longer uses: a printer body, paper, a tear and a reprint control were a lot of
 * furniture around four lines of advice, and the advice was set at about 8px inside it.
 * The paper is kept because the paper was the good part — a sheet with a list on it is
 * what a finding looks like — but it is now just a sheet, at a size that can be read.
 *
 * The list is LEFT aligned although the rest of the face is centred. It is the only
 * block here that is scanned down rather than read across, and a centred list gives the
 * eye no edge to return to.
 *
 * The last line runs out in the middle of its sentence, on a word boundary, with no
 * ellipsis and no "read more" — an ellipsis reads as a typographic style, a half
 * sentence reads as something held back. That cut is the argument for the next stage,
 * and the ask is laid over it (`.inst-ask`): a double border, above it in z-index, so
 * the thing to press is in front of the thing it is about.
 */
function Fixes({
  fixes,
  green,
  onBook,
}: {
  fixes: NonNullable<Result["fixes"]>;
  /** Every category Google returned is in its good band (90+). */
  green: boolean;
  onBook: () => void;
}) {
  /* Three stand in the clear. Everything after them runs on down the sheet under the
     card, struck through — the sheet is plainly longer than what is being shown. */
  const OPEN = 3;
  const held = Math.max(0, fixes.length - OPEN);
  /* A CLEAN READING STILL HAS AN ASK — a different one.
     The ask below was written for a site in trouble: it points at the list and offers to
     work through it. Shown over a wall of green it argues against itself, and the page
     ends on "you are fine", which is the one ending that cannot convert. So the clean
     reading changes what is being offered rather than how loudly it is offered: these
     are Google's technical checks, which the site clears, and the things that decide
     whether a visitor finds it, trusts it and gets in touch are not measured here at
     all. That is the truth of this report and it is also the pitch — no invented
     problem, no "but did you know", and nothing that contradicts the dials above it or
     a short fix list beside it. */
  const label = green ? "Book a review" : held > 0 ? "Book a review to see them all" : "Book a review";

  const ask = (
    <div className="inst-ask">
      <p className="inst-ask-eyebrow">Assessment complete</p>
      {green ? (
        <>
          <h3 className="inst-ask-h">
            Your website passes.
            <br />
            Passing isn&rsquo;t the same as working.
          </h3>
          <p className="inst-ask-say">
            These are Google&rsquo;s technical checks, and you clear them. What a visitor
            finds, trusts and does next is not in this report — and that is the half a
            review looks at.
          </p>
        </>
      ) : (
        <>
          <h3 className="inst-ask-h">
            The numbers are in.
            <br />
            What&rsquo;s your next move?
          </h3>
          <p className="inst-ask-say">
            We&rsquo;ve measured your website. Now let&rsquo;s put those findings to work.
          </p>
        </>
      )}
      <Cta as="button" type="button" primary className="inst-go" label={label} onActivate={onBook}>
        {label}
      </Cta>
    </div>
  );

  if (fixes.length === 0) return <div className="inst-fixes">{ask}</div>;

  return (
    <div className="inst-fixes">
      <div className="inst-paper">
        {/* "Top fixes" over a green reading overstates what the list is: on a site that
            clears every band these are housekeeping, and calling them fixes fights the
            card below. */}
        <h3 className="inst-fixes-h">{green ? "Still on the list" : "Top fixes"}</h3>
        <ol className="inst-fixes-list">
          {fixes.slice(0, OPEN).map((f, i) => {
            const saved = savingOf(f.detail);
            return (
              <li key={f.id ?? i}>
                <i>{i + 1}</i>
                <b>{plain(f.title)}</b>
                {/* The saving as a figure in its own column, right aligned on the
                    sheet's edge — Lighthouse's sentence ("Potential savings of 1,850
                    ms") reduced to the measurement it carries. A detail that is not a
                    saving keeps its own words and sits under the title instead. */}
                {saved ? <em>{saved}</em> : f.detail ? <span>{f.detail}</span> : null}
              </li>
            );
          })}

          {/* THE REST OF THE SHEET.
              Every other fix Google found, set exactly like the three above it — same
              columns, same hairlines, one continuous list — and running on underneath
              the card, which is laid over the foot of the paper. The sheet is plainly
              longer than the part anyone gets to read, and what is in the way is the
              thing you press.

              It is real text, deliberately: anyone who opens the inspector can read all
              of it, and the line at the end of the list is addressed to them. The fixes
              are Google's own audit titles, not a secret — what the review is for is
              working through them, which is not something the DOM can hand over. */}
          {fixes.slice(OPEN).map((f, i) => {
            const saved = savingOf(f.detail);
            return (
              <li key={f.id ?? `held-${i}`}>
                <i>{OPEN + i + 1}</i>
                <b>{plain(f.title)}</b>
                {saved ? <em>{saved}</em> : f.detail ? <span>{f.detail}</span> : null}
              </li>
            );
          })}

          {held > 0 && (
            <li className="is-held-say">
              <i aria-hidden="true">&bull;</i>
              <b>
                Caught you in the inspector. Fair enough — but reading the list is the
                easy half.{" "}
                {green
                  ? <>Nothing here is on fire. What a review is for is the part Google does not measure.</>
                  : <>Book the review and we&rsquo;ll work through all {fixes.length} of them with you.</>}
              </b>
            </li>
          )}
        </ol>
      </div>
      {ask}
    </div>
  );
}


/**
 * The measurement out of Lighthouse's own sentence, or null if there is not one.
 *
 * It says "Potential savings of 1,850 ms" / "Est savings of 412 KiB"; the list wants
 * the figure on its own, in a column. Anything that does not open with one of those
 * phrases is left alone and shown whole — the wording is Google's and is not rewritten
 * here, only trimmed where the lead-in is known.
 */
function savingOf(detail: string | null) {
  if (!detail) return null;
  const m = /^(?:potential|est(?:imated)?)\s+savings\s+of\s+/i.exec(detail);
  return m ? detail.slice(m[0].length) : null;
}


/**
 * The day strip and the times under it.
 *
 * Presentational: it holds no openings and sends nothing. Which day is open and which
 * time is asked for live in BookingPanel, so the payload is assembled in one place.
 *
 * The day plates scroll sideways in one row and never stack (D06). Each is a weekday
 * over a date, set the way the dials set a figure over a label — the same two-line
 * readout at a smaller size. `scroll-snap` on the strip so a flicked day lands square.
 */
function SlotPicker({
  days,
  day,
  slot,
  onDay,
  onSlot,
}: {
  days: Array<[string, Slot[]]>;
  day: number;
  slot: Slot | null;
  onDay: (i: number) => void;
  onSlot: (s: Slot) => void;
}) {
  const here = Math.min(day, days.length - 1);
  const open = days[here];
  const times = open ? open[1] : [];
  const strip = useRef<HTMLDivElement>(null);

  /* PULLING THE RAIL SIDEWAYS.
     There is no scrollbar under the dates any more, so the row has to move the way a
     row of cards is expected to: grab it and pull, and let it carry on a little when
     let go. Touch is left to the platform — a finger already gets momentum, and
     handling the same gesture twice fights it — so this is mouse and pen only, plus a
     wheel that is turned sideways over the rail.
     The glide holds `is-dragging` until it stops, because snap and a decaying scroll
     pull in opposite directions; the class drops at the end and the nearest plate
     lands square. A drag past the slop swallows the click that follows it, so pulling
     the rail never picks a day by accident. */
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    const calm = matchMedia("(prefers-reduced-motion: reduce)");
    let down = false, moved = false, id = -1;
    let startX = 0, startLeft = 0, lastX = 0, lastT = 0, v = 0, raf = 0;

    const stop = () => { cancelAnimationFrame(raf); raf = 0; el.classList.remove("is-dragging"); };
    const glide = () => {
      v *= 0.94;                       // ~16 frames to rest
      el.scrollLeft -= v * 16;
      const end = el.scrollLeft <= 0 || el.scrollLeft >= el.scrollWidth - el.clientWidth - 1;
      if (Math.abs(v) < 0.02 || end) { stop(); return; }
      raf = requestAnimationFrame(glide);
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" || e.button !== 0) return;
      stop();
      down = true; moved = false; id = e.pointerId;
      startX = lastX = e.clientX; startLeft = el.scrollLeft; lastT = e.timeStamp; v = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (!down || e.pointerId !== id) return;
      const dx = e.clientX - startX;
      if (!moved) {
        if (Math.abs(dx) < 6) return;   // slop, so a click is still a click
        moved = true;
        el.classList.add("is-dragging");
        el.setPointerCapture(id);
      }
      e.preventDefault();
      el.scrollLeft = startLeft - dx;
      const dt = e.timeStamp - lastT;
      if (dt > 0) { v = (e.clientX - lastX) / dt; lastX = e.clientX; lastT = e.timeStamp; }
    };
    const onUp = (e: PointerEvent) => {
      if (!down || e.pointerId !== id) return;
      down = false;
      if (!moved) return;
      if (el.hasPointerCapture(id)) el.releasePointerCapture(id);
      if (calm.matches || Math.abs(v) < 0.05) { stop(); return; }
      raf = requestAnimationFrame(glide);
    };
    const onClick = (e: MouseEvent) => { if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; } };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;   // already sideways
      const room = e.deltaY > 0
        ? el.scrollLeft < el.scrollWidth - el.clientWidth - 1
        : el.scrollLeft > 0;
      if (!room) return;                                       // let the page have it
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("click", onClick, true);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {                                             // G13
      stop();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("click", onClick, true);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  /* ARIA tabs are a roving tab stop, not five of them: one plate is in the page's tab
     order and the arrows move between them (APG). Without this a keyboard visitor is
     told "tab 1 of 5" and then finds the arrow keys do nothing, and tabbing out of the
     strip takes five presses. Moving selection with focus is correct here because the
     panel is the times immediately below and switching it costs nothing. */
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const to = step ? (here + step + days.length) % days.length
      : e.key === "Home" ? 0
      : e.key === "End" ? days.length - 1
      : -1;
    if (to < 0) return;
    e.preventDefault();
    onDay(to);
    strip.current?.querySelectorAll<HTMLButtonElement>(".inst-day")[to]?.focus();
  };

  return (
    <>
      <div className="inst-days" role="tablist" aria-label="Days" ref={strip} onKeyDown={onKey}>
        {days.map(([key, list], i) => {
          const d = slotDay(list[0].start);
          const on = i === here;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              id={`inst-day-${i}`}
              aria-selected={on}
              aria-controls="inst-times"
              tabIndex={on ? 0 : -1}
              className="inst-day"
              onClick={() => onDay(i)}
            >
              <span className="inst-day-dow">{d.dow}</span>
              <span className="inst-day-num">{d.day}</span>
              <span className="inst-day-mon">{d.month}</span>
            </button>
          );
        })}
      </div>

      <div
        className="inst-times"
        role="tabpanel"
        id="inst-times"
        aria-labelledby={`inst-day-${here}`}
      >
        {times.map((t) => {
          const on = slot?.id === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className="inst-time"
              aria-pressed={on}
              onClick={() => onSlot(t)}
            >
              {slotTime(t.start)}
            </button>
          );
        })}
      </div>
    </>
  );
}

function hostOf(url: string) {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname;
  } catch {
    return url;
  }
}

/**
 * The consultation request.
 *
 * Five fields: full name, business email and company name (required), the website (filled
 * in from the check, editable, optional) and what they would like to discuss (optional).
 * Two ways in, chosen on the face: SCHEDULE asks for one of the week's openings (the
 * times are a placeholder — components/tcg/slots.tsx), INTAKE sends the details with no
 * time and TCG replies with some. On success it says the request was sent; it never says
 * anything is booked, because nothing behind this page can hold a time.
 *
 * It posts to /api/book, the same endpoint the site's booking form uses. That route is not
 * in this repository yet, so in practice the post fails and the visitor is handed the same
 * request as a pre-filled email — the same fallback the site's own form uses today.
 */
function BookingPanel({ site, onBack }: { site: string; onBack: () => void }) {
  const [f, setF] = useState({ name: "", email: "", company: "", website: site, message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "fallback">("idle");
  const [bad, setBad] = useState<string[]>([]);
  /* The openings, and the one asked for. Both live here rather than in the picker, so
     the payload is assembled in one place and the picker stays a control. */
  const slots = useSlots();
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<Slot | null>(null);
  /* Changing the day MUST drop the time: the grid below only highlights a slot that
     belongs to the open day, so a time held across a day change is invisible on screen
     and still goes out in the payload — the visitor sees Wednesday and books Monday. */
  const pickDay = (i: number) => {
    setDay(i);
    setSlot(null);
  };
  const set = (k: keyof typeof f) => (v: string) => {
    setF((o) => ({ ...o, [k]: v }));
    setBad((x) => x.filter((y) => y !== k));
  };

  const mailto = () => {
    const lines = [
      f.website && `Website: ${f.website}`,
      f.company && `Company: ${f.company}`,
      f.message && `\n${f.message}`,
      "",
      f.name,
      f.email,
    ]
      .filter(Boolean)
      .join("\n");
    return `mailto:${CONTACT.email}?subject=${encodeURIComponent(
      `Fix my site: ${f.website || f.company}`,
    )}&body=${encodeURIComponent(lines)}`;
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const miss: string[] = (["name", "email", "company"] as const).filter((k) => !f[k].trim());
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) miss.push("email");
    if (miss.length) {
      setBad(miss);
      document.querySelector<HTMLElement>(`.inst-book-form [name="${miss[0]}"]`)?.focus();
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: f.name,
          email: f.email,
          business: f.company,
          website: f.website,
          message: f.message,
          /* The time asked for, as the booking system's own id and the instant it
             stands for. See components/tcg/slots.tsx for the contract — and note that
             this is a REQUEST for that time, not a claim on it. */
          slot: slot ? { id: slot.id, start: slot.start } : null,
          /* Read off the form rather than chosen: a request with a time is a scheduling
             request, one without is an intake and TCG replies with times. */
          mode: slot ? "schedule" : "intake",
          goal: "website-check",
          goalLabel: "Website check",
          services: ["Website assessment"],
          source: "check-2",
          page: location.href,
        }),
      });
      setStatus(res.ok ? "sent" : "fallback");
    } catch {
      setStatus("fallback");
    }
  };

  if (status === "sent") {
    return (
      <div className="inst-done" role="status">
        <span className="inst-done-mark" aria-hidden="true">
          <Check className="glyph" />
        </span>
        <h2 className="inst-h2">Request sent.</h2>
        {/* A time was ASKED FOR, not taken. Nothing behind this page can hold one (see
            components/tcg/slots.tsx), so the copy says what is true: we come back to
            confirm it. If the endpoint is ever wired to a calendar that really does
            hold the slot, this is the sentence that has to change with it. */}
        <p>
          We&rsquo;ll review {hostOf(f.website || site)} and come back to confirm
          {slot ? <> <b>{slotDay(slot.start).dow} {slotDay(slot.start).day} {slotDay(slot.start).month} at {slotTime(slot.start)}</b></> : " a time"}.
          Nothing is held yet — usually within one business day.
        </p>
        <p className="inst-fine">
          Need it sooner? Call <a href={CONTACT.tel}>{CONTACT.phone}</a>.
        </p>
        <button type="button" className="inst-back" onClick={onBack}>
          Back to the readings
        </button>
      </div>
    );
  }

  const field = (
    k: keyof typeof f,
    label: string,
    props: InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <label className="inst-label">
      <span>{label}</span>
      <Frame className="inst-field inst-field--sm" single>
        <input
          className="inst-input"
          name={k}
          value={f[k]}
          aria-invalid={bad.includes(k) || undefined}
          onChange={(e) => set(k)(e.target.value)}
          {...props}
        />
      </Frame>
    </label>
  );

  return (
    <div className="inst-book">
      <div className="inst-say">
        <h2 className="inst-h2">Let&rsquo;s take a closer look.</h2>
        <p className="inst-lede">
          We&rsquo;ll review your website for unexpected redirects and browser warnings, then
          explain what we find.
        </p>
      </div>

      <form className="inst-book-form" onSubmit={send} noValidate>
        <div className="inst-row">
          {field("name", "Full name", { autoComplete: "name", maxLength: 80 })}
          {field("email", "Business email", { type: "email", autoComplete: "email", maxLength: 120 })}
        </div>
        <div className="inst-row">
          {field("company", "Company name", { autoComplete: "organization", maxLength: 120 })}
          {field("website", "Website (optional)", { inputMode: "url", autoComplete: "url", maxLength: 200 })}
        </div>
        <label className="inst-label">
          <span>What would you like to discuss? (optional)</span>
          <Frame className="inst-field inst-field--area" single>
            <textarea
              className="inst-input inst-textarea"
              name="message"
              rows={3}
              maxLength={1000}
              value={f.message}
              onChange={(e) => set("message")(e.target.value)}
            />
          </Frame>
        </label>

        {/* The two ways in, on the one screen rather than behind a switch: the fields
            above are the intake and stand on their own, and under this rule is the week,
            for anyone who would rather take a time now. Picking one is optional — the
            submit sends either way — so the rule reads "Or" and not a heading. */}
        <p className="inst-or"><span>Or</span></p>

        {/* THE OPENINGS.
            Drawn from the instrument's own language rather than a calendar widget: the
            days are a strip of plates that scrolls sideways in ONE row (D06, never
            stacked), each one a weekday over a date the way a dial carries a figure
            over a label; the times under it are outline controls on the same plate
            stock as the dial faces. The chosen one fills STEEL, not orange — the brand
            keeps orange for the one thing the screen wants pressed, which is the
            submit at the foot of this form, and a filled time would be a second main
            CTA (D04).

            D07: it has its own waiting state at its own height, so the form does not
            jump when the times land, and its own empty state for a week with nothing
            in it. */}
        <fieldset className="inst-when">
          <legend className="inst-when-h">
            Schedule a time
            {/* The zone is named for the week being shown, from its first opening —
                not from the clock, which a component may not read as it renders. */}
            {slots && slots.length > 0 && (
              <small>
                {tzLabel(slots[0].start)} <span aria-hidden="true">·</span> 30 minutes
              </small>
            )}
          </legend>

          {slots === null && <p className="inst-when-wait">Loading the week&rsquo;s openings…</p>}

          {slots !== null && slots.length === 0 && (
            <p className="inst-when-wait">
              Nothing open this week. Send the request and we&rsquo;ll come back with times.
            </p>
          )}

          {slots !== null && slots.length > 0 && (
            <SlotPicker
              days={byDay(slots)}
              day={day}
              slot={slot}
              onDay={pickDay}
              onSlot={setSlot}
            />
          )}
        </fieldset>

        {bad.length > 0 && (
          <p className="inst-bad" role="alert">
            {bad.includes("email") && f.email
              ? "That email address looks incomplete."
              : "Your name, business email and company name, and we can reply."}
          </p>
        )}

        {status === "fallback" && (
          <p className="inst-bad" role="alert">
            We couldn&rsquo;t send that from the page just now.{" "}
            <a href={mailto()}>Send it as an email instead</a> (it&rsquo;s filled in), or call{" "}
            <a href={CONTACT.tel}>{CONTACT.phone}</a>.
          </p>
        )}

        <div className="inst-book-foot">
          {/* The one thing to press on this face, and it looks it: the diagnosis CTA's
              own orange fill (.inst-go), centred and spanning the form's full width. It
              was an outline button the width of its label, which made the conversion
              moment the quietest control on the screen. */}
          <Cta
            as="button"
            type="submit"
            primary
            className="inst-go inst-go--wide"
            label="Fix my site"
            disabled={status === "sending"}
            reason="Your name, business email and company name first."
          >
            {status === "sending" ? "Sending…" : "Fix my site"}
          </Cta>
        </div>
      </form>

      {/* The ratings from the cover, as the reason to trust the ask. */}
      <Awards className="inst-awards inst-book-awards" logos />
    </div>
  );
}
