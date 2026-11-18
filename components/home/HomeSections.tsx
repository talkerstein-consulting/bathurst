import type { CSSProperties, ReactNode } from "react";
import { CtaLink } from "@/components/style/Cta";
import Card, { CardGrid } from "@/components/style/Card";
import JourneyPanels from "./JourneyPanels";
import SignatureLine from "@/components/bathurst/SignatureLine";
import type { CardAction } from "@/components/style/Card";

/**
 * The homepage sheet that rises over the client map (sections 03–08): what we assess, an example report, the business
 * opportunities, our services, how we work, and the closing call to action.
 * Cards are the site's card format (components/style/Card.tsx): the UI area on top, header, tags, body, one action.
 * Brand: Sea Breeze ground, Steel Blue ink, Muted Orange for the one accent action per section.
 */

/* ---------- placeholder iconography (line glyphs, 24px grid, currentColor) ---------- */
const ICONS: Record<string, ReactNode> = {
  speed: <><path d="M4 16a8 8 0 1116 0" /><path d="M12 16l4-5" /><circle cx="12" cy="16" r="1.2" /></>,
  inquiry: <><path d="M4 5h16v10H9l-5 4z" /><path d="M8 9h8M8 12h5" /></>,
  followup: <><path d="M4 12a8 8 0 0113.7-5.6L20 9" /><path d="M20 4v5h-5" /><path d="M20 12a8 8 0 01-13.7 5.6L4 15" /><path d="M4 20v-5h5" /></>,
  quote: <><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4M9 12h7M9 16h5" /></>,
  booking: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /><path d="M9 15l2 2 4-4" /></>,
  inbox: <><path d="M4 13l2-8h12l2 8v6H4z" /><path d="M4 13h5l1 2h4l1-2h5" /></>,
  chart: <><path d="M4 20h16" /><path d="M7 16v-5M12 16V7M17 16v-8" /></>,
  website: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M7 6.5h.01M10 6.5h.01" /></>,
  chat: <><path d="M4 6h11v8H8l-4 3z" /><path d="M15 9h5v8l-3-2h-5v-1" /></>,
  gears: <><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></>,
  megaphone: <><path d="M4 10v4h3l7 4V6l-7 4z" /><path d="M17 9a4 4 0 010 6" /></>,
};
const Icon = ({ name }: { name: string }) => (
  <svg className="hc-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{ICONS[name]}</svg>
);

type Feature = { icon: string; label: string; title: string; body: string };

/** One feature card on the site's card format (components/style/Card.tsx): the icon in the UI area, then the heading,
 *  its tag, the copy and the card's one action. */
function FeatureCard({ c, action }: { c: Feature; action: CardAction }) {
  return (
    <Card ui={<Icon name={c.icon} />} ratio="5 / 2" title={c.title} tags={[c.label]} action={action}>
      {c.body}
    </Card>
  );
}

function SectionHead({ eyebrow, title, lead, mid }: { eyebrow?: string; title: string; lead?: string; mid?: boolean }) {
  return (
    <header className={mid ? "hs-head hs-mid" : "hs-head"}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="h2 hs-h">{title}</h2>
      {lead && <p className="hs-lead">{lead}</p>}
    </header>
  );
}

/* ---------- 03 · Website assessment ---------- */
export function Assessment() {
  return (
    <section id="assess" className="section hs">
      <div className="wrap">
        {/* the heading sits in one column beside the phone the sequence plays on */}
        <JourneyPanels
          title="Your Website Has a Job to Do"
          lead="A website is often the first place a potential customer learns about your business. The same visitor, the same search, two websites — and two different outcomes."
        />
      </div>
    </section>
  );
}

/* ---------- 04 · Assessment results (sample report) ---------- */
const SCORES = [{ t: "Website Speed", s: 85 }, { t: "Customer Inquiries", s: 40 }, { t: "Lead Follow-Up", s: 20 }];
const tone = (s: number) => (s >= 70 ? "good" : s >= 50 ? "mid" : "low");

export function Results() {
  return (
    <section id="results" className="section hs">
      <div className="wrap">
        <SectionHead eyebrow="Assessment results" title="Here’s What We Found"
          lead="See how your website performs across the areas that matter to your business. We’ll highlight what’s working, what needs attention, and where you can improve." />
        <div className="frame hs-report" aria-label="Sample website assessment report">
          <div className="hs-report-top"><h3 className="hc-title">Your Website Assessment</h3><p className="hs-tag">Sample report</p></div>
          <ul className="hs-scores">
            {SCORES.map((r) => (
              <li key={r.t} className={`hs-score is-${tone(r.s)}`}>
                <div className="hs-meter" style={{ "--v": r.s } as CSSProperties} role="img" aria-label={`${r.t}: ${r.s} out of 100`}><b>{r.s}</b></div>
                <p className="hs-score-t">{r.t}</p>
                <p className="hs-k">Out of 100</p>
              </li>
            ))}
          </ul>
          <div className="hs-opp">
            <p className="hc-label">Your biggest opportunity</p>
            <p>Your website loads well, but there may be opportunities to make it easier for customers to contact you and keep track of incoming inquiries.</p>
          </div>
          <p className="hs-note">Illustrative results only. Actual findings depend on the website assessment.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------- 05 · Business opportunities ---------- */
const OPPS: Feature[] = [
  { icon: "quote", label: "Quotes", title: "Get More Quote Requests", body: "Give potential customers a simple way to explain what they need and request a quote without having to call." },
  { icon: "booking", label: "Booking", title: "Make Booking Easier", body: "Let customers check availability and schedule appointments directly through your website." },
  { icon: "inbox", label: "Inquiries", title: "Stay on Top of Inquiries", body: "Keep customer requests organized so your team knows who needs a response and what needs to happen next." },
  { icon: "chart", label: "Insight", title: "Know What’s Working", body: "See where inquiries come from and which parts of your website are helping bring in business." },
];

export function Opportunities() {
  return (
    <section id="opportunities" className="section hs">
      <div className="wrap">
        <SectionHead eyebrow="Business opportunities" title="More Than a Better Website"
          lead="Small improvements to how your website works can make a difference in how customers interact with your business." />
        <CardGrid as="ol" cols={4}>{OPPS.map((c) => <FeatureCard key={c.title} c={c} action={{ label: "Talk it through", href: "/book" }} />)}</CardGrid>
      </div>
    </section>
  );
}

/* ---------- 06 · Services ---------- */
const SERVICES: Feature[] = [
  { icon: "website", label: "Websites", title: "Websites That Work for Your Business", body: "Professional websites designed to explain your services, build trust, and turn visitors into customers." },
  { icon: "chat", label: "Communication", title: "Better Customer Communication", body: "Bring customer messages and inquiries together so your team can respond and keep conversations moving." },
  { icon: "gears", label: "Automation", title: "Systems That Save Time", body: "Reduce repetitive work with tools that handle follow-ups, bookings, customer updates, and everyday tasks." },
  { icon: "megaphone", label: "Marketing", title: "Marketing That Moves Business Forward", body: "Reach the right customers through better campaigns, useful content, and a clearer plan for growth." },
];

export function Solution() {
  return (
    <section id="solution" className="section hs">
      <div className="wrap">
        <SectionHead eyebrow="Talkerstein services" title="We Can Help You Put It Into Action"
          lead="Whether you need a better website, a more organized sales process, or help attracting customers, we build solutions around the way your business operates." />
        <CardGrid as="ol" cols={4}>{SERVICES.map((c) => <FeatureCard key={c.title} c={c} action={{ label: "Book a consult", href: "/book" }} />)}</CardGrid>
      </div>
    </section>
  );
}

/* ---------- 07 · Working relationship ---------- */
const STEPS = [
  { t: "Understand Your Business", d: "We learn how you operate, how customers find you, and what you want to improve." },
  { t: "Build the Right Solution", d: "We plan and develop the website, tools, and systems that address your needs." },
  { t: "Keep Improving", d: "As your business grows, we help maintain, improve, and expand the systems you rely on." },
];

export function Engagement() {
  return (
    <section id="engagement" className="section hs">
      <div className="wrap">
        <SectionHead eyebrow="Working relationship" title="A Partner Beyond the Project"
          lead="We don’t just deliver a website and walk away. We work with your business to understand what’s needed, build the right solution, and help improve it over time." />
        <ol className="hs-steps">
          {STEPS.map((s, i) => (
            <li key={s.t}><span className="hs-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span><h3 className="hc-title">{s.t}</h3><p className="hc-copy">{s.d}</p></li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- 08 · Final CTA ---------- */
export function FinalCta() {
  return (
    <section id="final-cta" className="section hs hs-final">
      <div className="wrap">
        <h2 className="h2 hs-h">Let’s Make Your Website Work Harder.</h2>
        <p className="hs-lead">You already have a business to run. Let us help make the technology behind it work better.</p>
        <SignatureLine bare />
        <CtaLink href="/book" label="Talk to Talkerstein" accent className="hs-cta">Talk to Talkerstein</CtaLink>
      </div>
    </section>
  );
}
