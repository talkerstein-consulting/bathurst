import { CtaLink } from "@/components/style/Cta";
import { assessHref } from "./AssessLead";

/**
 * The homepage sheet that rises over the map (03–07): what we assess, an example report, the solution, how we work together,
 * and the closing call to action. Brand: Sea Breeze ground, Steel Blue ink, Muted Orange for the one action per section.
 */

const AREAS = [
  { n: "01", t: "Website performance", d: "Speed, mobile experience, accessibility and search basics, measured with Google PageSpeed on phone and desktop." },
  { n: "02", t: "Lead capture readiness", d: "Whether visitors can see what you do, trust you, and reach you: clear calls to action, forms, phone and booking." },
  { n: "03", t: "Lead automation readiness", d: "What happens after someone reaches out: instant replies, follow-up, booking links and a CRM that catches every inquiry." },
];

// an illustrative report (clearly labelled as an example on the page), showing the shape of what a visitor receives
const EXAMPLE = [
  { t: "Website performance", s: 58, ev: "Largest image loads in 4.8 s on mobile", fix: "Compress and resize hero images; defer offscreen media" },
  { t: "Lead capture readiness", s: 71, ev: "Phone number is not tappable on mobile", fix: "Add a sticky call / book button on phones" },
  { t: "Lead automation readiness", s: 34, ev: "Contact form has no confirmation or follow-up", fix: "Send an instant reply and route inquiries into a CRM pipeline" },
];

const SOLUTION = [
  { t: "Website conversion systems", d: "Pages built around one clear next step, tested and measured." },
  { t: "GoHighLevel integration", d: "Forms, calls and chats flow into one pipeline, with follow-up that runs on its own." },
  { t: "Funnels", d: "Focused landing pages and offers that turn ad and search traffic into booked calls." },
  { t: "Ongoing optimization", d: "Monthly reviews of speed, leads and conversion, with fixes shipped as we go." },
];

const STEPS = [
  { t: "Assess", d: "We start from your report: what is working, what is missing, and what it is costing you." },
  { t: "Implement", d: "We build and connect the fixes: site, forms, CRM and automations, in a set order." },
  { t: "Partner", d: "We stay on as your technology partner, measuring results and planning what comes next." },
];

const tone = (s: number) => (s >= 70 ? "good" : s >= 50 ? "mid" : "low");

export function Assessment() {
  return (
    <section id="assess" className="section hs">
      <div className="wrap">
        <p className="eyebrow">Free website assessment</p>
        <h2 className="h2 hs-h">Three things we assess about your website.</h2>
        <ol className="hs-areas">
          {AREAS.map((a) => (
            <li key={a.n} className="frame hs-area">
              <span className="hs-n" aria-hidden="true">{a.n}</span>
              <h3 className="hs-t">{a.t}</h3>
              <p>{a.d}</p>
            </li>
          ))}
        </ol>
        <CtaLink href={assessHref()} label="Analyze my website" accent className="hs-cta">Analyze My Website</CtaLink>
      </div>
    </section>
  );
}

export function Results() {
  return (
    <section id="results" className="section hs">
      <div className="wrap">
        <p className="eyebrow">What you receive</p>
        <h2 className="h2 hs-h">Discover what’s working and what’s missing.</h2>
        <p className="hs-lead">Every assessment ends with three scores, the evidence behind each one, and the improvements that matter most.</p>
        <div className="frame hs-report" aria-label="Example assessment report">
          <p className="hs-tag">Example report</p>
          <ul className="hs-scores">
            {EXAMPLE.map((r) => (
              <li key={r.t} className={`hs-score is-${tone(r.s)}`}>
                <div className="hs-meter" style={{ "--v": r.s } as React.CSSProperties} role="img" aria-label={`${r.t}: ${r.s} out of 100`}>
                  <b>{r.s}</b>
                </div>
                <h3 className="hs-t">{r.t}</h3>
                <p><span className="hs-k">Evidence</span>{r.ev}</p>
                <p><span className="hs-k">Recommended</span>{r.fix}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Solution() {
  return (
    <section id="solution" className="section hs">
      <div className="wrap">
        <p className="eyebrow">The solution</p>
        <h2 className="h2 hs-h">Your website should do more than look good.</h2>
        <ul className="hs-grid">
          {SOLUTION.map((s) => (
            <li key={s.t} className="frame hs-card"><h3 className="hs-t">{s.t}</h3><p>{s.d}</p></li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Engagement() {
  return (
    <section id="engagement" className="section hs">
      <div className="wrap">
        <p className="eyebrow">How we work</p>
        <h2 className="h2 hs-h">A technology partner for what’s next.</h2>
        <ol className="hs-steps">
          {STEPS.map((s, i) => (
            <li key={s.t}><span className="hs-n" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span><h3 className="hs-t">{s.t}</h3><p>{s.d}</p></li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section id="final-cta" className="section hs hs-final">
      <div className="wrap">
        <h2 className="h2 hs-h">Make More of Your Website.</h2>
        <p className="accent">Built for what’s next.</p>
        <CtaLink href={assessHref()} label="Analyze my website" accent className="hs-cta">Analyze My Website</CtaLink>
        <p className="al-fine">Free website assessment · No obligation</p>
      </div>
    </section>
  );
}
