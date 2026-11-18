import { Fragment, type ElementType } from "react";

/**
 * A heading whose words rise into place on load, one after another, each out of its own clipped line (like type being set).
 * Screen readers get the plain text; the animated copy is aria-hidden. CSS: .rise in app/globals.css (off with reduced motion).
 * `delay` (ms) offsets the whole heading, so a page can sequence its eyebrow, heading and body.
 * A newline in `text` is a line break the heading keeps at every width.
 */
export default function RiseHeading({ as: Tag = "h1", text, className, delay = 0 }: { as?: ElementType; text: string; className?: string; delay?: number }) {
  // a newline in `text` is a line the heading always keeps (.rise-l is a block), so a two-line headline stays two lines
  // whatever the width or the font that is loaded; without one the words wrap on their own.
  const lines = text.split("\n");
  let n = 0;
  return (
    <Tag className={`rise ${className ?? ""}`} style={{ "--rise-delay": `${delay}ms` } as React.CSSProperties}>
      <span className="sr-only">{lines.join(" ")}</span>
      <span aria-hidden="true">
        {lines.map((line, li) => (
          <span className={lines.length > 1 ? "rise-l" : undefined} key={li}>
            {/* the space sits between the word boxes: inside an inline-block it would collapse */}
            {line.split(" ").map((w, i, a) => (
              <Fragment key={i}><span className="rise-w"><span style={{ "--i": n++ } as React.CSSProperties}>{w}</span></span>{i < a.length - 1 ? " " : ""}</Fragment>
            ))}
          </span>
        ))}
      </span>
    </Tag>
  );
}
