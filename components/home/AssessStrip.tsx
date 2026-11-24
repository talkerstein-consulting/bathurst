"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CtaButton } from "@/components/style/Cta";
import { assessHref } from "./AssessLead";

/**
 * The assessment, kept within reach: a compact strip pinned to the bottom of the screen — the field and one button —
 * for the stretch of the page where the hero's own intake has scrolled away and no other assessment or booking button
 * is on screen (STYLE.md D04: a pinned conversion CTA whenever none is visible). It steps aside for the map's sheets
 * and the menu, and components/home/ThumbCta.tsx stands down while it is up, so only one pinned action shows at a time.
 */
// only an assessment button of its own stands the strip down: the navbar's booking CTA is a different action, and it
// is on screen the whole way down the page
const OTHERS = '.al-go, .hs-cta';

const onScreen = (el: Element) => {
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return false;
  for (let e: Element | null = el; e; e = e.parentElement) {
    const cs = getComputedStyle(e);
    if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity < .1) return false;
  }
  return true;
};

export default function AssessStrip() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"site" | "email">("site");
  const typing = useRef(false);
  const mail = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let t = 0;
    const check = () => {
      t = 0;
      if (typing.current) return;   // never pull the strip out from under someone mid-type
      const busy = document.querySelector('#labels .pin.sel, .menubtn[aria-expanded="true"]') || document.documentElement.classList.contains("term-open");
      setShow(!busy && ![...document.querySelectorAll(OTHERS)].some(onScreen));
    };
    const on = () => { if (!t) t = window.setTimeout(check, 150); };
    check();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    const iv = window.setInterval(check, 800);   // the map's sheets and pins change without a scroll
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); clearInterval(iv); clearTimeout(t); };
  }, []);

  const site = () => {
    const v = url.trim();
    return v && !/^https?:\/\//i.test(v) ? `https://${v}` : v;
  };

  // Entering a website address does not leave the page: the strip turns over and asks where to send the assessment,
  // which is the one other thing the report needs. Someone who has just typed their own address is far likelier to
  // give an email there and then than on a form they have to be sent to first. Leaving the address empty still just
  // opens the booking page, as it always did.
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (step === "site") {
      if (!url.trim()) { router.push(assessHref()); return; }
      setStep("email");
      requestAnimationFrame(() => mail.current?.focus());
      return;
    }
    router.push(assessHref(site(), email.trim()));
  };

  const asking = step === "email";
  return (
    <form className={`as-strip${show ? " on" : ""}${asking ? " is-asking" : ""}`} action="/book" method="get" onSubmit={submit}
      aria-hidden={!show} aria-label="Free website assessment">
      <input type="hidden" name="service" value="Website assessment" />
      {/* the address, kept once the strip has turned over: it is still what is being submitted */}
      {asking && <input type="hidden" name="website" value={site()} />}
      {asking ? (
        <>
          {/* what the strip is asking for now, for anyone who cannot see it change */}
          <p className="as-strip-said" aria-live="polite">Where should we send it?</p>
          <label className="sr-only" htmlFor="as-strip-mail">Your email address</label>
          <input ref={mail} id="as-strip-mail" name="email" className="as-strip-input" type="email" inputMode="email"
            autoComplete="email" required placeholder="you@yourbusiness.ca" value={email} tabIndex={show ? 0 : -1}
            onFocus={() => { typing.current = true; }} onBlur={() => { typing.current = false; }}
            onKeyDown={(e) => { if (e.key === "Escape") { setStep("site"); } }}
            onChange={(e) => setEmail(e.target.value)} />
          <CtaButton type="submit" label="Send my assessment" accent small className="as-strip-go" tabIndex={show ? 0 : -1}>Send it</CtaButton>
        </>
      ) : (
        <>
          <label className="sr-only" htmlFor="as-strip-url">Your website address</label>
          <input id="as-strip-url" name="website" className="as-strip-input" type="text" inputMode="url" autoComplete="url" placeholder="Your website URL"
            value={url} tabIndex={show ? 0 : -1}
            onFocus={() => { typing.current = true; }} onBlur={() => { typing.current = false; }}
            onChange={(e) => setUrl(e.target.value)} />
          <CtaButton type="submit" label="Assess my website" accent small className="as-strip-go" tabIndex={show ? 0 : -1}>Assess my website</CtaButton>
        </>
      )}
    </form>
  );
}
