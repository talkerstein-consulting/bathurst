"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import RiseHeading from "@/components/style/RiseHeading";
import { CtaButton } from "@/components/style/Cta";
import "@/app/terminal.css";
import "@/app/home.css";

/**
 * 01 · Hero: the website-assessment lead-in. It takes the old question box's place over the playing horizon (same
 * #terminal / .term positioning and scroll lead-in), so the map engine's hero timing is unchanged.
 * Until the assessment itself is built, "Assess My Website" carries the URL to /book (?website=), which pre-fills the form.
 */
export const assessHref = (website = "") =>
  `/book?${new URLSearchParams({ service: "Website assessment", ...(website ? { website } : {}) })}`;

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

  const submit = (e: FormEvent) => {
    e.preventDefault();
    let site = url.trim();
    if (site && !/^https?:\/\//i.test(site)) site = `https://${site}`;
    router.push(assessHref(site));
  };

  return (
    <section ref={section} id="terminal" className="term assess-lead" aria-label="Free website assessment">
      <div className="term-main">
        <div className="term-intro">
          <RiseHeading className="h1 term-h" text="Is Your Website Bringing You Business?" delay={80} />
          <p className="term-sub rise-after" style={{ "--rise-delay": "380ms" } as CSSProperties}>
            Your website should do more than tell people what you offer. It should help them find what they need, get in touch, and take the next step with your business.
          </p>
          <p className="term-sub al-sub2 rise-after" style={{ "--rise-delay": "450ms" } as CSSProperties}>Find out how well your website is doing with a free assessment.</p>
        </div>
        <form className="al-form rise-after" style={{ "--rise-delay": "520ms" } as CSSProperties} action="/book" method="get" onSubmit={submit}>
          <input type="hidden" name="service" value="Website assessment" />
          <label className="sr-only" htmlFor="al-url">Your website address</label>
          <input id="al-url" name="website" className="al-input" type="text" inputMode="url" autoComplete="url" placeholder="Enter your website URL"
            value={url} onChange={(e) => setUrl(e.target.value)} />
          <CtaButton type="submit" label="Assess My Website" accent className="al-go" />
        </form>
        <p className="al-fine rise-after" style={{ "--rise-delay": "640ms" } as CSSProperties}>Free website assessment. No commitment required.</p>
      </div>
    </section>
  );
}
