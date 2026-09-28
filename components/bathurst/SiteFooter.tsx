"use client";

import { useState } from "react";
import { CONTACT } from "@/lib/bathurst/data";

/**
 * Footer, after vacation.inc's: a ruled grid like a printed form on four shared columns (logo + contact,
 * two link columns, a newsletter row, fine print, checkbox-style links that tick on hover, and the legal strip),
 * in a style-guide frame. It closes the reviews/services sheet (one scrolling container).
 */
const EXPLORE = [
  { href: "https://talkerstein.com/work", label: "Work", external: true },
  { href: "#services", label: "Services" },
  { href: "#how", label: "How we work" },
];
const COMPANY = [
  { href: "https://talkerstein.com", label: "About us", external: true },
  { href: "#directions", label: "Get directions" },
  { href: `mailto:${CONTACT.email}`, label: "Questions?" },
];
// the profiles talkerstein.com links to
const SOCIAL = [
  { label: "Instagram", href: CONTACT.instagram },
  { label: "Facebook", href: CONTACT.facebook },
  { label: "Clutch", href: CONTACT.clutch },
  { label: "Google", href: "https://share.google/ys09a4729NPyQuGzg" },
];

export default function SiteFooter() {
  const [sent, setSent] = useState(false);
  const openDirections = (e: React.MouseEvent) => { e.preventDefault(); window.dispatchEvent(new Event("tcg:directions")); };
  return (
    <footer className="ft" id="site-footer" aria-label="Footer">
      <div className="ft-grid frame">
        <section className="ft-cell ft-brand">
          <h2 className="tcg-logo ft-logo" role="img" aria-label="Talkerstein Consulting Group" />
          <p>For more on how we work, talk to our team at <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a> or <a href={CONTACT.tel}>{CONTACT.phone}</a>. Clear direction is our number one priority.</p>
          <p>Visit us at <a href={CONTACT.map} target="_blank" rel="noopener">{CONTACT.address}</a>.</p>
        </section>
        <nav className="ft-cell" aria-label="Explore">
          <h2 className="ft-h">Explore</h2>
          {EXPLORE.map((l) => <a key={l.label} className="ft-link" href={l.href} {...(l.external ? { target: "_blank", rel: "noopener" } : {})}>{l.label}</a>)}
        </nav>
        <nav className="ft-cell" aria-label="Company">
          <h2 className="ft-h">Company</h2>
          {COMPANY.map((l) => <a key={l.label} className="ft-link" href={l.href} onClick={l.href === "#directions" ? openDirections : undefined} {...(l.external ? { target: "_blank", rel: "noopener" } : {})}>{l.label}</a>)}
        </nav>

        <form className="ft-news" onSubmit={(e) => { e.preventDefault(); setSent(true); /* TODO(integration): newsletter provider */ }}>
          <label className="ft-h" htmlFor="ft-email">Newsletter sign-up</label>
          <input id="ft-email" type="email" required placeholder="you@yourbusiness.com" autoComplete="email" disabled={sent} />
          <button type="submit" className="ft-h" disabled={sent}>{sent ? "Subscribed" : "Submit"}</button>
        </form>
        <p className="ft-fine">By entering your email address, you agree to receive our newsletter and other updates from Talkerstein Consulting Group. You can unsubscribe at any time using the link in our emails.</p>
        <ul className="ft-social">
          {SOCIAL.map((s) => (
            <li key={s.label}><a href={s.href} target="_blank" rel="noopener" className="ft-check">
              <i aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></i>{s.label}</a></li>
          ))}
        </ul>
        <div className="ft-legal">
          <nav aria-label="Legal">{[["Privacy Policy", "privacy-policy"], ["Terms of Use", "terms-of-use"], ["Cookies", "cookies"], ["Accessibility", "accessibility"]].map(([t, p]) => <a key={p} href={`https://talkerstein.com/${p}`} target="_blank" rel="noopener">{t}</a>)}</nav>
          <small>Map data © OpenStreetMap contributors (ODbL) · Elevation: AWS Terrain Tiles · © 2026 Talkerstein Consulting Group · Toronto, ON</small>
        </div>
      </div>
    </footer>
  );
}
