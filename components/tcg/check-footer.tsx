"use client";

import { Check, ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { CONTACT } from "@/lib/bathurst/data";

/**
 * The /check-2 footer: the shape of vacation.inc's footer, on TCG's style guide.
 *
 * Its parts, in order: a ruled ledger (brand and
 * contact | this page | elsewhere); a newsletter row laid into the same ruling; the
 * consent fine print; a row of outlets set as tick boxes; and the line of record.
 * Every value is a globals.css token (steel ink, paper ground, orange only on what
 * can be pressed, Cheltenham for display, Jost for text).
 *
 * Used on /check-2 only. The rest of the site keeps components/tcg/footer.tsx.
 *
 * PLACEHOLDER, as in ./foot-news.tsx: there is no list or endpoint behind the
 * newsletter. The submit reports success locally and sends nothing.
 *
 */

const OUTLETS: Array<[string, string]> = [
  ["Instagram", CONTACT.instagram],
  ["Facebook", CONTACT.facebook],
  ["Clutch", CONTACT.clutch],
  ["Find us", CONTACT.map],
];

const LEGAL = ["Privacy policy", "Terms & conditions", "Cookie policy"];

/** The year of record, as a literal: new Date() is refused during prerender. */
const YEAR = 2026;

export function CheckFooter() {
  return (
    <footer className="cf" id="footer">
      <div className="cf-ledger">
        <section className="cf-cell cf-cell--brand" aria-label="Contact">
          
          <p className="cf-say">
            For anything about your check or the advisory, write to{" "}
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> or call{" "}
            <a href={CONTACT.tel}>{CONTACT.phone}</a>.
          </p>
          <p className="cf-say">{CONTACT.address}</p>
        </section>

        <nav className="cf-cell" aria-labelledby="cf-here">
          <h2 className="cf-h" id="cf-here">This page</h2>
          <ul className="cf-links">
            <li><a href="#check-2-top">Check my website</a></li>
            <li><a href="#advisory">The advisory</a></li>
            <li><a href="/check-2?stage=booking">Book a review</a></li>
          </ul>
        </nav>

        <nav className="cf-cell" aria-labelledby="cf-else">
          <h2 className="cf-h" id="cf-else">Talkerstein</h2>
          <ul className="cf-links">
            <li><Link href="/">Home</Link></li>
            <li><a href="/book">Book an appointment</a></li>
            <li>
              <a href="https://www.cyber.gc.ca/en/alerts-advisories/wordpress-security-advisory-av26-1117" target="_blank" rel="noopener noreferrer">
                Read the advisory<span className="sr-only"> (opens cyber.gc.ca in a new tab)</span>
              </a>
            </li>
          </ul>
        </nav>

        <CfNews />

        <ul className="cf-outlets" aria-label="Talkerstein elsewhere">
          {OUTLETS.map(([name, href]) => (
            <li key={name}>
              <a href={href} target="_blank" rel="noopener noreferrer">
                <span className="cf-box" aria-hidden="true" />
                {name}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="cf-record">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="cf-logo" src="/brand/tcg-logo-h-static.svg" alt="Talkerstein Consulting Group" />
        <ul className="cf-legal">
          {/* The pages do not exist yet, so these are labels, not links. */}
          {LEGAL.map((l) => <li key={l}>{l}</li>)}
        </ul>
        <span className="cf-copy">© {YEAR} Talkerstein Consulting Group</span>
      </div>
    </footer>
  );
}

function CfNews() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* G13: no timer outlives the footer. */
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status !== "idle") return;
    const v = email.trim();
    const problem = !v ? "Enter your email address." : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "That address looks incomplete." : "";
    setError(problem);
    if (problem) return;
    setStatus("sending");
    timer.current = setTimeout(() => setStatus("done"), 900);
  };

  return (
    <>
      <form className="cf-news" onSubmit={submit} noValidate>
        <label className="cf-h cf-news-label" htmlFor={`${id}-email`}>Newsletter sign-up</label>
        <input
          id={`${id}-email`}
          className="cf-news-input"
          type="email"
          autoComplete="email"
          placeholder="you@yourbusiness.ca"
          value={email}
          readOnly={status !== "idle"}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-fine`}
          onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
        />
        <button
          type="submit"
          className="cf-news-go"
          aria-disabled={status === "sending" ? true : undefined}
        >
          {status === "done" ? <>Subscribed <Check aria-hidden="true" /></> : status === "sending" ? "Sending…" : <>Subscribe <ChevronRight aria-hidden="true" /></>}
        </button>
      </form>
      <p className="cf-fine" id={`${id}-fine`} role={error ? "alert" : undefined}>
        {error || (
          <>
            By entering your email address, you agree to receive occasional digital
            security tips and insights from talkerstein.com. You can unsubscribe at any
            time.
          </>
        )}
      </p>
    </>
  );
}
