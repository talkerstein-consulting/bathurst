"use client";

import { useState } from "react";
import { CONTACT } from "@/lib/bathurst/data";

/**
 * Footer, after vacation.inc's: a ruled grid like a printed form on four shared columns (logo + contact,
 * two link columns, a newsletter row, fine print, checkbox-style links that tick on hover, and the legal strip),
 * in a style-guide frame. It closes the reviews/services sheet (one scrolling container).
 */
const EXPLORE = [
  { href: "#services", label: "Services" },
  { href: "https://talkerstein.com/work", label: "Work", external: true },
  { href: "https://talkerstein.com", label: "About", external: true },
  { href: "/book", label: "Get directions" },
];
// TODO(seo): point these at dedicated service pages once they exist; for now they land on each service card
const SERVICE_LINKS = [
  ["web-design", "Web Design & Development"], ["seo", "SEO"], ["branding", "Branding"],
  ["automation", "Automation"], ["ai", "AI Implementation"], ["business-consulting", "Business Consulting"],
].map(([slug, label]) => ({ href: `#${slug}`, label }));
// the profiles talkerstein.com links to
const SOCIAL = [
  { label: "Instagram", href: CONTACT.instagram },
  { label: "Facebook", href: CONTACT.facebook },
  { label: "Clutch", href: CONTACT.clutch },
  { label: "Google", href: "https://share.google/ys09a4729NPyQuGzg" },
];

export default function SiteFooter() {
  const [sent, setSent] = useState(false);
  return (
    <footer className="ft" id="site-footer" aria-label="Footer">
      <div className="ft-grid frame">
        {/* top row: who we are and where; the address itself lives once, in the brand cell below */}
        <section className="ft-local" aria-labelledby="ft-local-h">
          <div>
            <p className="eyebrow">Based in North York</p>
            <h2 id="ft-local-h" className="h2">Built in Toronto<svg className="ft-flag" viewBox="0 0 9600 4800" role="img" aria-label="Canada"><path fill="#d52b1e" d="M0 0h9600v4800H0z" /><path fill="#fff" d="m2400 0h4800v4800h-4800zm2490 4430-45-863a95 95 0 0 1 111-98l859 151-116-320a65 65 0 0 1 20-73l941-762-212-99a65 65 0 0 1-34-79l186-572-542 115a65 65 0 0 1-73-38l-105-247-423 454a65 65 0 0 1-111-57l204-1052-327 189a65 65 0 0 1-91-27l-332-652-332 652a65 65 0 0 1-91 27l-327-189 204 1052a65 65 0 0 1-111 57l-423-454-105 247a65 65 0 0 1-73 38l-542-115 186 572a65 65 0 0 1-34 79l-212 99 941 762a65 65 0 0 1 20 73l-116 320 859-151a95 95 0 0 1 111 98l-45 863z" /></svg></h2>
          </div>
          <p>Talkerstein is a Toronto consulting and digital agency based in North York. We work with businesses across Toronto and the Greater Toronto Area on websites, branding, SEO, automation, AI and digital strategy.</p>
        </section>
        <section className="ft-cell ft-brand">
          <h2 className="tcg-logo ft-logo" role="img" aria-label="Talkerstein Consulting Group" />
          <p>Toronto business consulting, web design, AI, automation, SEO and branding.</p>
          <address>
            <a href={CONTACT.map} target="_blank" rel="noopener">5050 Dufferin Street, Toronto, ON M3H 5T5, Canada</a><br />
            <a href={CONTACT.tel}>(416) 937-7676</a> · <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </address>
          <h3 className="ft-h ft-serving">Serving</h3>
          <p>Toronto · North York · Greater Toronto Area</p>
        </section>
        <nav className="ft-cell" aria-label="Explore">
          <h2 className="ft-h">Explore</h2>
          {EXPLORE.map((l) => <a key={l.label} className="ft-link" href={l.href} {...(l.external ? { target: "_blank", rel: "noopener" } : {})}>{l.label}</a>)}
        </nav>
        <nav className="ft-cell" aria-label="Services">
          <h2 className="ft-h">Services</h2>
          {SERVICE_LINKS.map((l) => <a key={l.label} className="ft-link" href={l.href}>{l.label}</a>)}
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
          <small>Map data © OpenStreetMap contributors (ODbL) · Elevation: AWS Terrain Tiles · © 2026 Talkerstein Consulting Group</small>
        </div>
      </div>
    </footer>
  );
}
