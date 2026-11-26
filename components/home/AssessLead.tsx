"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { completeDomain } from "@/lib/domain";
import { assessHref } from "@/lib/book";
import { useRouter } from "next/navigation";
import RiseHeading from "@/components/style/RiseHeading";
import { CtaButton } from "@/components/style/Cta";
import Awards from "@/components/bathurst/Awards";
import "@/app/terminal.css";
import "@/app/home.css";

/**
 * 01 · Hero: the website-assessment lead-in. It takes the old question box's place over the playing horizon (same
 * #terminal / .term positioning and scroll lead-in), so the map engine's hero timing is unchanged.
 * Until the assessment itself is built, "Assess My Website" carries the URL to /book (?website=), which pre-fills the form.
 */
export { assessHref } from "@/lib/book";

/* The domain completer now lives in lib/domain.ts, because the campaign landing page
   (components/tcg/check-lead.tsx) uses the same field behaviour. Re-exported here so
   existing imports of `completeDomain` from this module keep working. */
export { completeDomain } from "@/lib/domain";

export default function AssessLead() {
  const section = useRef<HTMLElement>(null);
  const router = useRouter();
  const [url, setUrl] = useState("");

  // lead-in: follows the first part of the hero's scroll up and out, then lets the map headline in (as the old terminal did)
  useEffect(() => {
    const sec = section.current, hero = sec?.closest<HTMLElement>("#hero"), stage = hero?.querySelector<HTMLElement>("#stick");
    if (!sec || !hero || !stage) return;
    const screens = parseFloat(hero.dataset.lead || "0") || 0;
    let raf = 0;
    const update = () => {
      raf = 0;
      const l = screens ? Math.min(1, Math.max(0, (scrollY - hero.offsetTop) / (screens * stage.clientHeight))) : 0;
      sec.style.setProperty("--lead", l.toFixed(3));
      sec.classList.toggle("is-gone", l >= .5);
      stage.classList.toggle("lead", l < .5);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);

  // what is still missing from the domain, if anything
  const tail = completeDomain(url);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    let site = (url + tail).trim();   // submitting takes the suggestion, so "acme" goes in as acme.com
    if (site && !/^https?:\/\//i.test(site)) site = `https://${site}`;
    router.push(assessHref(site));
  };

  return (
    <section ref={section} id="terminal" className="term assess-lead" aria-label="Free website assessment">
      <div className="term-main">
        <div className="term-intro">
          <RiseHeading className="h1 term-h" text={"Turn More Leads\nInto Sales."} delay={80} />
          <p className="term-sub al-sub2 rise-after" style={{ "--rise-delay": "380ms" } as CSSProperties}>Is your digital presence helping you grow?</p>
          <p className="term-sub al-sub3 rise-after" style={{ "--rise-delay": "440ms" } as CSSProperties}>Find out what’s working and what’s costing you customers.</p>
        </div>
        <form className="al-form rise-after" style={{ "--rise-delay": "520ms" } as CSSProperties} action="/book" method="get" onSubmit={submit}>
          <input type="hidden" name="service" value="Website assessment" />
          <label className="sr-only" htmlFor="al-url">Your website address</label>
          {/* the field, with the rest of the domain shown greyed behind the caret; → or Tab takes it */}
          <div className="al-field">
            <span className="al-ghost" aria-hidden="true"><i>{url}</i>{tail}</span>
            <input id="al-url" name="website" className="al-input" type="text" inputMode="url" autoComplete="off"
              spellCheck={false} placeholder="Enter your website URL"
              aria-describedby={tail ? "al-hint" : undefined}
              value={url} onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (!tail) return;
                const el = e.currentTarget, atEnd = el.selectionStart === url.length && el.selectionEnd === url.length;
                if (e.key === "Tab" || (e.key === "ArrowRight" && atEnd)) { e.preventDefault(); setUrl(url + tail); }
              }} />
            {/* what the suggestion is, for anyone who cannot see it greyed out */}
            {tail && <span id="al-hint" className="sr-only">Press Tab to complete {url}{tail}</span>}
          </div>
          <CtaButton type="submit" label="Assess Your Website" accent className="al-go" />
        </form>
        {/* the same proof row the map hero carries, under the fine print (components/bathurst/Awards.tsx) */}
        <Awards className="al-awards rise-after" style={{ "--rise-delay": "760ms" } as CSSProperties} />
      </div>
    </section>
  );
}
