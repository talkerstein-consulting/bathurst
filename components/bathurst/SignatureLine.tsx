"use client";

import { useEffect, useRef } from "react";
import { CtaLink } from "@/components/style/Cta";
import SIG from "@/lib/bathurst/signature-path.json";

/**
 * "Built for what's next." — the words set in the brand's own hand (app/fonts/SlowlySignature.woff2) as a single
 * filled outline, written on left to right when it scrolls into view.
 *
 * It used to be drawn rather than set: the letterforms were thinned to a one-pixel skeleton and a simulated
 * fountain nib redrew them along it. That made the weight of every stroke a guess, and the guess had no good
 * answer — light enough to look clean and the letters came apart, heavy enough to hold together and they smudged.
 * The font already has the letterforms, at the weight they were drawn at, so this takes them as they are:
 * scripts/signature-path.mjs writes the outline to lib/bathurst/signature-path.json and the path below is it,
 * exactly. (That approach, and the canvas pen it needed, are gone.)
 *
 * The writing is a reveal, not a redraw — the ink is uncovered from left to right, so the shapes are never
 * approximated and never move. Under `prefers-reduced-motion` it is simply there.
 */
const TEXT = SIG.text;

export default function SignatureLine({ bare = false }: { bare?: boolean } = {}) {
  const box = useRef<HTMLDivElement>(null);

  // write it when it comes into view, and again each time it comes back
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      el.classList.toggle("is-writing", e.isIntersecting);
    }, { threshold: 0.25, rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const line = (
    <div ref={box} className={`sig-line${bare ? " sig-bare" : ""}`} role="img" aria-label={TEXT}>
      <svg viewBox={`0 0 ${SIG.w} ${SIG.h}`} aria-hidden="true" focusable="false">
        <path className="sig-ink" d={SIG.d} />
      </svg>
    </div>
  );
  if (bare) return line;   // just the written line, for use inside another section
  return (
    <section className="sig" aria-labelledby="sig-h">
      <h2 id="sig-h" className="sr-only">{TEXT}</h2>
      {line}
      <p className="sig-body">Tell us where the business is going. We’ll help you work out what needs to happen next.</p>
      <div className="sig-ctas">
        <CtaLink href="/book" label="Book Free Consult" className="dc-go sig-go">
          <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l9.2 9.2-9.2 9.2L2.8 12z" /><path d="M9 14.5V12a1.5 1.5 0 011.5-1.5H15M13 8.5l2 2-2 2" /></svg>Book Free Consult
        </CtaLink>
        <CtaLink href="https://talkerstein.com/work" label="Explore our work" />
      </div>
    </section>
  );
}
