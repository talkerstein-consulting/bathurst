"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/**
 * 03c · Where the line from the pinned stage lands (components/home/LeadSystem.tsx). The tail that leaves the bottom
 * of that stage arrives here as the same line, runs into one hub, and fans out into the categories a real week of
 * inquiries actually splits into. The point of the drawing is that nothing is left to a memory or a personal inbox:
 * every lead has a place to be and a next step attached to it.
 *
 * The fan-out draws itself once the section is in view (`.on`), so it reads as the line continuing rather than as a
 * static diagram that was always there.
 * TODO(content): the counts are a worked example sized to the five arrivals above, not client data.
 */

const LANES = [
  { k: "Quotes", n: 2, next: "Priced and sent within 2 days", tone: "a" },
  { k: "Bookings", n: 1, next: "Site walk held in the calendar", tone: "b" },
  { k: "Questions", n: 1, next: "Answered, then kept for the quote", tone: "c" },
  { k: "Not a fit", n: 1, next: "Declined politely, logged", tone: "d" },
];

export default function LeadHub() {
  const box = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = box.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setOn(true); }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="hub" className={`section lh${on ? " on" : ""}`} ref={box} aria-label="Where every lead lands">
      <div className="wrap">
        {/* the same line, arriving */}
        <span className="lh-in" aria-hidden="true" />

        <header className="hs-head lh-head">
          <p className="eyebrow">One place for all of it</p>
          <h2 className="h2 hs-h">Every Lead Lands in the Same Place</h2>
          <p className="hs-lead">One hub holds every inquiry the website takes, whatever it is. From there each one is sorted, given an owner and given a next step — so the week ends with nothing sitting unanswered.</p>
        </header>

        <div className="lh-dia">
          <span className="lh-hub"><b>Lead hub</b><em>5 this week</em></span>
          <ol className="lh-lanes">
            {LANES.map((l, i) => (
              <li key={l.k} className={`lh-lane tone-${l.tone}`} style={{ "--i": i } as CSSProperties}>
                <span className="lh-wire" aria-hidden="true" />
                <span className="lh-card">
                  <span className="lh-top"><b>{l.k}</b><i>{l.n}</i></span>
                  <em>{l.next}</em>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <p className="lh-fine">Fig. 2 — The same five inquiries, sorted. The categories, the counts and the next steps are a worked example.</p>
      </div>
    </section>
  );
}
