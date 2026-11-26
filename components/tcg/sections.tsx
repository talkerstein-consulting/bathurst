import Image from "next/image";
import { Card } from "./card";
import { ServiceCard } from "./service-card";
import { Collectible } from "./collectible";
import { Ground } from "./figures";
import { ShotLoop } from "./shot-loop";

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
 * The titles AND the paragraphs under them are the client's own, supplied
 * verbatim. They replaced the one-line deks that used to sit here (each of
 * which is now the opening sentence of its paragraph). Do not reword them.
 *
 * The row was re-laid out to the client's reference at the same time: two
 * wide cards to a row instead of four narrow ones, the art moved from the top
 * of the card to the bottom, and each card given its own link. See
 * ./service-card.tsx.
 */
const CAPABILITIES: Array<[string, string]> = [
  [
    "Strategy & Consulting",
    "See the move before you make it. We help you identify the right opportunities, make smarter decisions, and turn your biggest ambitions into a clear plan of action.",
  ],
  [
    "Websites & Digital Experiences",
    "Give your business a bigger stage. We build digital experiences that bring your best ideas to life, make a lasting impression, and give your business room to grow.",
  ],
  [
    "Automation & AI",
    "Put your operation on autopilot. Connect your tools, simplify the work behind the scenes, and give your team more time to focus on what moves your business forward.",
  ],
  [
    "Marketing & Growth",
    "Become the name they remember. Reach the right people, give them a reason to choose you, and build the momentum that turns attention into lasting business.",
  ],
];

/**
 * 06 — the portfolio cards: five projects, shown in their own mockup renders.
 *
 * The art is the chosen shot from each project's mockup set (MOCKUP-DIRECTIONS.md
 * in the repo root, renders in mockups/<project>/), converted to webp at 1600px
 * and kept in public/work. One direction per project, as that brief asks:
 *
 *   Aria Noir        round 2, R1 — direction A, "White Iris", the 11.8s loop
 *   Amazing Donuts   A2 — "Six AM, Harbour Blue"
 *   Bubby's Bagels   A2 — "Base to Lid"
 *   Brickstone       A2 — "Occupied Building", the site report
 *   Sam's Menswear   C1 — "Oxblood Hour"
 *
 * Aria Noir's is the animated one: the real home page scrolling in a close-up
 * laptop, silent, 11.8 seconds. Only the screen moves — the set is a still
 * photograph — so it reads as footage of the device, not as an animation on
 * the card. ./shot-loop.tsx has the reduced-motion and off-screen rules.
 *
 * WHAT IS REAL IN THESE IMAGES. Every device screen is the project's own site,
 * captured and composited in; the set, the light and the props around it are
 * generated. That is the whole of the disclosure the brief requires, and it is
 * printed under the row rather than left in a file nobody reads.
 *
 * Two of the briefs carry honesty rules that the cards keep: Brickstone's crew
 * imagery is illustrative and is never described as their completed work, and
 * the only suit in the Sam's shot is on screen. Neither line claims either way.
 *
 * Three projects in that set are not here — Carmel Transport, Ralph and the TCG
 * sign portal. Carmel is a proposed redesign that is not live on the client's
 * domain, so it would need a caption this row has no room for.
 *
 * The CTA goes to #footprint, the map further down the page: all five are
 * clients on it, and their case studies open there. There are still no
 * per-project pages.
 */
type Project = { id: string; name: string; line: string };

const LEAD: Project = {
  id: "aria-noir",
  name: "Aria Noir",
  line: "Eyewear, carved not assembled — and a black site that gives a frame the room a vitrine would. A hero film, the collection stories, and a turntable you drag to change colourway before the bag ever opens.",
};

const WORK: Project[] = [
  {
    id: "amazing-donuts",
    name: "Amazing Donuts",
    line: "A kosher bakery since '97, with a Donut Lab that builds the box a layer at a time.",
  },
  {
    id: "bubbys-bagels",
    name: "Bubby's New York Bagels",
    line: "Bagels on Bathurst, and a builder that stacks base to lid so nothing lands upside down.",
  },
  {
    id: "brickstone",
    name: "Brickstone Construction",
    line: "GTA restoration for buildings people still live in. A still, light site that books an assessment.",
  },
  {
    id: "sams-menswear",
    name: "Sam's Menswear",
    line: "Measured. Made. Refined. A Vaughan tailor's site, where you draw the suit before you book.",
  },
];

/**
 * What each project moved once it was live.
 *
 * PLACEHOLDER FIGURES, by instruction: the client asked for the rows now and
 * the numbers later. Not one of these has been read off an analytics account,
 * a POS or a booking system -- they are here so the card has its shape. Every
 * value must be replaced with the project's own measured figure, over a stated
 * period, before this page is shown to anyone outside the studio.
 */
const RESULTS: Record<string, Array<[string, string]>> = {
  "aria-noir": [["Online bookings", "+00%"], ["Return visits", "+00%"]],
  "amazing-donuts": [["Online orders", "+00%"], ["Average basket", "+00%"]],
  "bubbys-bagels": [["Online orders", "+00%"], ["Catering enquiries", "+00%"]],
  brickstone: [["Assessments booked", "+00%"], ["Qualified leads", "+00%"]],
  "sams-menswear": [["Fittings booked", "+00%"], ["Average order", "+00%"]],
};

/** The project's mockup render (public/work), the shot chosen from its set. */
function Shot({ id, lead }: { id: string; lead?: boolean }) {
  return (
    <Image
      className="card-shot"
      /* which render this is, so globals.css can put the crop on THIS
         project's screen -- the screen sits in a different part of every
         render, so one origin cannot serve all five */
      data-shot={id}
      src={`/work/${id}.webp`}
      alt=""
      fill
      sizes={lead ? "(max-width: 1080px) 100vw, 56vw" : "(max-width: 1080px) 100vw, 25vw"}
    />
  );
}

/** A section's opening: the house rule, then the headline. */
function Head({
  id,
  bare,
  children,
}: {
  id: string;
  /** Drop the thick section rule over the headline (globals.css,
   *  .sec-head--bare). */
  bare?: boolean;
  children: string;
}) {
  return (
    <div className={bare ? "sec-head sec-head--bare" : "sec-head"}>
      <h2 id={id}>{children}</h2>
    </div>
  );
}

export function WhatWeDo() {
  return (
    <section className="sec" id="what-we-do" aria-labelledby="what-we-do-h">
      {/* No rule over this one, at the client's request. */}
      <Head id="what-we-do-h" bare>
        Built for the business you’re becoming.
      </Head>

      {/* Two to a row, one on a phone (globals.css, .svc-grid). The art slot
          carries the same dithered ground the feature figures stand on —
          ./figures.tsx `Ground`, one crop of the one field per card — so these
          cards are printed on the stock the rest of the page already uses,
          instead of a blank plate. */}
      <div className="svc-grid">
        {CAPABILITIES.map(([title, dek], i) => (
          <ServiceCard
            key={title}
            title={title}
            dek={dek}
            at={i}
            art={<Ground seed={i} />}
          />
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
          art={
            <ShotLoop
              id={LEAD.id}
              sizes="(max-width: 1080px) 100vw, 56vw"
            />
          }
          results={RESULTS[LEAD.id]}
        />
      </div>

      <div className="card-row card-row--ruled">
        {WORK.map((p) => (
          <Card
            key={p.id}
            title={p.name}
            dek={p.line}
            art={<Shot id={p.id} />}
            results={RESULTS[p.id]}
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
