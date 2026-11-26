import type { Metadata } from "next";
import { CheckAsk } from "@/components/tcg/check-ask";
import { CheckLead } from "@/components/tcg/check-lead";
import { FootCompact } from "@/components/tcg/foot-compact";
import { FootReveal } from "@/components/tcg/foot-reveal";
import { TopBar } from "@/components/tcg/topbar";
import { assessHref } from "@/lib/book";
import "../check.css";

/**
 * The campaign landing page.
 *
 * The visitor comes from the email, so this page does not re-sell the agency: four
 * sections, with the PageSpeed check doing the work.
 *
 *   01 Hero — the assessment          ┐ components/tcg/check-lead.tsx
 *   02 Results — show, don't tell     ┘
 *   03 The security concern — here
 *   04 The next step — the letter in the envelope, above the footer:
 *                                       components/tcg/check-ask.tsx
 *
 * What it keeps from the site: the condensed bar as its header, the envelope, the CTA
 * and frame line system, the type scale and the tokens. What it leaves out on purpose:
 * the full masthead, the capabilities, the process, the portfolio and the five-column
 * footer. Those are conversations for after the visitor sees their own numbers.
 */
export const metadata: Metadata = {
  title: "Check your website — TCG",
  description:
    "Enter your website address for a free performance and accessibility check, and see what your customers might be experiencing.",
  /* A campaign landing page is for the people in the campaign, not for search. */
  robots: { index: false, follow: false },
};

export default function Check() {
  return (
    <>
      {/* The condensed bar is this page's header at every width — there is no full
          masthead here for it to replace, so it is shown from the first paint. */}
      <TopBar always />

      <div className="shell ck-shell">
        <main className="col ck-col">
          <CheckLead bookHref={assessHref()}>
            {/* ----------------------------------- 03 · the security concern -- */}
            {/* Between the numbers and the ask, because it is the reason the numbers
                are not the whole answer. Stated as what happened to one business, not
                as a warning about what might happen to this one. */}
            <section className="ck-concern" aria-labelledby="concern-h">
              <h2 id="concern-h" className="ck-h2">
                Your website might be doing something you can&rsquo;t see.
              </h2>
              <div className="ck-concern-body ck-two">
                <p>
                  We helped a local business whose website looked normal to them but quietly
                  sent some visitors to an online casino.
                </p>
                <p>
                  A customer who lands on a page like that may close it without ever telling
                  you.
                </p>
              </div>
            </section>
          </CheckLead>
        </main>
      </div>

      {/* 04 · the ask, in the envelope the site footer already uses for its letter. It
          keeps the footer's own reveal, so it arrives the way that band always does. */}
      <FootReveal className="ck-envelope-band">
        <CheckAsk bookHref={assessHref()} />
      </FootReveal>

      <FootCompact />
    </>
  );
}
