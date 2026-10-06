import { Fragment, type ElementType } from "react";

/**
 * A heading whose words rise into place on load, one after another, each out of its own clipped line (like type being set).
 * Screen readers get the plain text; the animated copy is aria-hidden. CSS: .rise in app/globals.css (off with reduced motion).
 * `delay` (ms) offsets the whole heading, so a page can sequence its eyebrow, heading and body.
 */
export default function RiseHeading({ as: Tag = "h1", text, className, delay = 0 }: { as?: ElementType; text: string; className?: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <Tag className={`rise ${className ?? ""}`} style={{ "--rise-delay": `${delay}ms` } as React.CSSProperties}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {/* the space sits between the word boxes: inside an inline-block it would collapse */}
        {words.map((w, i) => (
          <Fragment key={i}><span className="rise-w"><span style={{ "--i": i } as React.CSSProperties}>{w}</span></span>{i < words.length - 1 ? " " : ""}</Fragment>
        ))}
      </span>
    </Tag>
  );
}
