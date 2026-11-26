"use client";

import Image from "next/image";
import { siFacebook, siInstagram } from "simple-icons";
import { CONTACT } from "@/lib/bathurst/data";
import { NAV } from "./nav-data";

/**
 * The compact footer: React Bits Pro's `footer-14`, rebuilt on the brand's own tokens
 * the way `footer-13` was for the site footer (components/tcg/footer.tsx).
 *
 * One band: the wordmark and the line of record on the left, the section links in the
 * middle, the profiles on the right. The campaign landing page uses it instead of the
 * full footer, because the envelope above it already carries the one ask and a five
 * column site map under it would only offer ways out.
 *
 * What came from the block and what did not:
 *  - Kept: the single row, the links that wrap to their own line on a phone, the
 *    underline that follows the pointer across them, and the round icon targets.
 *  - Dropped: the block's own lockup, its "© 2026 Fernhill" and its four social
 *    accounts, which were the vendor's placeholders. The wordmark here is the brand's
 *    SVG, the year is the site's own literal, and the two profiles are the real ones
 *    from lib/bathurst/data.ts. No account is linked that does not exist.
 *  - Dropped: Motion's scroll reveal. The site's own reveal (./foot-reveal.tsx) already
 *    plays on the band above this one, and two different fades in a row read as a fault.
 *
 * The underline follows the pointer in CSS (a scaled hairline under each link) rather
 * than through a shared layout animation, so it needs no JS and obeys D11's one motion
 * rule along with everything else on the page.
 */

/** The year of record, as a literal: `new Date()` is an unstable value at prerender. */
const YEAR = 2026;

const PROFILES = [
  { label: "Talkerstein on Instagram", href: CONTACT.instagram, path: siInstagram.path },
  { label: "Talkerstein on Facebook", href: CONTACT.facebook, path: siFacebook.path },
];

export function FootCompact() {
  return (
    <footer className="footc" id="footer">
      <div className="footc-in">
        <div className="footc-brand">
          <Image
            className="footc-word"
            src="/brand/tcg-text.svg"
            alt="TCG"
            width={1032}
            height={232}
          />
          <p className="footc-year">© {YEAR} Talkerstein Consulting Group</p>
        </div>

        <nav className="footc-nav" aria-label="Sections">
          <ul>
            {NAV.map((s) => (
              <li key={s.label}>
                <a href={s.href}>{s.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <ul className="footc-social">
          {PROFILES.map((p) => (
            <li key={p.label}>
              <a href={p.href} aria-label={p.label} rel="me noreferrer" target="_blank">
                <svg viewBox="0 0 24 24" className="glyph" aria-hidden="true" fill="currentColor">
                  <path d={p.path} />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
