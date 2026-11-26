"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { InstrumentDial } from "@/components/instrument-dial";
import { completeDomain, toSiteUrl } from "@/lib/domain";
import { setCheckedSite, useCheckedSite } from "./checked-site";
import { CheckBands } from "./check-bands";
import { Cta } from "./cta";
import { Frame } from "./frame";

/**
 * Sections 01 and 02 of the campaign landing page: the assessment field and the result it
 * produces. They are one component because the result is the field's own answer, and
 * because the two share the loading and error states. The ask (04) is the letter in the
 * footer's envelope, and the pinned bar here watches both ends of the page.
 *
 * The visitor arrives from the campaign email already knowing why they are here, so
 * there is no preamble: the headline, the field, and then whatever the check says.
 *
 * The numbers are Google's (app/api/pagespeed/route.ts). We do not grade them, re-weight
 * them or colour them: the dials are drawn in Steel Blue like every other figure on the
 * site, because a score is not operable and orange belongs to the operable.
 */

type Scores = { performance: number | null; accessibility: number | null; practices: number | null };
type Result = {
  url: string;
  scores: Scores;
  timings: { paint: string | null; usable: string | null };
};

/** What each dial is called, in the order PageSpeed reports them. */
const DIALS: Array<[keyof Scores, string]> = [
  ["performance", "Performance"],
  ["accessibility", "Accessibility"],
  ["practices", "Best practices"],
];

export function CheckLead({
  bookHref,
  children,
}: {
  bookHref: string;
  /** Section 03, handed in by the page so it lands between the results and the ask. */
  children?: ReactNode;
}) {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const results = useRef<HTMLElement | null>(null);

  /* What is still missing from the domain, if anything: "acme" then ".com". */
  const tail = completeDomain(url);

  /* Bring the answer into view once it exists, so the page does not simply grow below
     the fold on a phone. D11: a visitor who asked for less motion is moved there
     without the scroll animation rather than not at all. */
  useEffect(() => {
    if (state !== "done" && state !== "error") return;
    const node = results.current;
    if (!node) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    /* Two frames, so the section is laid out and the browser's scroll anchoring has
       settled before we move: scrolling in the same frame it mounts gets undone. */
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() =>
        node.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" }),
      );
    });
    /* G13 */
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [state]);

  const run = async (e: FormEvent) => {
    e.preventDefault();
    const site = toSiteUrl(url + tail); // submitting takes the suggestion
    if (!site) {
      setState("error");
      setError("That doesn’t look like a website address. Try it as example.com.");
      return;
    }
    setState("running");
    setError("");
    setResult(null);
    try {
      const answer = await fetch("/api/pagespeed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: site }),
      });
      const data = await answer.json();
      if (!answer.ok) {
        setState("error");
        setError(typeof data?.error === "string" ? data.error : "We couldn’t check that website.");
        return;
      }
      setResult(data as Result);
      setCheckedSite((data as Result).url);   // the envelope's ask links with it
      setState("done");
    } catch {
      setState("error");
      setError("The check didn’t come back. Try again in a moment.");
    }
  };

  const running = state === "running";
  /* The dial lays itself out from the width it is given, and at a phone's width three
     dials at the desktop size wrap to two and then one, which orphans the third. Below
     the same 760px the stylesheet breaks at, they are drawn small enough to stay in one
     row — the three scores are read against each other, so they belong side by side. */
  const narrow = useNarrow(760);
  const stats = result
    ? DIALS.filter(([key]) => result.scores[key] !== null).map(([key, label]) => ({
        label,
        value: result.scores[key] as number,
        min: 0,
        max: 100,
      }))
    : [];

  return (
    <>
      {/* ---------------------------------------------- 01 · the assessment -- */}
      <section className="ck-hero" id="check" aria-labelledby="check-h">
        <div className="ck-hero-copy">
          {/* One style for the whole headline, at the client's instruction: no italic
              cut for "To you." and no lighter weight for the question. The only thing
              marking the turn in the sentence is the line it starts on. */}
          <h1 id="check-h" className="ck-h1">
            Your website looks fine. To you.
            <br />
            Does it for everyone?
          </h1>
          <p className="ck-lede">
            Enter your website address. We&rsquo;ll check its performance and show you what your
            customers might be experiencing.
          </p>
        </div>

        <form className="ck-form" onSubmit={run} noValidate>
          <label className="sr-only" htmlFor="ck-url">
            Your website address
          </label>
          <Frame className="ck-field" single>
            {/* The rest of the domain, shown greyed behind the caret; Tab takes it. */}
            <span className="ck-ghost" aria-hidden="true">
              <i>{url}</i>
              {tail}
            </span>
            <input
              id="ck-url"
              name="website"
              className="ck-input"
              type="text"
              inputMode="url"
              autoComplete="url"
              spellCheck={false}
              placeholder="yourwebsite.com"
              aria-describedby={tail ? "ck-hint" : undefined}
              value={url}
              disabled={running}
              onChange={(e) => {
                setUrl(e.target.value);
                if (state === "error") setState("idle");
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
            {tail && (
              <span id="ck-hint" className="sr-only">
                Press Tab to complete {url}
                {tail}
              </span>
            )}
          </Frame>

          <Cta
            as="button"
            type="submit"
            primary
            className="ck-go"
            label={running ? "Checking your website" : "Check my website"}
            disabled={running || url.trim().length === 0}
            reason="Enter your website address first."
          >
            {running ? "Checking…" : "Check my website"}
          </Cta>
        </form>

        <p className="ck-fine">Free assessment. No password needed.</p>
      </section>

      {/* The key to the numbers, directly under the intake. It does not come and go
          with the result: before a check it says what is about to be measured, and
          after one it is how the three dials above are read. */}
      <CheckBands />

      {/* ------------------------------------------------- 02 · the results -- */}
      {/* The section only exists once there is something to say. Before the first check
          the page is the question, not an empty frame waiting to be filled. */}
      {state !== "idle" && (
        <section
          className="ck-results"
          id="results"
          ref={results}
          aria-labelledby="results-h"
          aria-busy={running}
        >
          <h2 id="results-h" className="sr-only">
            What the check found
          </h2>

          <div className="ck-plate" aria-live="polite">
            {running && (
              <p className="ck-state">
                <span className="ck-pulse" aria-hidden="true" />
                Running the check on {url + tail}. Google&rsquo;s audit takes about half a minute.
              </p>
            )}

            {state === "error" && <p className="ck-state ck-state--bad">{error}</p>}

            {state === "done" && result && (
              <>
                <p className="ck-whose">
                  Google PageSpeed Insights · mobile · <b>{hostOf(result.url)}</b>
                </p>
                <InstrumentDial
                  stats={stats}
                  variant="gauge"
                  size={narrow ? 104 : 210}
                  gap={narrow ? 8 : 40}
                  theme="light"
                  accentColor="#19254A"
                  trackColor="rgb(25 37 74 / .20)"
                  textColor="#19254A"
                  replayOnClick={false}
                  className="ck-dials"
                />
                {(result.timings.paint || result.timings.usable) && (
                  <p className="ck-timings">
                    {result.timings.paint && <span>First thing on screen: {result.timings.paint}</span>}
                    {result.timings.usable && <span>Main content loaded: {result.timings.usable}</span>}
                  </p>
                )}
              </>
            )}
          </div>

          {/* The one thing the scores do not say, said plainly under them. */}
          <div className="ck-caveat">
            <h3 className="ck-h3">A good score doesn&rsquo;t mean a clean website.</h3>
            <p>
              PageSpeed checks performance and technical best practices. It doesn&rsquo;t detect
              every security issue.
            </p>
          </div>
        </section>
      )}

      {/* 03 · the security concern, written by the page (app/check/page.tsx). */}
      {children}

      {/* 04 · the ask is no longer a section here: it is the letter inside the
          footer's envelope (components/tcg/check-ask.tsx), which is where the page
          now ends. The pinned bar below still watches it by its id. */}

      <PinnedCta href={bookHref} />
    </>
  );
}

/** Whether the viewport is under `px`. Matches the stylesheet's own breakpoint. */
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

/** The hostname, or the URL itself if it will not parse — never a thrown render. */
function hostOf(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * D04: when no conversion button is on screen, a pinned one is. It watches the two that
 * exist — the hero's field and the closing ask — and shows itself only in the stretch
 * between them, so it never duplicates a button the visitor can already press.
 */
function PinnedCta({ href }: { href: string }) {
  const [show, setShow] = useState(false);
  /* The same pre-filled link the envelope's ask carries, so the two never disagree. */
  const site = useCheckedSite();
  const to = site ? `${href}&website=${encodeURIComponent(site)}` : href;

  useEffect(() => {
    const targets = ["#check", "#next"]
      .map((id) => document.querySelector(id))
      .filter((n): n is Element => Boolean(n));
    if (targets.length === 0) return;

    const seen = new Set<Element>();
    const watch = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) seen.add(entry.target);
          else seen.delete(entry.target);
        }
        setShow(seen.size === 0);
      },
      { threshold: 0.12 },
    );
    targets.forEach((t) => watch.observe(t));
    return () => watch.disconnect();
  }, []);

  return (
    <div className={`ck-pin${show ? " is-on" : ""}`} aria-hidden={!show}>
      <Cta
        as="a"
        href={to}
        primary
        small
        label="Ask for my free website check"
        tabIndex={show ? 0 : -1}
      >
        Free website check
        <ArrowRight className="glyph" aria-hidden="true" />
      </Cta>
    </div>
  );
}
