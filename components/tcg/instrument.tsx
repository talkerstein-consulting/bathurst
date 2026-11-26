"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { InstrumentDial } from "@/components/instrument-dial";
import { completeDomain, toSiteUrl } from "@/lib/domain";
import { CONTACT } from "@/lib/bathurst/data";
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
 *   04 CONSULTATION it makes room — the dials recede to a strip and the booking opens
 *
 * The continuity is deliberate: 02 and 03 are the same semicircular face at two sizes
 * (the dial's `meter` variant), and 04 keeps those same three faces at the top of the
 * panel rather than replacing them. Position, shape and hierarchy carry across; nothing
 * slides in from off screen.
 *
 * WHAT IS REAL AND WHAT IS NOT:
 *  - The scores are Google's, from /api/pagespeed. Nothing here re-weights or re-grades
 *    them, and the summary under them is written from the numbers that came back.
 *  - The gauge in 02 is indeterminate, because PageSpeed reports nothing until it is
 *    done. See ./sweep-gauge.tsx.
 *  - 04 sends a request; it does not book a time. There are no slots on this page,
 *    because there is no calendar behind it to read them from. It posts the same payload
 *    to the same endpoint as the site's own booking form
 *    (components/bathurst/BookingForm.tsx), and falls back to a pre-filled email the same
 *    way when that endpoint is not there.
 *
 * This is a PageSpeed assessment, not a security scan, and the copy in 03 says so in as
 * many words before anyone is asked for anything.
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

/** Google's own bands: 0–49 poor, 50–89 needs improvement, 90–100 good. */
function band(score: number) {
  if (score >= 90) return "good";
  if (score >= 50) return "fair";
  return "poor";
}

/**
 * The plain-English line under the dials, built from the scores that came back. It names
 * the lowest of the three and what that band means, and says nothing the numbers do not
 * support.
 */
function summarise(scores: Scores) {
  const got = DIALS.map(([key, label]) => [label, scores[key]] as const).filter(
    (pair): pair is readonly [string, number] => pair[1] !== null,
  );
  if (got.length === 0) return "The audit came back without a score.";

  const worst = got.reduce((a, b) => (b[1] < a[1] ? b : a));
  const [label, value] = worst;

  if (band(value) === "good") {
    return `Every category came back in Google's good band, the lowest being ${label} at ${value}. On these measures the website is holding up.`;
  }
  if (band(value) === "fair") {
    return `${label} is the weakest at ${value}, which Google bands as needing improvement rather than poor. There is room here, and it is the kind of room a visitor feels rather than sees.`;
  }
  return `${label} came back at ${value}, inside Google's poor band. At that level people are leaving before the page finishes — and they do not tell you; they go back and open the next result.`;
}

export function Instrument({ bookHref }: { bookHref: string }) {
  const [stage, setStage] = useState<Stage>("input");
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const field = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const tail = completeDomain(url);
  const locked = stage !== "input";

  /* Each stage takes the focus to the top of what it just put on screen, so the keyboard
     follows the instrument instead of being left on a field that is now inert. */
  useEffect(() => {
    if (stage === "input") return;
    panel.current?.focus({ preventScroll: true });
  }, [stage]);

  const run = async (e: FormEvent) => {
    e.preventDefault();
    const site = toSiteUrl(url + tail);
    if (!site) {
      setError("That doesn’t look like a website address. Try it as example.com.");
      return;
    }
    setUrl(url + tail);          // the field keeps what was actually checked
    setError("");
    setResult(null);
    setStage("reading");
    try {
      const answer = await fetch("/api/pagespeed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: site }),
      });
      const data = await answer.json();
      if (!answer.ok) {
        setError(typeof data?.error === "string" ? data.error : "We couldn’t check that website.");
        setStage("input");
        return;
      }
      setResult(data as Result);
      setStage("results");
    } catch {
      setError("The check didn’t come back. Try again in a moment.");
      setStage("input");
    }
  };

  const stats = result
    ? DIALS.filter(([key]) => result.scores[key] !== null).map(([key, label]) => ({
        label,
        value: result.scores[key] as number,
        min: 0,
        max: 100,
      }))
    : [];

  return (
    <div className="inst" data-stage={stage}>
      <div className="inst-panel" ref={panel} tabIndex={-1}>
        {/* The stage marker: the one piece of chrome that is on screen throughout, so the
            visitor can see the instrument moving through its sequence. */}
        <ol className="inst-steps" aria-label="Where you are">
          {(["input", "reading", "results", "booking"] as Stage[]).map((s, i) => (
            <li key={s} data-on={stage === s ? "true" : "false"} data-done={stageIndex(stage) > i ? "true" : "false"}>
              <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <b>{["Input", "Measurement", "Diagnosis", "Consultation"][i]}</b>
            </li>
          ))}
        </ol>

        {/* ----------------------------------------------- 01 · INPUT ------ */}
        <section className="inst-face" data-face="input" aria-hidden={stage !== "input"} inert={stage !== "input"}>
          <h1 className="inst-h1">
            Your website looks fine. <span>TO YOU.</span>
          </h1>
          <p className="inst-lede">
            Does it for everyone? Find out what your customers experience.
          </p>

          <form className="inst-form" onSubmit={run} noValidate>
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
            </Cta>
          </form>

          <p className="inst-fine" role={error ? "alert" : undefined}>
            {error || "Free assessment. No password needed."}
          </p>
        </section>

        {/* ----------------------------------------- 02 · MEASUREMENT ------ */}
        <section className="inst-face" data-face="reading" aria-hidden={stage !== "reading"} inert={stage !== "reading"}>
          <p className="inst-whose">Reading {hostOf(url)}</p>
          <SweepGauge />
        </section>

        {/* -------------------------------------------- 03 · DIAGNOSIS ----- */}
        <section className="inst-face" data-face="results" aria-hidden={stage !== "results"} inert={stage !== "results"}>
          {result && (
            <>
              <p className="inst-whose">
                Google PageSpeed Insights · mobile · <b>{hostOf(result.url)}</b>
              </p>

              <div className="inst-dials">
                <InstrumentDial
                  stats={stats}
                  variant="meter"
                  size={200}
                  gap={28}
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
          {/* The same three faces, moved aside rather than replaced. */}
          <div className="inst-strip" aria-hidden="true">
            <InstrumentDial
              stats={stats}
              variant="meter"
              size={96}
              gap={16}
              theme="light"
              accentColor="#19254A"
              trackColor="rgb(25 37 74 / .20)"
              textColor="#19254A"
              replayOnClick={false}
              hand={false}
            />
          </div>

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

function stageIndex(stage: Stage) {
  return ["input", "reading", "results", "booking"].indexOf(stage);
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

  if (status === "sent") {
    return (
      <div className="inst-done" role="status">
        <h2 className="inst-h2">Request sent.</h2>
        <p>
          We&rsquo;ll look at {hostOf(site)} and reply with a time{f.when ? ` around ${f.when}` : ""}.
          Nothing is booked yet — the time comes back in that reply.
        </p>
        <button type="button" className="inst-back" onClick={onBack}>
          Back to the readings
        </button>
      </div>
    );
  }

  return (
    <div className="inst-book">
      <h2 className="inst-h2">Let&rsquo;s take a closer look.</h2>
      <p className="inst-lede">
        We&rsquo;ll review your website for unexpected redirects and browser warnings, then
        explain what we find.
      </p>

      <form className="inst-book-form" onSubmit={send} noValidate>
        <p className="inst-carried">
          Reviewing <b>{hostOf(site)}</b>
        </p>

        <div className="inst-row">
          <label className="inst-label">
            <span>Your name</span>
            <input
              className="inst-input inst-input--box"
              name="name"
              value={f.name}
              autoComplete="name"
              aria-invalid={bad.includes("name") || undefined}
              onChange={(e) => set("name")(e.target.value)}
            />
          </label>
          <label className="inst-label">
            <span>Email</span>
            <input
              className="inst-input inst-input--box"
              name="email"
              type="email"
              value={f.email}
              autoComplete="email"
              aria-invalid={bad.includes("email") || undefined}
              onChange={(e) => set("email")(e.target.value)}
            />
          </label>
        </div>

        <label className="inst-label">
          <span>When suits you (optional)</span>
          <input
            className="inst-input inst-input--box"
            name="when"
            value={f.when}
            placeholder="Weekday mornings, say"
            onChange={(e) => set("when")(e.target.value)}
          />
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
            small
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

        <p className="inst-fine">
          No obligation. Rather use the full form?{" "}
          <a href={`${bookHref}&website=${encodeURIComponent(site)}`}>Book an appointment</a>.
        </p>
      </form>
    </div>
  );
}
