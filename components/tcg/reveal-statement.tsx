"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * A pinned statement that fills in as you scroll.
 *
 * The section is taller than the window; the heading is sticky inside it, so it
 * holds still while the page scrolls through the extra height. Over that travel
 * each word goes from faint to full in turn, and once the last word is full the
 * pin releases and the page moves on.
 *
 * Driven by script rather than a CSS scroll timeline, which did not update here.
 * One passive scroll listener, batched to a frame; both are removed on unmount (G13).
 * Reduced motion: no pin, the words are simply at full strength.
 *
 * The h2 is read whole by assistive tech (aria-label); the word spans are visual only.
 */
export function RevealStatement({ text, id }: { text: string; id: string }) {
  const box = useRef<HTMLElement>(null);
  const words = text.split(" ");

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--p", "1");
      el.setAttribute("data-done", "");
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      /* 0 when the section's top reaches the top of the window, 1 when its bottom
         reaches the bottom — the whole time the heading is pinned. */
      const travel = Math.max(1, r.height - window.innerHeight);
      const p = Math.min(1, Math.max(0, -r.top / travel));
      /* The words fill over the first 60% of the pin; the sign stays OPEN for a
         short stretch of scroll after "unchecked" is full, then turns to CLOSED. */
      el.style.setProperty("--p", Math.min(1, p / 0.6).toFixed(3));
      /* The sign turns once the last word is in, and back if the reader scrolls up. */
      el.toggleAttribute("data-done", p >= 0.7);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      ref={box}
      className="chk-pin"
      aria-labelledby={id}
      style={{ "--n": words.length } as CSSProperties}
    >
      <div className="chk-pin-stage">
        <h2 className="chk-reveal" id={id} aria-label={text}>
          {words.map((w, i) => (
            <span key={i} aria-hidden="true" style={{ "--i": i } as CSSProperties}>
              {i === words.length - 1 ? (
                /* The last word and the sign never part across a line break. */
                <span className="chk-tail">{w}<ShopSign /></span>
              ) : (
                <>{w}{" "}</>
              )}
            </span>
          ))}
        </h2>
      </div>
    </section>
  );
}

/**
 * A shop's hanging OPEN sign that turns over to CLOSED. The two faces are linocut
 * prints generated with Higgsfield (public/art/sign/open.webp and closed.webp, the
 * second made from the first so they register). Text height. It swings on its nail
 * while the line fills in and turns to CLOSED when the line is complete. Decorative.
 */
function ShopSign() {
  return (
    <span className="chk-sign" aria-hidden="true">
      <span className="chk-sign-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="chk-sign-face chk-sign-open" src="/art/sign/open.webp" alt="" width={137} height={160} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="chk-sign-face chk-sign-closed" src="/art/sign/closed.webp" alt="" width={137} height={160} />
      </span>
    </span>
  );
}
