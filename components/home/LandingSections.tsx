import type { ReactNode } from "react";
import { CtaLink } from "@/components/style/Cta";
import { assessHref } from "./AssessLead";
import Testimonials from "@/components/bathurst/Testimonials";
import SignatureLine from "@/components/bathurst/SignatureLine";
import "@/app/landing.css";

/**
 * The landing sheet that rises over the client map (sections 03–08). The page tells one story in order, so the
 * sections are not interchangeable: the outcome, then why it isn't happening, then what changes, then the proof,
 * then what we actually do, how the partnership runs, and the ask.
 *
 *   01 Hero — the business outcome          components/home/AssessLead.tsx
 *   02 Client Map — credibility             the map itself (components/bathurst/BathurstHero.tsx)
 *   03 The Reality — recognise the problem  ┐
 *   04 The Transformation — the solution    │
 *   05 Testimonials — let clients speak     ├ this file
 *   06 What We Do — the capabilities        │
 *   07 Our Process — the partnership        │
 *   08 Closing CTA — convert                ┘
 *   then the footer                         components/bathurst/SiteFooter.tsx
 *
 * Each section owns its own layout and lives in its own file; this one holds the order, the two sections short
 * enough to state here, and the re-exports, so the page imports a single module.
 *
 * LOW FIDELITY, EXCEPT 05 — in 03, 04, 06 and 07 the copy and the order are real and the pictures are grey
 * schematics. Each file says which class to replace. 05 is finished: the real video testimonials.
 */

/* ---------- shared ---------- */

/** The section head: the heading and whatever follows it. No preheader — the sections are read in order and the
 *  heading says what each one is, so a label above it only repeated the heading in smaller type. */
function SectionHead({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="lf-head">
      <h2 className="h2 lp-h">{title}</h2>
      {children}
    </header>
  );
}

/* ---------- 03 · The Reality — make them recognise the problem ---------- */
/* Its own split layout, not a rail: components/home/RealityPanels.tsx (re-exported so the page imports one module). */
export { default as Reality } from "./RealityPanels";

/* ---------- 04 · The Transformation — introduce the solution ---------- */
/* Its own pinned-rail layout, not a rail of cards: components/home/TransformPanels.tsx. */
export { default as Transformation } from "./TransformPanels";

/* ---------- 05 · Client testimonials — let clients speak ---------- */

/**
 * The one section that is not low fidelity: these are the real video testimonials (lib/bathurst/data.ts), shown by the
 * same component the area pages use (components/bathurst/Testimonials.tsx) — the Clutch and Google ratings, then the
 * side-swiping row of video cards, each opening the clip and the full quote. It takes this section's head in place of
 * its own "Word on the Street", so the card row keeps the ‹ › pair and the rest of its behaviour unchanged.
 */
export function Proof() {
  return (
    <section id="proof" className="section hs lf lf-proof">
      <Testimonials split heading={
        <SectionHead title="Don’t just take our word for it.">
          <p className="lp-lead">
            Good work should make a difference to the businesses behind it. Hear from the people we’ve worked with and
            learn what it’s like to have Talkerstein as a partner.
          </p>
        </SectionHead>
      } />
    </section>
  );
}

/* ---------- 06 · What we do — introduce the capabilities ---------- */
/* Its own three-column rows, not a rail of cards: components/home/CapabilityPanels.tsx. */
export { default as Capabilities } from "./CapabilityPanels";

/* ---------- 07 · Our process — explain the partnership ---------- */
/* Its own tab strip, not a rail of cards: components/home/ProcessTabs.tsx. */
export { default as Process } from "./ProcessTabs";

/* ---------- 08 · Closing CTA — convert ---------- */

export function FinalCta() {
  return (
    <section id="final-cta" className="section hs hs-final lf">
      <div className="wrap">
        <h2 className="h2 lp-h">Ready to turn more opportunities into business?</h2>
        <p className="lp-lead">
          Let’s take a closer look at your digital presence and find out where your business can do better.
        </p>
        <SignatureLine bare />
        <CtaLink href={assessHref()} label="Start Your Assessment" accent className="hs-cta lp-cta">Start Your Assessment</CtaLink>
      </div>
    </section>
  );
}
