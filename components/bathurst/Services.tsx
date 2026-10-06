import { SERVICES, SERVICE_STAGES } from "@/lib/bathurst/data";
import { CtaLink } from "@/components/style/Cta";

const book = (service: string) => `/book?${new URLSearchParams({ service })}`;

/**
 * "What Gets You There": the services in three stages (Plan, Build, Run), all visible at once, in the page's own parts:
 * the heading; the section's one filled orange CTA after the list (the .dc-go style of "Get directions");
 * each stage's eyebrow and Cheltenham heading sit on the page background (like the footer's "Built in Toronto"); each
 * service is its own CTA, the page's outline button (.sprout .btn) holding its name and one line, the whole box a link to book it.
 */
export default function Services() {
  return (
    <section id="services" className="section svc-sec">
      <div className="wrap">
        <header className="svc-head">
          <h2 className="h2">What Gets You There</h2>
        </header>
        <ol className="svc-stages">
          {SERVICE_STAGES.map((st, i) => (
            <li key={st.key} className="svc-stage">
              <p className="eyebrow">Step {String(i + 1).padStart(2, "0")}</p>
              <h3 className="h3">{st.name}</h3>
              <p className="svc-stage-line">{st.line}</p>
              <ul>
                {st.order.map((slug) => SERVICES.find((s) => s.slug === slug)!).map((s) => (
                  <li key={s.slug} id={s.slug}>
                    {/* each scope is its own CTA: the page's outline button, the whole box a link to book it */}
                    <CtaLink href={book(s.name)} label={`${s.short}: ${s.line}`} className="svc-scope">
                      <span className="svc-scope-t"><b>{s.short}</b><small>{s.line}</small></span>
                      <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </CtaLink>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
        {/* after the services: the one filled CTA, for anyone not sure where to start */}
        <div className="svc-after">
          <p className="svc-after-t">Not sure where to start?</p>
          <CtaLink href={book("Diagnostics")} label="Get directions" className="dc-go svc-cta">
            <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l9.2 9.2-9.2 9.2L2.8 12z" /><path d="M9 14.5V12a1.5 1.5 0 011.5-1.5H15M13 8.5l2 2-2 2" /></svg>Get directions
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
