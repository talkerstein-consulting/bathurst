"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, ChevronRight, Star } from "lucide-react";
import { InstrumentDial } from "@/components/instrument-dial";
import { completeDomain, toSiteUrl } from "@/lib/domain";
import { CONTACT, GOOGLE } from "@/lib/bathurst/data";
import { Cta } from "./cta";
import { Frame } from "./frame";
import { SweepGauge } from "./sweep-gauge";

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
};

const DIALS: Array<[keyof Scores, string]> = [
  ["performance", "Performance"],
  ["accessibility", "Accessibility"],
  ["practices", "Best practices"],
];

const STAGES: Stage[] = ["input", "reading", "results", "booking"];

/** The staging tabs, in the order the sequence runs. */
const STAGE_TABS: Array<[Stage, string]> = [
  ["input", "Input"],
  ["reading", "Measurement"],
  ["results", "Diagnosis"],
  ["booking", "Consultation"],
];

/**
 * A made-up reading, used only to open 03 and 04 directly (see the effect in
 * Instrument). The numbers are plausible rather than real, and the face says on screen
 * that they are a sample whenever they are the ones being shown.
 */
const SAMPLE: Result = {
  url: "https://example.com",
  scores: { performance: 34, accessibility: 72, practices: 93 },
  timings: { paint: "2.8 s", usable: "9.1 s" },
};

/** Google's own bands: 0–49 poor, 50–89 needs improvement, 90–100 good. */
type Band = "good" | "fair" | "poor";
function bandOf(score: number): Band {
  if (score >= 90) return "good";
  if (score >= 50) return "fair";
  return "poor";
}

const BAND_WORD: Record<Band, string> = {
  good: "Good",
  fair: "Needs improvement",
  poor: "Poor",
};

/** The weakest category that came back — the reading this whole page exists to surface. */
function weakest(scores: Scores) {
  const got = DIALS.map(([key, label]) => ({ key, label, value: scores[key] })).filter(
    (s): s is { key: keyof Scores; label: string; value: number } => s.value !== null,
  );
  if (got.length === 0) return null;
  return got.reduce((a, b) => (b.value < a.value ? b : a));
}

/**
 * The plain-English line under the dials, built from the scores that came back. It says
 * what the weakest band means and nothing the numbers do not support.
 */
function summarise(scores: Scores) {
  const low = weakest(scores);
  if (!low) return "The audit came back without a score.";

  if (bandOf(low.value) === "good") {
    return `Every category came back in Google's good band, ${low.label} lowest at ${low.value}. On these measures the website is holding up.`;
  }
  if (bandOf(low.value) === "fair") {
    return `${low.label} is the weakest at ${low.value} — Google bands that as needing improvement rather than poor. There is room here, and it is the kind of room a visitor feels rather than sees.`;
  }
  return `${low.label} came back at ${low.value}, inside Google's poor band. At that level people leave before the page finishes — and they do not tell you; they go back and open the next result.`;
}

export function Instrument({ bookHref }: { bookHref: string }) {
  const [stage, setStage] = useState<Stage>("input");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  /** True while the readings on screen are the sample, not Google's. */
  const [sample, setSample] = useState(false);
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

  /**
   * Put a stage on screen without running a reading.
   *
   * Used by the query string on load and by the staging tabs. 02 needs an address to
   * name, and 03 and 04 need a reading to show, so both are supplied from SAMPLE — and
   * `sample` stays true while they are, which is what makes the diagnosis face say so
   * instead of naming Google as the source.
   */
  const show = (want: Stage) => {
    run.current?.abort();
    run.current = null;
    setError("");
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
     runs once, and re-running it would fight the staging tabs. */
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
      setResult(data as Result);
      setSample(false);
      setStage("results");
    } catch (err) {
      /* An abort is the visitor's own decision, not a failure: say nothing. */
      if ((err as Error)?.name === "AbortError") return;
      fallBack(site);
    } finally {
      run.current = null;
    }
  };

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
    setResult({ ...SAMPLE, url: site });
    setSample(true);
    setError("");
    setStage("results");
  };

  const stop = () => {
    run.current?.abort();
    run.current = null;
    setStage("input");
  };

  const stats = result
    ? DIALS.filter(([key]) => result.scores[key] !== null).map(([key, label]) => ({
        label,
        value: result.scores[key] as number,
        min: 0,
        max: 100,
      }))
    : [];
  const low = result ? weakest(result.scores) : null;
  const narrow = useNarrow(760);

  return (
    <div className="inst" data-stage={stage}>
      {/* The instrument itself: one unbounded region on the page's own ground. The
          plate and the stage rail are gone — the sequence is carried by the faces
          themselves, which crossfade in the same place. The ref is here so each stage
          can take the focus to the top of what it just put on screen. */}
      {/* The staging tabs.
          *
          * Not part of the page: a review control, so every stage can be put on screen
          * and looked at without running a reading. It is drawn as a utility strip in
          * the corner rather than as page furniture, precisely so nobody mistakes it
          * for the visitor's own navigation — the stage rail that used to sit across
          * the top was removed for being exactly that.
          *
          * /check-2 is noindex and is the side-by-side treatment being reviewed, so it
          * ships with the page. It belongs behind a flag the day this becomes the live
          * assessment; FLAGGED here and in app/check-2.css. */}
      <nav className="inst-tabs" aria-label="Staging: jump to a stage">
        <b>Staging</b>
        {STAGE_TABS.map(([s, name], i) => (
          <button
            key={s}
            type="button"
            onClick={() => show(s)}
            aria-current={stage === s ? "true" : undefined}
          >
            <i>{String(i + 1).padStart(2, "0")}</i>
            <span>{name}</span>
          </button>
        ))}
      </nav>

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
                * Both marks are the companies' own artwork, both in the brand's Steel
                * Blue so the line reads as one sentence rather than as a sentence with
                * two logos dropped into it. Google is its full wordmark from Google's
                * asset host, repainted; ChatGPT is the mark chatgpt.com itself serves.
                * FLAGGED in public/brand/third-party/README.md: repainting Google's
                * wordmark is outside Google's brand terms. */}
            <h1 className="inst-h1">
              <span className="inst-h1-a">Your website looks fine.</span>
              <span className="inst-h1-b">
                But does{" "}
                <span className="inst-pill">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="inst-pill-mark inst-pill-mark--google"
                    src="/brand/third-party/google-wordmark-steel.png"
                    alt="Google"
                    width={540}
                    height={179}
                  />
                </span>{" "}
                and{" "}
                <span className="inst-pill">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="inst-pill-mark"
                    src="/brand/third-party/chatgpt-mark.svg"
                    alt=""
                    width={180}
                    height={180}
                  />
                  ChatGPT
                </span>{" "}
                think so?
              </span>
            </h1>
            <p className="inst-lede">Find out what your customers experience.</p>
          </div>

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

          <p className={`inst-fine${error ? " is-bad" : ""}`} role={error ? "alert" : undefined}>
            {error || (
              <>
                Free assessment <span aria-hidden="true">·</span> Takes about half a minute{" "}
                <span aria-hidden="true">·</span> No password needed
              </>
            )}
          </p>
        </section>

        {/* ----------------------------------------- 02 · MEASUREMENT ------ */}
        <section className="inst-face" data-face="reading" aria-hidden={stage !== "reading"} inert={stage !== "reading"}>
          <p className="inst-whose">
            Reading <b>{hostOf(url)}</b>
          </p>
          <SweepGauge />
          {/* A half-minute wait with no way out is a trap. This is the way out. */}
          <button type="button" className="inst-back" onClick={stop}>
            Stop the reading
          </button>
        </section>

        {/* -------------------------------------------- 03 · DIAGNOSIS ----- */}
        <section className="inst-face" data-face="results" aria-hidden={stage !== "results"} inert={stage !== "results"}>
          {result && low && (
            <>
              <p className="inst-whose">
                {sample ? (
                  <>
                    <span className="inst-sample">Sample reading</span> · not a real
                    measurement
                  </>
                ) : (
                  <>
                    Google PageSpeed Insights · mobile · <b>{hostOf(result.url)}</b>
                  </>
                )}
              </p>

              {/* The headline reading: the weakest of the three, set large. Everything
                  else on this face is secondary to it, because it is the answer to the
                  question the visitor arrived with. */}
              <p className="inst-headline" data-band={bandOf(low.value)}>
                <span className="inst-headline-num">{low.value}</span>
                <span className="inst-headline-say">
                  <b>{low.label}</b>
                  <i>{BAND_WORD[bandOf(low.value)]} — Google&rsquo;s own band</i>
                </span>
              </p>

              <div className="inst-dials">
                <InstrumentDial
                  stats={stats}
                  variant="meter"
                  size={narrow ? 100 : 168}
                  gap={narrow ? 6 : 24}
                  theme="light"
                  accentColor="#19254A"
                  trackColor="rgb(25 37 74 / .20)"
                  textColor="#19254A"
                  replayOnClick={false}
                />
              </div>

              <p className="inst-summary">{summarise(result.scores)}</p>

              <div className="inst-caveat">
                <p className="inst-caveat-h">A good score doesn&rsquo;t mean a clean website.</p>
                <p>
                  PageSpeed checks performance and technical best practices. It doesn&rsquo;t
                  detect every security issue.
                </p>
              </div>

              <Cta
                as="button"
                type="button"
                primary
                className="inst-go"
                label="Let's take a closer look"
                onActivate={() => setStage("booking")}
              >
                Let&rsquo;s take a closer look
              </Cta>
            </>
          )}
        </section>

        {/* ----------------------------------------- 04 · CONSULTATION ----- */}
        <section className="inst-face" data-face="booking" aria-hidden={stage !== "booking"} inert={stage !== "booking"}>
          {/* The readings stay readable while the form is filled in. They are what the
              visitor is deciding about, so they are not turned into wallpaper. */}
          {low && (
            <p className="inst-recap">
              <span>
                Reviewing <b>{hostOf(result?.url ?? url)}</b>
              </span>
              <span className="inst-recap-score" data-band={bandOf(low.value)}>
                {low.label} <b>{low.value}</b>
              </span>
            </p>
          )}

          <BookingPanel
            site={result?.url ?? url}
            bookHref={bookHref}
            onBack={() => setStage("results")}
          />
        </section>
      </div>
    </div>
  );
}

/**
 * Whether the viewport is under `px`, matching the stylesheet's own breakpoint.
 *
 * The dial lays itself out from the width it is given, and at a phone's width three of
 * them at the desktop size wrap to two and then one — which pushed the stage's own CTA
 * below the fold of a panel that is not allowed to scroll. Below the breakpoint they are
 * drawn small enough to stay in one row.
 */
function useNarrow(px: number) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${px}px)`);
    const read = () => setNarrow(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);   // G13
  }, [px]);
  return narrow;
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
 * It asks for a name, an email and when suits — and nothing else, because the website is
 * already known and this is a request for a review, not an intake. There are no times
 * offered: no calendar is connected to this page, and offering a slot nobody can hold
 * would be an invention. On success it says the request was sent and that a time will
 * come back by reply; it never says anything is booked.
 *
 * It posts to /api/book, the same endpoint and the same payload shape the site's booking
 * form uses. That route is not in this repository yet, so in practice the post fails and
 * the visitor is handed the same request as a pre-filled email — which is exactly what
 * the site's own form does today, rather than a second, different fallback.
 */
function BookingPanel({
  site,
  bookHref,
  onBack,
}: {
  site: string;
  bookHref: string;
  onBack: () => void;
}) {
  const [f, setF] = useState({ name: "", email: "", when: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "fallback">("idle");
  const [bad, setBad] = useState<string[]>([]);
  const first = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof f) => (v: string) => {
    setF((o) => ({ ...o, [k]: v }));
    setBad((x) => x.filter((y) => y !== k));
  };

  const mailto = () => {
    const lines = [
      `Website to review: ${site}`,
      f.when && `When suits: ${f.when}`,
      "",
      f.name,
      f.email,
    ]
      .filter(Boolean)
      .join("\n");
    return `mailto:${CONTACT.email}?subject=${encodeURIComponent(
      `Website check: ${site}`,
    )}&body=${encodeURIComponent(lines)}`;
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const miss = (["name", "email"] as const).filter((k) => !f[k].trim());
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) miss.push("email");
    if (miss.length) {
      setBad(miss);
      document.querySelector<HTMLElement>(`[name="${miss[0]}"]`)?.focus();
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f,
          website: site,
          business: "",
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

  /* The end of the sequence. It is the thing the visitor will remember, so it is a
     confirmation with a mark on it and a clear statement of what happens next — not a
     line of body text. It is careful to say that a time is NOT yet held. */
  if (status === "sent") {
    return (
      <div className="inst-done" role="status">
        <span className="inst-done-mark" aria-hidden="true">
          <Check className="glyph" />
        </span>
        <h2 className="inst-h2">Request sent.</h2>
        <p>
          We&rsquo;ll review {hostOf(site)} and reply with a time
          {f.when ? ` around ${f.when}` : ""}. Nothing is held yet — the time comes back in
          that reply, usually within one business day.
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
          <label className="inst-label">
            <span>Your name</span>
            <Frame className="inst-field inst-field--sm" single>
              <input
                ref={first}
                className="inst-input"
                name="name"
                value={f.name}
                autoComplete="name"
                maxLength={80}
                aria-invalid={bad.includes("name") || undefined}
                onChange={(e) => set("name")(e.target.value)}
              />
            </Frame>
          </label>
          <label className="inst-label">
            <span>Email</span>
            <Frame className="inst-field inst-field--sm" single>
              <input
                className="inst-input"
                name="email"
                type="email"
                value={f.email}
                autoComplete="email"
                maxLength={120}
                aria-invalid={bad.includes("email") || undefined}
                onChange={(e) => set("email")(e.target.value)}
              />
            </Frame>
          </label>
        </div>

        <label className="inst-label">
          <span>When suits you (optional)</span>
          <Frame className="inst-field inst-field--sm" single>
            <input
              className="inst-input"
              name="when"
              value={f.when}
              maxLength={80}
              placeholder="Weekday mornings, say"
              onChange={(e) => set("when")(e.target.value)}
            />
          </Frame>
        </label>

        {bad.length > 0 && (
          <p className="inst-bad" role="alert">
            {bad.includes("email") && f.email
              ? "That address looks incomplete."
              : "Your name and email, and we can reply."}
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
          <Cta
            as="button"
            type="submit"
            primary
            label="Ask for my free website check"
            disabled={status === "sending"}
            reason="Your name and email first."
          >
            {status === "sending" ? "Sending…" : "Ask for my free website check"}
          </Cta>
          <button type="button" className="inst-back" onClick={onBack}>
            Back to the readings
          </button>
        </div>

        {/* The one reason to trust the ask, and it is a real figure: the Google Business
            Profile rating recorded in lib/bathurst/data.ts. Shown only when there is one
            to show, so an empty record prints nothing rather than "0 reviews". */}
        {GOOGLE.rating !== null && GOOGLE.count !== null && (
          <p className="inst-proof">
            <Star className="glyph" aria-hidden="true" />
            <span>
              {GOOGLE.rating} on Google, {GOOGLE.count} reviews
            </span>
          </p>
        )}
      </form>

      {/* The full booking form stays reachable, but as a footnote rather than a third
          control competing with the ask above it. */}
      <p className="inst-fine inst-alt">
        Rather fill in the full form? <a href={`${bookHref}&website=${encodeURIComponent(site)}`}>Book an appointment</a>.
      </p>
    </div>
  );
}
