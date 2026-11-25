import { Card } from "./card";
import { Collectible } from "./collectible";

/**
 * Sections 5 to 8, laid out to the brief.
 *
 * Every section heading is the client's own, taken verbatim from the brief.
 *
 * The final CTA section was removed at the client's request; the intake at
 * the top of the page is the conversion surface. The numbered approach steps
 * (01–04) were removed outright at the client's request — the section is gone,
 * not hidden.
 *
 * BLANK SLOTS BY INSTRUCTION: every figure is an empty slot. No project
 * imagery, no client logos and no testimonial portraits have been chosen.
 */

/**
 * 05 — the four capabilities, in the brief's order.
 *
 * The titles are the client's. The lines under them are PLACEHOLDER COPY,
 * written so every card carries a body; they describe the service in general
 * terms and claim nothing specific. Replace with the client's own wording.
 */
const CAPABILITIES: Array<[string, string]> = [
  [
    "Strategy & Consulting",
    "Working out what the business actually needs before anything gets built.",
  ],
  [
    "Websites & Digital Experiences",
    "Sites and applications built to be used, not just looked at.",
  ],
  [
    "Automation & AI",
    "Taking the repetitive work off the people who should be doing better work.",
  ],
  [
    "Marketing & Growth",
    "Reaching the customers who are already looking for what you do.",
  ],
];

/**
 * 06 — the portfolio cards.
 *
 * PLACEHOLDER COPY, WRITTEN TO BE REPLACED. The client asked for stand-in
 * content so the row can be read at the right length instead of five cards
 * saying "Client". None of these are real engagements, none of these numbers
 * were measured, and nothing here may ship to a live site: the sectors are
 * generic and no business is named, precisely so that none of it can be
 * mistaken for a claim about a real client.
 *
 * TODO(content): replace all six with real work before launch.
 */
const LEAD: [string, string] = [
  "Regional logistics group",
  "Twelve depots booking by phone and spreadsheet. One dispatch system, built around how the drivers already worked, and a dispatcher's morning that starts with a plan instead of a phone queue.",
];

const WORK: Array<[string, string]> = [
  [
    "Specialty food importer",
    "A trade catalogue and ordering portal, replacing a PDF price list.",
  ],
  [
    "Private clinic network",
    "Intake, triage and scheduling joined up across five locations.",
  ],
  [
    "Industrial manufacturer",
    "Quoting automated from the parts data the shop floor already kept.",
  ],
  [
    "Professional services firm",
    "A new site and a brand that reads the same in both official languages.",
  ],
];

/** A section's opening: the house rule, then the headline. */
function Head({ id, children }: { id: string; children: string }) {
  return (
    <div className="sec-head">
      <h2 id={id}>{children}</h2>
    </div>
  );
}

export function WhatWeDo() {
  return (
    <section className="sec" id="what-we-do" aria-labelledby="what-we-do-h">
      <Head id="what-we-do-h">
        Everything your business needs to move forward.
      </Head>

      <div className="card-row">
        {CAPABILITIES.map(([title, dek]) => (
          <Card key={title} title={title} dek={dek} />
        ))}
      </div>
    </section>
  );
}

export function SelectedWork() {
  return (
    <section className="sec" id="work" aria-labelledby="work-h">
      <Head id="work-h">Ideas put into action.</Head>

      {/* The reference's shape: one lead across the row, four minors beneath. */}
      <div className="card-lead-row">
        <Card lead title={LEAD[0]} dek={LEAD[1]} />
      </div>

      <div className="card-row card-row--ruled">
        {WORK.map(([title, dek]) => (
          <Card key={title} title={title} dek={dek} />
        ))}
      </div>
    </section>
  );
}

/** 07 — one collectible per client, numbered as a series. */
const COLLECTION: Array<[string, string, string]> = [
  ["Regional logistics group", "Transport", "01"],
  ["Specialty food importer", "Wholesale", "02"],
  ["Private clinic network", "Healthcare", "03"],
  ["Industrial manufacturer", "Manufacturing", "04"],
  ["Professional services firm", "Services", "05"],
];

export function Testimonials() {
  return (
    <section className="sec" id="testimonials" aria-labelledby="testimonials-h">
      <Head id="testimonials-h">Good work speaks for itself.</Head>

      {/* The collectible card from the guide — the one card in the system with
          a fill. D06: the row scrolls sideways rather than stacking. */}
      <ul className="tc-row">
        {COLLECTION.map(([title, sub, n]) => (
          <li key={n}>
            <Collectible series="Clients" title={title} sub={sub} />
          </li>
        ))}
      </ul>
    </section>
  );
}
