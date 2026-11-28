import { Card } from "./card";
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
 *   1  what we are actually checking, and what this is not
 *   2  the business that thought its site was fine
 *   3  what happens if something IS wrong — and the CTA again
 *
 * FORMATS ARE THE HOME PAGE'S, NOT NEW ONES. The section shell is `.sec` with the
 * `.sec-head` rule over the headline, the three checks are `.svc-grid` of
 * <ServiceCard> (the same row the capabilities use, two to a row and one on a phone),
 * and the story is the wide `<Card lead>` from the selected-work row. Nothing here
 * invents a card: if one of these needs to change shape, it changes on the home page
 * and this follows.
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

      {/* The limit of the claim, in the brief's own words and kept on the page rather
          than in a tooltip: this is a first look, and saying so is what makes the rest
          of it believable. */}
      <p className="chk-note">
        This is a first look, not a full security audit. If we find something unusual,
        we’ll explain what it means and what to do next.
      </p>
    </section>
  );
}

/**
 * The redirect story, as the wide lead card.
 *
 * The art is a drawing, not a screenshot: two browser windows, the same address in
 * both, and a different page under it in the second. Nothing in it names a real
 * business or reproduces a real site — it is a diagram of the thing that happened,
 * which is all the story needs and all we can honestly show.
 */
function BrowserPair() {
  return (
    <svg
      className="chk-pair"
      viewBox="0 0 520 240"
      role="img"
      aria-label="The same website address showing the business's own page to the owner, and a different page to a customer"
    >
      {/* The owner's window: the site as they know it. */}
      <g className="chk-win">
        <rect x="8" y="24" width="232" height="186" rx="10" />
        <line x1="8" y1="52" x2="240" y2="52" />
        <circle cx="24" cy="38" r="3.5" />
        <circle cx="36" cy="38" r="3.5" />
        <circle cx="48" cy="38" r="3.5" />
        <rect className="chk-bar" x="62" y="32" width="164" height="12" rx="6" />
        {/* The page under it: a masthead and three lines of copy. */}
        <rect className="chk-ink" x="28" y="70" width="86" height="10" rx="3" />
        <rect className="chk-ink chk-ink--soft" x="28" y="92" width="184" height="7" rx="3.5" />
        <rect className="chk-ink chk-ink--soft" x="28" y="106" width="166" height="7" rx="3.5" />
        <rect className="chk-ink chk-ink--soft" x="28" y="120" width="176" height="7" rx="3.5" />
        <rect className="chk-plate" x="28" y="142" width="184" height="52" rx="6" />
      </g>

      {/* The arrow between them: the same address, a different destination. */}
      <g className="chk-arrow" aria-hidden="true">
        <line x1="252" y1="117" x2="268" y2="117" />
        <polyline points="263,111 269,117 263,123" />
      </g>

      {/* The customer's window: the address bar is identical, the page is not. */}
      <g className="chk-win chk-win--bad">
        <rect x="280" y="24" width="232" height="186" rx="10" />
        <line x1="280" y1="52" x2="512" y2="52" />
        <circle cx="296" cy="38" r="3.5" />
        <circle cx="308" cy="38" r="3.5" />
        <circle cx="320" cy="38" r="3.5" />
        <rect className="chk-bar" x="334" y="32" width="164" height="12" rx="6" />
        {/* Somewhere else entirely: a banner and two blocks, nothing like the page above. */}
        <rect className="chk-ink chk-ink--bad" x="300" y="70" width="172" height="26" rx="4" />
        <rect className="chk-plate chk-plate--bad" x="300" y="106" width="82" height="88" rx="6" />
        <rect className="chk-plate chk-plate--bad" x="392" y="106" width="92" height="88" rx="6" />
      </g>
    </svg>
  );
}

export function TheyThoughtItWasFine() {
  return (
    <section className="chk-sec" id="the-story" aria-labelledby="the-story-h">
      <Head id="the-story-h">They thought their website was fine, too.</Head>

      <div className="card-lead-row chk-story">
        <Card
          lead
          title="Some customers were being redirected to an online casino."
          dek="We helped a business whose website appeared normal whenever they visited it. But some customers were being sent somewhere else entirely, and they didn’t know it was happening. Your website is often the first interaction someone has with your business — if something goes wrong, they may simply leave without telling you."
          art={<BrowserPair />}
          cta="Check my website"
          href="#check-2-top"
        />
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

      {/* The CTA repeated, which is the whole job of the bottom of this page: the
          visitor who scrolled rather than typed has to be able to start without
          scrolling back for the field themselves. It goes to the first screen, where
          the instrument is. */}
      <div className="chk-again">
        <Cta href="#check-2-top" primary className="chk-again-go" label="Start with the free website check">
          Start with the free website check
        </Cta>
      </div>
    </section>
  );
}

export function CheckSections() {
  return (
    <>
      <WhatWeCheck />
      <TheyThoughtItWasFine />
      <WhatHappensNext />
    </>
  );
}
