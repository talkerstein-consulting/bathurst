"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Signature, { type SignatureHandle, type SignatureStroke } from "@/components/signature";
import { CtaLink } from "@/components/style/Cta";
import FLAT from "@/lib/bathurst/signature-strokes.json";

/**
 * "Built for what's next." written by the React Bits Signature pen (components/signature.tsx), which animates a nib along
 * point paths rather than setting type. The paths are the letters themselves: scripts/trace-signature.mjs
 * thins the Slowly Signature letterforms (app/fonts/SlowlySignature.woff2) to their centrelines in lib/bathurst/signature-strokes.json,
 * so the pen writes down the middle of each letter, as a hand would, instead of drawing round its edges. Re-run that script if the words change.
 * It writes itself when it scrolls into view, and again each time it comes back.
 */
const TEXT = "Built for what’s next.";
/** the traced file is flat ([x, y, x, y, …] per stroke) to keep it small; the pen wants points */
const STROKES: SignatureStroke[] = (FLAT as number[][]).map((s) => {
  const out = [];
  for (let i = 0; i < s.length; i += 2) out.push({ x: s[i], y: s[i + 1] });
  return out;
});

export default function SignatureLine({ bare = false }: { bare?: boolean } = {}) {
  const box = useRef<HTMLDivElement>(null);
  const pen = useRef<SignatureHandle>(null);
  const [ink, setInk] = useState<string>();

  // the pen paints on a canvas, which cannot read a CSS variable: hand it the brand's Steel Blue as a value
  useEffect(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--steel").trim();
    if (v) setInk(v);
  }, []);

  // write it when it comes into view (again each time it re-enters)
  useEffect(() => {
    const el = box.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) pen.current?.play(); }, { threshold: 0.2, rootMargin: "0px 0px -8% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const strokes = useMemo(() => STROKES, []);
  const line = (
    <div ref={box} className={`sig-line${bare ? " sig-bare" : ""}`} role="img" aria-label={TEXT}>
      <Signature ref={pen} mode="play" strokes={strokes} inkColor={ink} theme="light"
        pen="fountain" thickness={0.48} speed={5} aspect={5} frame={false} line={false} intro={false}
        style={{ maxWidth: "none", aspectRatio: "9 / 1" }}   /* the written line's own shape: the component caps `aspect` at 5, which would leave half the box empty */ />
    </div>
  );
  if (bare) return line;   // just the written line, for use inside another section
  return (
    <section className="sig" aria-labelledby="sig-h">
      <h2 id="sig-h" className="sr-only">{TEXT}</h2>
      {line}
      <p className="sig-body">Tell us where the business is going. We’ll help you work out what needs to happen next.</p>
      <div className="sig-ctas">
        {/* orange, like the map's Find Your Way Forward CTA (.dc-go) */}
        <CtaLink href="/book" label="Book Free Consult" className="dc-go sig-go">
          <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l9.2 9.2-9.2 9.2L2.8 12z" /><path d="M9 14.5V12a1.5 1.5 0 011.5-1.5H15M13 8.5l2 2-2 2" /></svg>Book Free Consult
        </CtaLink>
        <CtaLink href="https://talkerstein.com/work" label="Explore our work" />
      </div>
    </section>
  );
}
