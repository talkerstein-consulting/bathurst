"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

export type FootSection = {
  label: string;
  /** A link, or a label with no destination yet (the legal pages). */
  items: Array<{ label: string; href?: string }>;
};

/**
 * The footer's link columns: columns on a wide screen, an accordion on a phone.
 *
 * Six stacked columns put the line of record about three screens below the last
 * thing anyone wanted, so on a phone they fold into a vertical FAQ: a titled
 * row per section, one open at a time, the rest closed to a single line each.
 * Vertical because the footer is the end of the page and the whole list should
 * be readable at a glance — a sideways row of titles would hide most of itself
 * off the right edge and put the sections behind a scroll.
 *
 * One open at a time, which is what makes it an FAQ rather than six unrelated
 * toggles: the footer never grows past one section's worth of links.
 *
 * The wide layout is what the server renders, so a visitor with no JavaScript
 * gets every link in the footer rather than six dead titles. `compact` is read
 * in an effect, which is also the only place it can be read: the server has no
 * viewport.
 */
export function FootTabs({ sections }: { sections: FootSection[] }) {
  const [compact, setCompact] = useState(false);
  /** Which section is open. -1 closes them all, which is where a phone starts:
   *  opening one by default would push the rest down for no reason. */
  const [open, setOpen] = useState(-1);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 560px)");
    const sync = () => setCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const list = (s: FootSection) => (
    <ul>
      {s.items.map((i) => (
        <li key={i.label}>
          {i.href ? (
            <a href={i.href}>{i.label}</a>
          ) : (
            <span className="foot-soon">{i.label}</span>
          )}
        </li>
      ))}
    </ul>
  );

  if (!compact) {
    return (
      <nav className="foot-cols" aria-label="Footer">
        {sections.map((s) => (
          <div className="foot-col" key={s.label}>
            <h2>{s.label}</h2>
            {list(s)}
          </div>
        ))}
      </nav>
    );
  }

  return (
    <nav className="foot-acc" aria-label="Footer">
      {sections.map((s, i) => {
        const isOpen = i === open;
        return (
          <div className="foot-fold" key={s.label} data-open={isOpen}>
            {/* A heading holding the control, so the sections are still a list
                of headings to a screen reader rather than six loose buttons.
                aria-expanded is the state; the chevron is its picture. */}
            <h2 className="foot-fold-h">
              <button
                type="button"
                className="foot-fold-btn"
                aria-expanded={isOpen}
                aria-controls={`foot-fold-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                <span>{s.label}</span>
                {/* D03: a chevron, never an arrow. */}
                <ChevronDown className="glyph foot-fold-mark" aria-hidden="true" />
              </button>
            </h2>

            <div
              className="foot-fold-panel"
              id={`foot-fold-${i}`}
              hidden={!isOpen}
            >
              {list(s)}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
