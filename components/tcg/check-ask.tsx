"use client";

import { Cta } from "./cta";
import { useCheckedSite } from "./checked-site";

/**
 * Section 04 of the campaign landing page — the ask — written on the letter inside the
 * footer's envelope, in place of the newsletter sign-up.
 *
 * It takes the envelope's own classes (.foot-news-card is the airmail border, and
 * .foot-news-sheet the card inside it), so the page gains no new surface: it is the same
 * envelope the site already has, with a different letter in it. The heading inherits the
 * sheet's script face, which is what makes it read as written rather than set.
 *
 * The link carries the website that was just checked, where there is one, so the booking
 * form opens with it already filled in (components/tcg/checked-site.ts).
 */
export function CheckAsk({ bookHref }: { bookHref: string }) {
  const site = useCheckedSite();
  const href = site ? `${bookHref}&website=${encodeURIComponent(site)}` : bookHref;

  return (
    <div className="foot-news-card ck-envelope" id="next">
      <div className="foot-news-sheet">
        <h2>Let&rsquo;s take a closer look.</h2>
        <p>
          We&rsquo;ll review your website for unexpected redirects and browser warnings,
          then explain what we find.
        </p>
        <Cta as="a" href={href} primary className="ck-ask" label="Ask for my free website check">
          Ask for my free website check
        </Cta>
        <p className="ck-fine">No password needed. No obligation.</p>
      </div>
    </div>
  );
}
