"use client";

import { Check, GripVertical, Plus } from "lucide-react";
import { Frame } from "./frame";
import { SproutStroke } from "./sprout";
import { useBrief } from "./brief";

/**
 * The card: the art on top at a fixed height, the headline and body inside the
 * card's own padding, then a CTA sitting on the bottom edge.
 *
 * The category preheader and the read-time foot were removed at the client's
 * request. Every card now carries body copy, and every card in a row is the
 * same height whatever that copy runs to: the row stretches its children, the
 * card is a grid of art / body / CTA with the body taking the slack, and the
 * art slot is a fixed height rather than an aspect ratio, so the photo slots
 * line up across the row too.
 *
 * One format at two scales. `lead` is the wide one that heads a row; without it
 * the card is a minor, four to a row.
 *
 * PLACEHOLDER DESTINATION: none of these articles exist yet, so the CTA goes
 * to the intake at the top of the page — a real destination — rather than to a
 * project page that is not there. Point it at the real route when there is one.
 *
 * `drag` turns the card into something you hand to the assistant instead of
 * something you open. It carries no CTA, because there is nowhere to go: the
 * card IS the control. It wears the double stroke to say so — the same frame
 * the intake field wears, which is the page's one other operable box.
 *
 * Two ways in, and the card says so on its face. The plus on the bottom edge is
 * the standing affordance, there before any hover, because a drag that is only
 * discoverable by trying it is not discoverable. Clicking adds the card
 * outright; dragging carries it to the box. The drag is the flourish; the click
 * is the contract.
 */
export function Card({
  title,
  dek,
  lead,
  drag,
  art,
  results,
  cta = "Learn more",
  href = "#intake",
}: {
  title: string;
  dek?: string;
  lead?: boolean;
  drag?: boolean;
  /** What the work moved, once the project was live. Given, it REPLACES the
   *  CTA: the card stops asking to be read and starts reporting. */
  results?: Array<[string, string]>;
  /** The drawing for the art slot (components/tcg/figures.tsx). Left out, the
   *  slot stays the empty plate it has been since the client pulled the old
   *  stages — every card that has no figure yet keeps that blank by design. */
  art?: React.ReactNode;
  cta?: string;
  href?: string;
}) {
  const brief = useBrief();
  const slot = (
    <div
      className={art ? "card-art slot card-art--fig" : "card-art slot"}
      aria-hidden="true"
    >
      {art}
    </div>
  );

  if (!drag) {
    return (
      <article className={`card${lead ? " card--lead" : ""}`}>
        {slot}

        <div className="card-body">
          <h3 className="card-title">{title}</h3>
          {dek && <p className="card-dek">{dek}</p>}
        </div>

        {results ? (
          /* The result rows. A finished project does not need a "Learn more"
             that goes nowhere -- it needs to say what changed. Each row is a
             label and the movement since launch.

             PLACEHOLDER FIGURES: these numbers are shape, not measurement.
             Nothing here has been read off an analytics account. Replace each
             one with the project's own figure (and its period) before this
             page goes anywhere near a client. */
          <dl className="card-results">
            {results.map(([label, delta]) => (
              <div key={label} className="card-result">
                <dt>{label}</dt>
                <dd>{delta}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="card-act">
            <a className="card-cta" href={href}>
              {cta}
            </a>
          </div>
        )}
      </article>
    );
  }

  const held = brief?.chips.some((c) => c.label === title) ?? false;
  /* The hint, and it is an ELEMENT now rather than a `title`. A native tooltip
     waits about a second before it shows, is unstyled, and never appears on
     touch at all — so the only instruction for the drag was one most visitors
     never saw. "Up" is literal: the box sits directly above this row, on the
     same ground. */
  const tip = held ? "Already in your brief" : "Drag it up, or click";

  return (
    <Frame
      as="article"
      className={`card card--drag${held ? " is-held" : ""}`}
      data-dragging={brief?.dragging ? "true" : "false"}
      /* Hovering a card shows the drop slot in the box above. The gesture
         could not teach itself before: the box is off-screen while the cards
         are centred, and its slot only appeared once a drag was already
         running. A card that is loaded does not arm — it has nowhere to go. */
      onPointerEnter={() => brief?.arm(!held)}
      onPointerLeave={() => brief?.arm(false)}
    >
      {/* The card is a control, so it hovers like one: the same seeded outline
          that sprouts on every CTA, over the frame it already wears. */}
      <SproutStroke className="card-sprout" />

      {slot}

      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        {dek && <p className="card-dek">{dek}</p>}
      </div>

      {/* The affordance on the bottom edge: an outlined plus button, orange
          because adding the card is the operable thing on it, turning to a
          check once it is in the brief — D04's success icon, the same swap the
          CTAs make. The word that used to sit beside it is gone: a plus in a
          box is already the most legible way to say "add", and the label was
          only repeating it.

          It is aria-hidden and inert — the real control is .card-grab below,
          which covers the whole card — so this is the visible half of that
          statement rather than a second button to find. */}
      <div className="card-act card-add" aria-hidden="true">
        <span className="card-add-mark">
          {/* Drawn, not bordered: a CSS border is a clean rectangle, and every
              other line on this page is printed through the grunge filter.
              `inner` gives it the resting hairline a CTA has; the outer line
              sprouts with the card's. */}
          <SproutStroke inner className="card-add-stroke" />
          {held ? (
            <Check className="glyph" aria-hidden="true" />
          ) : (
            <Plus className="glyph" aria-hidden="true" />
          )}
        </span>

        {/* The words, between the two glyphs that bracket them. */}
        {!held && <span className="card-hint">{tip}</span>}

        {/* The grip. Every draggable object on the web wears one, and this card
            wore nothing: a cursor change is the whole signal a mouse gets, and
            it arrives only after the visitor has already decided to point at
            the card. It is the one convention they already hold. */}
        {!held && (
          <span className="card-grip">
            <GripVertical className="glyph" aria-hidden="true" />
          </span>
        )}
      </div>

      {/* The whole card is the target, the way the CTA used to stretch itself
          over it (.card-grab::after in globals.css). A button rather than a
          link because nothing is being navigated to, and a real button so the
          keyboard gets the card for free — Enter and Space already add it.

          It is phrasing content only: the heading above cannot live inside a
          button, so the accessible name is spelled out here instead. */}
      <button
        type="button"
        className="card-grab"
        onPointerDown={(e) => brief?.startDrag(title, e)}
        onClick={() => brief?.add(title)}
      >
        <span className="sr-only">
          {held ? `${title} is already in your brief` : `Add ${title} to your brief`}
        </span>
      </button>
    </Frame>
  );
}
