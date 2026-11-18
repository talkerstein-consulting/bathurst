"use client";

import { useState } from "react";
import { CtaLink } from "@/components/style/Cta";
import { assessHref } from "./AssessLead";
import "@/app/landing.css";

/**
 * 07 · Our Process. A tab strip: one icon per step, the step you are on marked and pointing down into the panel it
 * opens. The panel carries that step's name, what happens in it and the picture, and the ‹ › pair steps through
 * them without having to hit the icons.
 *
 * The four steps are a sequence, so the strip is a real tablist: arrow keys move along it and the panel is labelled
 * by its tab, which is what a screen reader needs to follow the same order the eye does.
 *
 * LOW FIDELITY — the picture is a grey placeholder. Replace .pt-fig with the real screen.
 */

/** Lucide-shaped line icons on the 24px grid (STYLE.md: line only, round caps, currentColor). */
const ICONS = {
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  map: <><path d="M9 4.5L3.5 6.8v12.7L9 17.2l6 2.3 5.5-2.3V4.5L15 6.8z" /><path d="M9 4.5v12.7M15 6.8v12.7" /></>,
  build: <><path d="M3.5 20.5h17" /><path d="M5.5 20.5V11l6.5-5 6.5 5v9.5" /><path d="M10 20.5v-5h4v5" /></>,
  rise: <><path d="M3.5 17l5.5-5.5 3.5 3.5L20.5 7" /><path d="M15.5 7h5v5" /></>,
} as const;

const Icon = ({ g, className }: { g: keyof typeof ICONS; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICONS[g]}</svg>
);

const STEPS = [
  {
    icon: "search" as const,
    name: "Understand",
    title: "Start with the business, not the brief.",
    body: "We learn about your business, your goals, and what’s getting in the way — before anyone talks about what to build.",
  },
  {
    icon: "map" as const,
    name: "Plan",
    title: "Decide what’s worth doing first.",
    body: "We identify opportunities and determine which solutions make the most sense for where your business is now.",
  },
  {
    icon: "build" as const,
    name: "Build",
    title: "Design, develop, and put it to work.",
    body: "We design, develop, and implement the right solutions for your business, and we handle the parts that connect them.",
  },
  {
    icon: "rise" as const,
    name: "Improve",
    title: "Stay with it as the business grows.",
    body: "We stay involved, provide ongoing support, and look for ways to make things work better over time.",
  },
];

const chev = (d: string) => (
  <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

export default function ProcessTabs() {
  const [at, setAt] = useState(0);
  const step = STEPS[at];
  const go = (i: number) => setAt((i + STEPS.length) % STEPS.length);

  return (
    <section id="process" className="section hs pt" aria-label="From business challenges to working solutions">
      <div className="pt-wrap">
        <header className="pt-head">
          <p className="eyebrow pt-eyebrow">Our process</p>
          <h2 className="h2 lp-h">From business challenges to working solutions.</h2>
          <p className="lp-lead">
            We don’t start by selling you a service. We start by understanding what your business needs.
          </p>
        </header>

        {/* the strip: the ‹ › pair either side, the four steps between them */}
        <div className="pt-strip">
          <button type="button" className="pt-step-arrow" aria-label="Previous step" onClick={() => go(at - 1)}>
            {chev("M14 6l-6 6 6 6")}
          </button>
          <div className="pt-tabs" role="tablist" aria-label="Our process">
            {STEPS.map((s, i) => (
              <button key={s.name} type="button" role="tab" id={`pt-tab-${i}`} aria-controls={`pt-panel-${i}`}
                aria-selected={i === at} tabIndex={i === at ? 0 : -1} title={s.name}
                className={i === at ? "pt-tab is-on" : "pt-tab"}
                onClick={() => setAt(i)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") { e.preventDefault(); go(at + 1); }
                  if (e.key === "ArrowLeft") { e.preventDefault(); go(at - 1); }
                }}>
                <Icon g={s.icon} className="pt-tab-i" />
                <span className="sr-only">{s.name}</span>
              </button>
            ))}
          </div>
          <button type="button" className="pt-step-arrow" aria-label="Next step" onClick={() => go(at + 1)}>
            {chev("M10 6l6 6-6 6")}
          </button>
        </div>

        {/* the panel the marked step points into */}
        <div className="pt-panel" id={`pt-panel-${at}`} role="tabpanel" aria-labelledby={`pt-tab-${at}`}
          style={{ "--at": at } as React.CSSProperties}>
          <div className="pt-panel-l">
            <p className="pt-label"><Icon g={step.icon} className="pt-label-i" />{step.name}</p>
            <h3 className="pt-t">{step.title}</h3>
            <p className="pt-b">{step.body}</p>
            <CtaLink href={assessHref()} label="Start your assessment" variant="link" className="lp-cta" />
          </div>
          {/* LOW FIDELITY placeholder for this step's picture */}
          <div className="pt-fig" aria-hidden="true">
            <span className="pt-fig-card">
              <span className="pt-ph pt-ph-h" />
              <span className="pt-ph" />
              <span className="pt-ph is-short" />
              <span className="pt-ph pt-ph-blk" />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
