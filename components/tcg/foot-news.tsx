"use client";

import { Check, ChevronRight, CircleAlert } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

/**
 * The footer's letter panel — the newsletter card from React Bits Pro
 * `footer-13`, rebuilt on the brand's own tokens.
 *
 * PLACEHOLDER: there is no list and no endpoint behind this. The submit waits
 * a beat and reports success locally; nothing is sent anywhere and no address
 * is stored. Wire it to the real provider before this ships, and until then
 * the copy claims nothing — no cadence, no subscriber count, no issue dates.
 * (The block arrived advertising "18,400 product teams" and a dated issue.
 * Those were the vendor's invented facts and are gone rather than replaced
 * with invented TCG ones.)
 *
 * The control is an outline, like every CTA on the site, and it is the only
 * CTA in the footer (D04). Its icon is a chevron, not an arrow (D03), and it
 * turns to a check on success. The sending state is marked with aria-disabled
 * rather than the native attribute, so a press still lands and can be answered
 * (D04 disabled feedback).
 */
export function FootNews() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const input = useRef<HTMLInputElement>(null);

  /* G13: the pending timer is cancelled on teardown, so a footer that scrolls
     out of the tree mid-submit cannot set state after it is gone. */
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const check = (value: string) => {
    const v = value.trim();
    if (!v) return "Enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))
      return "That address looks incomplete.";
    return "";
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status !== "idle") return;
    const problem = check(email);
    setError(problem);
    if (problem) {
      input.current?.focus();
      return;
    }
    setStatus("sending");
    timer.current = setTimeout(() => setStatus("done"), 900);
  };

  const help = error ? (
    <span className="foot-news-bad">
      <CircleAlert className="glyph" aria-hidden="true" />
      {error}
    </span>
  ) : status === "done" ? (
    <span className="foot-news-done">
      <Check className="glyph" aria-hidden="true" />
      Thank you — we have your address.
    </span>
  ) : (
    <span>We write when there is something worth sending.</span>
  );

  /* The card is the envelope: the outer element carries the airmail chevron
     and nothing else, and .foot-news-sheet is the card inside it. */
  return (
    <div className="foot-news-card">
      <div className="foot-news-sheet">
        <h2>Notes from the work.</h2>
        <p>
          An occasional letter on what we are building and what we learned
          building it. Leave whenever you like.
        </p>

      <form className="foot-news-form" noValidate onSubmit={submit}>
        <label className="sr-only" htmlFor={`${id}-email`}>
          Email address
        </label>
        <input
          ref={input}
          id={`${id}-email`}
          className="foot-news-input"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(check(e.target.value));
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-help`}
          readOnly={status !== "idle"}
        />
        <button
          type="submit"
          className="foot-sub"
          aria-disabled={status !== "idle"}
        >
          {status === "done" ? "Subscribed" : status === "sending" ? "Sending" : "Subscribe"}
          {status === "done" ? (
            <Check className="glyph" aria-hidden="true" />
          ) : (
            <ChevronRight className="glyph" aria-hidden="true" />
          )}
        </button>
      </form>

      <p className="foot-news-help" id={`${id}-help`} aria-live="polite">
        {help}
      </p>
      </div>
    </div>
  );
}
