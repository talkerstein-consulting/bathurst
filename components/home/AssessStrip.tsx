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
  const typing = useRef(false);

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

  const submit = (e: FormEvent) => {
    e.preventDefault();
    let site = url.trim();
    if (site && !/^https?:\/\//i.test(site)) site = `https://${site}`;
    router.push(assessHref(site));
  };

  return (
    <form className={`as-strip${show ? " on" : ""}`} action="/book" method="get" onSubmit={submit} aria-hidden={!show} aria-label="Free website assessment">
      <input type="hidden" name="service" value="Website assessment" />
      <label className="sr-only" htmlFor="as-strip-url">Your website address</label>
      <input id="as-strip-url" name="website" className="as-strip-input" type="text" inputMode="url" autoComplete="url" placeholder="Your website URL"
        value={url} tabIndex={show ? 0 : -1}
        onFocus={() => { typing.current = true; }} onBlur={() => { typing.current = false; }}
        onChange={(e) => setUrl(e.target.value)} />
      <CtaButton type="submit" label="Assess my website" accent small className="as-strip-go" tabIndex={show ? 0 : -1}>Assess my website</CtaButton>
    </form>
  );
}
