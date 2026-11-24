import { Cta } from "./cta";

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
 */
export function Card({
  title,
  dek,
  lead,
  cta = "Learn more",
  href = "#intake",
}: {
  title: string;
  dek?: string;
  lead?: boolean;
  cta?: string;
  href?: string;
}) {
  return (
    <article className={`card${lead ? " card--lead" : ""}`}>
      <div className="card-art slot" aria-hidden="true" />

      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        {dek && <p className="card-dek">{dek}</p>}
      </div>

      <div className="card-act">
        <Cta as="a" href={href} label={cta} small className="cta--light">
          {cta}
        </Cta>
      </div>
    </article>
  );
}
