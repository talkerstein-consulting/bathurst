import { Clients } from "./clients";
import { Frame } from "./frame";
import { Ground } from "./figures";
import { RevealStatement } from "./reveal-statement";

/**
 * What sits under the first screen of /check-2.
 *
 * The instrument above is the conversion surface; this is the part that earns the
 * address rather than asking for it again. Three sections and one repeat of the CTA,
 * in the order the brief sets them:
 *
 *   1  the advisory, and a link straight to it
 *   2  what we are actually checking
 *   3  what happens if something IS wrong
 *   4  the last word, and the CTA again
 *
 * The redirect story ("They thought their website was fine, too.") was removed at the
 * client's request, with the wide lead card and the two-browser drawing that carried
 * it. So was the "first look, not a full security audit" qualification under section 1.
 *
 * FORMATS ARE THE HOME PAGE'S, NOT NEW ONES. The section shell is `.sec-head` over a
 * `.svc-grid` of <ServiceCard> — the same row the capabilities use. Nothing here
 * invents a card: if one needs to change shape, it changes on the home page and this
 * follows.
 *
 * The headings are the client's own copy, supplied verbatim. Do not reword them.
 */

/**
 * The section heading, the same shell components/tcg/sections.tsx uses.
 *
 * `bare` drops the thick rule over the headline — the same modifier the home page uses
 * on "Built for the business you're becoming." The first section under the fold takes
 * it, because a rule there would draw a line straight across the join the paper is
 * there to hide.
 */
function Head({ id, bare, children }: { id: string; bare?: boolean; children: string }) {
  return (
    <div className={bare ? "sec-head sec-head--bare" : "sec-head"}>
      <h2 id={id}>{children}</h2>
    </div>
  );
}

/**
 * The advisory itself, in the client's own words.
 *
 * VERIFIED against the source on 2026-11-28: cyber.gc.ca serves AV26-1117, dated
 * November 3 2026, naming WordPress Core prior to 7.1.4, and stating that CISA added
 * CVE-2026-119977 to the Known Exploited Vulnerabilities catalogue that day. Every
 * claim this section makes is in that document. The specific version and CVE are NOT
 * named here because the supplied copy does not name them — they are in the advisory
 * one click away, and the link is the point of the section.
 *
 * It goes first under the fold because it is the evidence for the headline above it:
 * the hero asserts an advisory exists, and this is where a reader goes to check.
 */
export function CyberCentreWarning() {
  return (
    <section className="chk-sec" id="advisory" aria-labelledby="advisory-h">
      <Head id="advisory-h">Canada’s Cyber Centre is raising the alarm.</Head>
      {/* The credit line: whose advisory this is, under the heading, in a low tint. */}
      <p className="chk-credit">
        Advisory AV26-1117, issued by the Canadian Centre for Cyber Security on
        November 3, 2026.
      </p>

      <div className="chk-split">
      <div className="chk-left">
      <div className="chk-say">
        <p>
          On November 3, 2026, the Canadian Centre for Cyber Security issued an advisory
          concerning vulnerable WordPress installations.
        </p>
        <p>
          The advisory identifies WordPress versions affected by a security
          vulnerability. The US Cybersecurity and Infrastructure Security Agency also
          added the vulnerability to its Known Exploited Vulnerabilities catalogue.
        </p>
        <p>
          <b>That means this isn’t just a theoretical security concern.</b>
        </p>
        <p>
          If your business runs WordPress, it’s worth confirming that your website is up
          to date.{" "}
          <a className="chk-inline-link" href="https://www.cyber.gc.ca/en/alerts-advisories/wordpress-security-advisory-av26-1117" target="_blank" rel="noopener noreferrer">
            Read the official Canadian advisory
            <span className="sr-only"> (opens cyber.gc.ca in a new tab)</span>
          </a>
          .
        </p>
      </div>

      </div>

      {/* THE ADVISORY ITSELF, as a clipping laid on the site's blue dither ground
          (./figures.tsx Ground, the service cards' own). Every line on the clipping is
          from the advisory as cited above: its number (AV26-1117, from its URL), its
          date, its issuer, and the affected versions it names. Decorative: the caption
          and the body copy carry the same facts as text. */}
      <figure className="chk-news">
        <div className="svc-art chk-news-art" aria-hidden="true">
          <Ground seed={1} />
          {/* A SNIPPET OF THE PAGE ITSELF: the advisory's own title, serial number,
              date and opening lines, word for word from cyber.gc.ca (read 2026-11-28),
              laid out the way that page lays them out. Cut off mid-page, as a clipping
              is. No Government of Canada wordmark: this quotes the advisory, it does
              not pose as the site. */}
          <div className="chk-news-clip">
            <p className="chk-news-crumb">Canadian Centre for Cyber Security &rsaquo; Alerts and advisories</p>
            <p className="chk-news-h">WordPress security advisory (AV26-1117)</p>
            <p className="chk-news-line"><b>Serial number:</b> AV26-1117</p>
            <p className="chk-news-line"><b>Date:</b> November 3, 2026</p>
            <p className="chk-news-body">
              As of October 31, 2026, WordPress is affected by a vulnerability in the
              following product:
            </p>
            <ul className="chk-news-list">
              <li>WordPress Core<ul><li>Prior to 7.1.4</li></ul></li>
            </ul>
            <p className="chk-news-body">
              On November 3, 2026, Cybersecurity and Infrastructure Security Agency (CISA)
              added CVE-2026-119977 to their Known Exploited Vulnerabilities (KEV) Database.
            </p>
          </div>
        </div>
      </figure>
      </div>
    </section>
  );
}

/**
 * The last word, and the CTA repeated.
 *
 * This is the whole job of the bottom of the page: the visitor who scrolled instead of
 * typing has to be able to start without going back up to look for the field. It goes
 * to the first screen, where the instrument is.
 *
 * The fine print that was taken off the intake earlier in the build lives HERE instead.
 * Under the field it was a caption on a control that needed none; at the foot of the
 * page, where the ask is being made of someone who has read the whole argument, the
 * three answers it gives — free, quick, nothing to sign in to — are the objections
 * actually left.
 */
export function FinalCta() {
  return (
    <section className="chk-sec chk-sec--last chk-final" id="final-cta" aria-labelledby="final-cta-h">
      {/* The clients' own cards in the double-stroke frame, under the closing line. */}
      <Frame className="chk-proof">
        <div className="chk-proof-head">
          <h2 className="chk-proof-h" id="final-cta-h">
            When something goes wrong, you’ll wish you’d checked sooner.
          </h2>
          <p className="chk-proof-lead">
            Make sure your website has the attention it needs before problems become
            business interruptions.
          </p>
        </div>
        <Clients embedded />
      </Frame>
    </section>
  );
}

export function CheckSections() {
  return (
    <>
      <UncheckedStatement />
      <CyberCentreWarning />
      <FinalCta />
    </>
  );
}

/**
 * The opening statement of the scrolling column. Each word starts faint and comes to
 * full strength as it scrolls up through the window (app/check-2.css, .chk-reveal);
 * without scroll-driven animation, or with reduced motion, it is simply at full strength.
 * The words are split for the effect only: the h2 is read whole by assistive tech.
 */
const STATEMENT =
  "You wouldn’t leave your front door unlocked. Why leave your digital business unchecked?";

function UncheckedStatement() {
  return <RevealStatement id="statement-h" text={STATEMENT} />;
}
