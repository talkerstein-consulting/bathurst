import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CtaLink } from "@/components/style/Cta";

/**
 * The card. One format for every card on the site, so a row of them reads as one system:
 *
 *   ┌─────────────────┐   .card-ui    space for UI on top: a diagram, a photo, a chart, an icon — anything, or nothing
 *   │      (ui)       │   .card-h     the header
 *   ├─────────────────┤   .card-tags  what it is (chips; never clickable, STYLE.md D05)
 *   │ Header          │   .card-body  the copy
 *   │ [tag] [tag]     │   .card-go    one action, and only one, pinned to the bottom edge so a row of them lines up
 *   │ Body…           │
 *   │ [ Action ]      │
 *   └─────────────────┘
 *
 * One border: the card is drawn with `.single` (one thin printed line, components/style/LineSystem.tsx), never the
 * double `.frame`, and nothing inside it draws a second box. Equal heights come from `.card-grid`.
 * Every card takes exactly one `action`; it is a prop, not a slot, so a second button cannot be added by accident.
 */
export type CardAction = { label: string; href: string };

export default function Card({
  ui, ratio, title, tags, action, className, children, as: Tag = "li",
}: {
  /** the UI area on top; leave it out and the card starts at the header */
  ui?: ReactNode;
  /** shape of that area, as a CSS aspect-ratio (default 16 / 10) */
  ratio?: string;
  title: string;
  tags?: string[];
  action: CardAction;
  className?: string;
  children: ReactNode;
  as?: "li" | "div" | "article";
}) {
  return (
    <Tag className={cn("card single", className)}>
      {ui !== undefined && <div className="card-ui" style={ratio ? { aspectRatio: ratio } : undefined} aria-hidden={ui === null ? "true" : undefined}>{ui}</div>}
      <div className="card-main">
        <h3 className="card-h">{title}</h3>
        {tags?.length ? (
          <ul className="card-tags" aria-label="Tags">
            {tags.map((t) => <li key={t} className="card-tag">{t}</li>)}
          </ul>
        ) : null}
        <div className="card-body">{children}</div>
        <CtaLink href={action.href} label={action.label} variant="link" className="card-go" />
      </div>
    </Tag>
  );
}

/** A row of cards: equal columns, equal heights. `cols` is the count on a wide screen (2 at ≤1100px, 1 at ≤640px). */
export function CardGrid({ cols = 3, className, children, as: Tag = "ul" }: { cols?: 2 | 3 | 4; className?: string; children: ReactNode; as?: "ul" | "ol" | "div" }) {
  return <Tag className={cn("card-grid", className)} style={{ "--cols": cols } as React.CSSProperties}>{children}</Tag>;
}
