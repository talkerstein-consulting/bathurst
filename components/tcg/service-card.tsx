import { Compass, MonitorSmartphone, TrendingUp, Workflow } from "lucide-react";

/**
 * The service card — the four capabilities, two to a row.
 *
 * It is NOT ./card.tsx with a variant bolted on. That card is the page's
 * general format (art on top, body, CTA on the bottom edge) and it is shared
 * with the feature rail and the selected-work row, neither of which changes
 * here. This one inverts it to the shape the client approved from their
 * reference: a quiet mark, the headline, a paragraph that actually says
 * something, the one link, and then the art taking the bottom of the card.
 *
 * PLACEHOLDER ART: the slot carries ./figures.tsx `Ground` — the same dithered
 * stock every other blank slot on the page stands on. No service imagery has
 * been chosen, so nothing here pretends to be a photograph.
 *
 * PLACEHOLDER DESTINATION: the per-service pages do not exist, so "Learn more"
 * goes to the intake at the top of the page — a real destination — rather than
 * to a route that is not there. Point each at its own page when there is one.
 * This is the same reasoning ./card.tsx carries for its CTA.
 *
 * The mark is a drawing, not a control, so it is never orange: orange belongs
 * to operable elements only. "Learn more" is the operable thing on the card,
 * and it is the ONLY one — the reference's second button in the card's corner
 * would have gone to the same place, which is two controls for one
 * destination. Its ::after (globals.css, .card-cta::after) spans the whole
 * card, so the card is the target and there is still a single tab stop.
 */

/** One Lucide mark per service, in the brief's order. */
const MARKS = [Compass, MonitorSmartphone, Workflow, TrendingUp];

export function ServiceCard({
  title,
  dek,
  at,
  art,
  cta = "Learn more",
  href = "#intake",
}: {
  title: string;
  dek: string;
  /** Position in the row, which picks the mark and the ground's crop. */
  at: number;
  art?: React.ReactNode;
  cta?: string;
  href?: string;
}) {
  const Mark = MARKS[at % MARKS.length];

  return (
    <article className="svc">
      <span className="svc-mark" aria-hidden="true">
        <Mark className="glyph" strokeWidth={1.5} />
      </span>

      <h3 className="svc-title">{title}</h3>
      <p className="svc-dek">{dek}</p>

      <div className="svc-act">
        <a className="card-cta" href={href}>
          {cta}
        </a>
      </div>

      <div className="svc-art slot" aria-hidden="true">
        {art}
      </div>
    </article>
  );
}
