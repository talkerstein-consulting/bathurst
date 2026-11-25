import { FootTabs, type FootSection } from "./foot-tabs";
import { NAV } from "./nav-data";
import FooterLockup from "./footer-lockup";

/**
 * The footer: light, full bleed across the window, with the vertical lockup
 * given the whole of its column, then columns of links, then the line of
 * record. It was briefly inverted; the client asked for the light theme back.
 *
 * The lockup is the real one, and it now assembles itself: ./footer-lockup.tsx
 * plays the endcard animation the agency already uses on its social work
 * (239 TCG Social Media Case Studies/endcard) — the globe turns, settles onto
 * the logo's own graticule, then the wordmark grows out of its centreline. It
 * runs once when the footer scrolls into view.
 *
 * It replaced the flat public/brand/tcg-logo-vertical.png, which stays in the
 * tree as the OG/share image. Nothing here is composed or redrawn: every path
 * comes from the shipped brand files.
 *
 * The strapline "Planned. Built. Seen through." and the two footer CTAs were
 * removed at the client's request.
 *
 * The columns are the same navigation the rest of the site carries, read from
 * ./nav-data — so nothing here can drift from the page bar or the megamenu.
 *
 * PLACEHOLDER: the legal column points nowhere. Those pages do not exist, so
 * the links are not links and answer a press with nothing to press.
 */
const LEGAL = ["Privacy policy", "Terms & conditions", "Cookie policy"];

/**
 * The year of record, as a literal.
 *
 * new Date() here is an unstable value during prerender and Next refuses it.
 *
 * TODO(content): bump this each January.
 */
const YEAR = 2026;

/**
 * The columns in one shape: the site navigation as it is everywhere else,
 * then the legal column, whose entries are labels rather than links because
 * those pages do not exist. ./foot-tabs.tsx lays them out as columns on a
 * wide screen and as tabs on a phone.
 */
const SECTIONS: FootSection[] = [
  ...NAV.map((s) => ({
    label: s.label,
    items: s.children.map(([href, label]) => ({ href, label })),
  })),
  { label: "Legal & privacy", items: LEGAL.map((label) => ({ label })) },
];

export function Footer() {
  return (
    <footer className="foot foot--bleed" id="footer">
      <div className="foot-in">
        <div className="foot-brand">
          <FooterLockup className="foot-lockup" />
        </div>

        <FootTabs sections={SECTIONS} />
      </div>

      <p className="foot-rule">
        <span>© {YEAR} Talkerstein Consulting Group</span>
      </p>
    </footer>
  );
}
