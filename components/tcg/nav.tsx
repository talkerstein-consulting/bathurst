import { NAV } from "./nav-data";

/**
 * The page list, after Monocle's section bar: the titles set in the heading
 * face as small caps, divided by thin pipes, centred between the masthead rule
 * above and a hairline below. No numbers, no box, no fill — the rules do the
 * dividing.
 *
 * These are links, so they are allowed to turn orange on hover: orange marks
 * operable elements, and nothing else. The same list is carried by the sticky
 * bar and the megamenu, all three reading from ./nav-data.
 */
export function Nav() {
  return (
    <nav className="pages" aria-label="Primary">
      {/* D06: one row that scrolls sideways on narrow screens, never stacks. */}
      <ul>
        {NAV.map((s) => (
          <li key={s.label}>
            <a href={s.href}>{s.label}</a>
          </li>
        ))}
      </ul>
      <div className="pages-rule" aria-hidden="true" />
    </nav>
  );
}
