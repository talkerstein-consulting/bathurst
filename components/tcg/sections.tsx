import Image from "next/image";
import { Card } from "./card";
import { Collectible } from "./collectible";
import { Ground } from "./figures";

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
 * The titles are the client's. The lines under them were reworded for voice;
 * they describe the service in general terms and claim nothing specific.
 * Still subject to the client's sign-off.
 */
const CAPABILITIES: Array<[string, string]> = [
  [
    "Strategy & Consulting",
    "See the move before you make it.",
  ],
  [
    "Websites & Digital Experiences",
    "Give your business a bigger stage.",
  ],
  [
    "Automation & AI",
    "Put your operation on autopilot.",
  ],
  [
    "Marketing & Growth",
    "Become the name they remember.",
  ],
];

/**
 * 06 — the portfolio cards: five real engagements.
 *
 * The placeholder sectors ("Regional logistics group" and four like it) are
 * gone. Every card here is a client TCG actually works with, and the lines are
 * written from the case-study copy already in the repo — the `overview` field
 * in lib/bathurst/client-content.ts, which is sourced from talkerstein.com/work
 * and each client's own site. The art is that client's own banner photograph
 * (public/clients/<id>/banner.webp), the same image the map's sidebar leads
 * with, so a card and its case study show the same picture.
 *
 * NO NUMBER HERE WAS WRITTEN FOR THIS PAGE. Every figure quoted — 3.1×, 2.7×,
 * 2.3×, 200%, 3.4× — is repeated verbatim from that content file, and Maple
 * Electric's is attributed the way the source attributes it ("the founder
 * reports"). A client without a measured result is described by the work
 * instead; none has been given one to match the others.
 *
 * The CTA goes to #footprint, the map further down the page, because that is
 * where each case study actually opens. There are still no per-project pages.
 */
type Project = { id: string; name: string; line: string };

const LEAD: Project = {
  id: "fringe",
  name: "Fringe Boutique",
  line: "Two sisters and a women's boutique on Lynnhaven. A new brand and visual identity, the Shopify store and the point-of-sale behind the counter, and the model photography directed to match. Online conversion rose 3.1×, and the audience 2.7×.",
};

const WORK: Project[] = [
  {
    id: "hoh",
    name: "House of Hair Extensionz",
    line: "A luxury identity and a Shopify catalogue of thousands of SKUs. Online sales 2.3×.",
  },
  {
    id: "mes",
    name: "Maple Electric Supply",
    line: "Contractor-grade supply, shipping Canada-wide. The founder reports the business grew 200%.",
  },
  {
    id: "amritsari",
    name: "Amritsari Chatore",
    line: "Branding, print and a WordPress site for Amritsari street food. Local discovery 3.4×.",
  },
  {
    id: "sams",
    name: "Sam's Menswear",
    line: "A brand and a website for a master tailor's made-to-measure studio.",
  },
];

/** The client's own banner, the image their case study opens with. */
function Shot({ id, lead }: { id: string; lead?: boolean }) {
  return (
    <Image
      className="card-shot"
      src={`/clients/${id}/banner.webp`}
      alt=""
      fill
      sizes={lead ? "(max-width: 1080px) 100vw, 56vw" : "(max-width: 1080px) 100vw, 25vw"}
    />
  );
}

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
        Built for the business you’re becoming.
      </Head>

      {/* One column on phones and tablets, with the art slot taken up to a
          wide plate (globals.css, .sec--stack). The slot carries the same
          dithered ground the feature figures stand on — ./figures.tsx `Ground`,
          one crop of the one field per card — so these cards are printed on
          the stock the rest of the page already uses, instead of the blank
          plate they carried. */}
      <div className="card-row card-row--stack">
        {CAPABILITIES.map(([title, dek], i) => (
          <Card key={title} title={title} dek={dek} art={<Ground seed={i} />} />
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
        <Card
          lead
          title={LEAD.name}
          dek={LEAD.line}
          art={<Shot id={LEAD.id} lead />}
          href="#footprint"
        />
      </div>

      <div className="card-row card-row--ruled">
        {WORK.map((p) => (
          <Card
            key={p.id}
            title={p.name}
            dek={p.line}
            art={<Shot id={p.id} />}
            href="#footprint"
          />
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
