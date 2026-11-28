import Device from "@/components/react-bits/device";
import Awards from "@/components/bathurst/Awards";
import { Cta } from "./cta";
import { Ground } from "./figures";
import { ServiceCard } from "./service-card";

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
 * The three things the check looks for. The dek under each is the brief's own line for
 * it, turned from a bullet into a sentence that can stand in a card.
 *
 * Every card points back at the instrument rather than at a page that does not exist —
 * the same thing the home page's capability cards do with `#intake`.
 */
const CHECKS: Array<[string, string]> = [
  [
    "Unexpected redirects",
    "Visitors sent somewhere other than your website, often without you ever seeing it happen yourself.",
  ],
  [
    "Browser warnings",
    "The interstitials and padlock warnings that stop a customer before they have read a word of your page.",
  ],
  [
    "How the site is experienced",
    "The things that quietly change what a visit feels like, on the connection and the device your customer actually has.",
  ],
];

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
      <Head id="advisory-h">A warning from Canada’s Cyber Centre.</Head>

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
          to date.
        </p>
      </div>

      {/* Straight to the Cyber Centre, not to a page of ours about it: the whole value
          of citing an advisory is that the reader can go and read it. It opens in its
          own tab so the check they came for is not navigated away from, and says where
          it goes, because a link that leaves the site should say so before it is taken. */}
      <p className="chk-source">
        <a
          className="chk-source-link"
          href="https://www.cyber.gc.ca/en/alerts-advisories/wordpress-security-advisory-av26-1117"
          target="_blank"
          rel="noopener noreferrer"
        >
          Read the official Canadian advisory
          <span className="chk-source-out" aria-hidden="true">↗</span>
          <span className="sr-only"> (opens cyber.gc.ca in a new tab)</span>
        </a>
      </p>
      </div>

      {/* The check, in the hand it is actually done in.
          *
          * The frame is @reactbits-starter/device-tw (components/react-bits/device.tsx),
          * which takes children rather than a screenshot — so what is inside the glass
          * is the page's own markup in the page's own classes, not a picture of it. It
          * is the mobile layout of the intake shown on desktop too, which is the point:
          * most of the people this advisory reaches will open the check on a phone.
          *
          * NOT INTERACTIVE, and deliberately so. The live field is the one in the hero;
          * a second <form> with a second #inst-url would be two of the only control on
          * the page. This one is inert, hidden from the tab order and from screen
          * readers, and the caption under the section is what points at the real one. */}
      <div className="chk-device" aria-hidden="true">
        <Device
          finish="titanium"
          island
          width={248}
          shadow={0.9}
          /* The component's glass reflection is a grey wash over the whole screen. At
             its default it took the page's cream down to slate and made the interface
             inside look switched off. Kept, but faint — enough for glass, not enough to
             recolour what is under it. */
          reflection={0}
          screenColor="#FCF8F1"
          enableParallax
          parallaxStrength={6}
        >
          <div className="chk-screen">
            <p className="chk-screen-h">
              Canada’s WordPress security advisory. Is your website affected?
            </p>
            <div className="inst-intake chk-screen-box">
              <div className="inst-field single chk-screen-field">yourwebsite.com</div>
              <div className="btn primary inst-go chk-screen-go">Check my website</div>
              <Awards className="inst-awards inst-awards--intake" logos />
            </div>
          </div>
        </Device>
      </div>
      </div>
    </section>
  );
}

export function WhatWeCheck() {
  return (
    <section className="chk-sec" id="what-we-check" aria-labelledby="what-we-check-h">
      <Head id="what-we-check-h" bare>A closer look at your website.</Head>

      <p className="chk-lead">
        Your website can look perfectly normal while something is happening behind the
        scenes.
      </p>

      <div className="svc-grid chk-grid">
        {CHECKS.map(([title, dek], i) => (
          <ServiceCard
            key={title}
            title={title}
            dek={dek}
            at={i}
            art={<Ground seed={i} />}
            cta="Check my website"
            href="#check-2-top"
          />
        ))}
      </div>

    </section>
  );
}

export function WhatHappensNext() {
  return (
    <section className="chk-sec chk-sec--last" id="what-next" aria-labelledby="what-next-h">
      <Head id="what-next-h">Not every website needs a rebuild.</Head>

      <div className="chk-say">
        <p>
          Sometimes, an update is all it takes. Other times, outdated software or a
          difficult-to-maintain setup can make it harder to keep your website secure and
          reliable.
        </p>
        <p>
          We’ll help you understand what needs attention and whether your current setup
          is still the right fit. If it’s time for a change, Talkerstein can build a
          simpler, more manageable website around the way your business operates today.
        </p>
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
      <Head id="final-cta-h">Don’t wait for a customer to notice.</Head>

      <p className="chk-lead">
        Find out what your website might be exposing, and what deserves your attention.
      </p>

      <div className="chk-again">
        <Cta href="#check-2-top" primary className="chk-again-go" label="Check my website">
          Check my website
        </Cta>
      </div>

      <p className="chk-fine">
        Free check <span aria-hidden="true">·</span> 30 seconds{" "}
        <span aria-hidden="true">·</span> No password needed
      </p>
    </section>
  );
}

export function CheckSections() {
  return (
    <>
      <CyberCentreWarning />
      <WhatWeCheck />
      <WhatHappensNext />
      <FinalCta />
    </>
  );
}
