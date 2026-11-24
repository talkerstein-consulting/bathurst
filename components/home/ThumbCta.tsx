"use client";

import { useEffect, useState } from "react";
import { CtaLink } from "@/components/style/Cta";

/**
 * Phones only (CSS): a "Book a call" pinned at thumb height, bottom centre. It shows only while no other booking or
 * assessment button is on screen, and steps aside while a client's sheet is open or the menu is up.
 */
const OTHERS = 'a[href^="/book"]:not(.thumb-cta), .al-go, .hs-cta, .as-strip.on';   // .as-strip: the pinned assessment strip takes the bottom of the screen

const onScreen = (el: Element) => {
  const r = el.getBoundingClientRect();
  if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return false;
  for (let e: Element | null = el; e; e = e.parentElement) {
    const cs = getComputedStyle(e);
    if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity < .1) return false;
  }
  return true;
};

export default function ThumbCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let t = 0;
    const check = () => {
      t = 0;
      const busy = document.querySelector("#labels .pin.sel, .menubtn[aria-expanded=\"true\"]") || document.documentElement.classList.contains("term-open");
      setShow(!busy && ![...document.querySelectorAll(OTHERS)].some(onScreen));
    };
    const on = () => { if (!t) t = window.setTimeout(check, 150); };
    check();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    const iv = window.setInterval(check, 800);   // the map's sheets and pins change without a scroll
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); clearInterval(iv); clearTimeout(t); };
  }, []);
  return (
    <div className={`thumb-cta-wrap${show ? " on" : ""}`} aria-hidden={!show}>
      <CtaLink href="/book" label="Book a call" accent className="thumb-cta" tabIndex={show ? 0 : -1}>Book a call</CtaLink>
    </div>
  );
}
