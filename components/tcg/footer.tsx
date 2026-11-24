import { NAV } from "./nav-data";
import Image from "next/image";

/**
 * The footer: light, full bleed across the window, with the vertical lockup
 * given the whole of its column, then columns of links, then the line of
 * record. It was briefly inverted; the client asked for the light theme back.
 *
 * The lockup is the real one, pulled from the portal's file library
 * (app.talkerstein.ca -> tcg-logo-rounded.png) and saved as
 * public/brand/tcg-logo-vertical.png: the mark over the wordmark on its own
 * Sea Breeze plate. Nothing here is composed or redrawn.
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

export function Footer() {
  return (
    <footer className="foot foot--bleed" id="footer">
      <div className="foot-in">
        <div className="foot-brand">
          <Image
            className="foot-lockup"
            src="/brand/tcg-logo-vertical.png"
            alt="Talkerstein Consulting Group"
            width={600}
            height={660}
            priority={false}
          />
        </div>

        <nav className="foot-cols" aria-label="Footer">
          {NAV.map((s) => (
            <div className="foot-col" key={s.label}>
              <h2>{s.label}</h2>
              <ul>
                {s.children.map(([href, label]) => (
                  <li key={label}>
                    <a href={href}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="foot-col">
            <h2>Legal &amp; privacy</h2>
            <ul>
              {LEGAL.map((l) => (
                <li key={l}>
                  <span className="foot-soon">{l}</span>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      <p className="foot-rule">
        <span>© {YEAR} Talkerstein Consulting Group</span>
      </p>
    </footer>
  );
}
