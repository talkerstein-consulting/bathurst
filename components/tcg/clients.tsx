"use client";

import Image from "next/image";
import { Play, X } from "lucide-react";
import { RailChevrons } from "./rail-chevrons";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { TESTIMONIALS } from "@/lib/bathurst/data";
import { Collectible } from "./collectible";
import { Cta } from "./cta";
/**
 * The clients: their own logo, their own words, their own video.
 *
 * The content is real and already in the repo — TESTIMONIALS in
 * lib/bathurst/data.ts, the seven clients from the "What Our Partners Think"
 * slider on talkerstein.com/our-process, each with the quote they gave, who
 * said it, and the video they sat for. The logos and posters are in
 * public/testimonials; the videos were carried over from the Promax build.
 *
 * On the collectible card (components/tcg/collectible.tsx) without its series
 * line: the client and their role with their logo, in white, at the far right;
 * the poster; the opening of the quote; a foot line. The whole quote and the
 * logo in colour are in the modal.
 *
 * The row scrolls sideways (D06, and D01's one allowed exception) with a pair
 * of chevrons at the right of the heading rather than arrows (D03). A press
 * opens the modal, which is where the video plays: seven autoplaying clips in
 * a row would be seven video decoders on a phone, and none of them asked for.
 */

/**
 * The client logos for the card, white on transparent and trimmed to their
 * ink (public/testimonials/white). They are knockouts made from the colour
 * files, not a CSS filter: a filter turned the two logos that carry their own
 * ground (Maple Electric's badge, Uzbek Delight's blue outline) into solid
 * white shapes. Taglines too small to read at card size (Gemini, JRCC) are cut.
 * The pixel size is each file's own; it sets the ratio the CSS sizes by.
 */
const WHITE: Record<string, [src: string, w: number, h: number]> = {
  fringe: ["/testimonials/white/fringe.svg", 1137, 242],
  mes: ["/testimonials/white/mes.png", 463, 414],
  novarrisk: ["/testimonials/white/novarrisk.svg", 1526, 539],
  gemini: ["/testimonials/white/gemini.png", 844, 231],
  jrcc: ["/testimonials/white/jrcc.png", 263, 361],
  uzbek: ["/testimonials/white/uzbek.png", 147, 100],
  iconrocklear: ["/testimonials/white/iconrocklear.png", 1704, 547],
};

/**
 * One logo, sized by its shape so the seven carry the same weight: a wide
 * wordmark sits lower than a square badge (`--r`, its width over its height,
 * drives the height in app/globals.css).
 */
function WhiteLogo({ id }: { id: string }) {
  const l = WHITE[id];
  if (!l) return null;
  const [src, w, h] = l;
  return (
    <Image
      className="cl-mark"
      src={src}
      alt=""
      width={w}
      height={h}
      style={{ "--r": w / h } as CSSProperties}
    />
  );
}

/** How far one press of a chevron moves the row: one card and its gutter. */
const STEP = 1;

export function Clients() {
  const row = useRef<HTMLUListElement | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  /** Which ends the row has reached, so a chevron that cannot move says so. */
  const [ends, setEnds] = useState({ start: true, end: false });

  const readEnds = useCallback(() => {
    const el = row.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEnds({ start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2 });
  }, []);

  useEffect(() => {
    const el = row.current;
    if (!el) return;
    readEnds();
    el.addEventListener("scroll", readEnds, { passive: true });
    /* The row's own width decides whether there is anywhere to scroll, so a
       resize can change the answer without the row being touched. G13. */
    const ro = new ResizeObserver(readEnds);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", readEnds);
      ro.disconnect();
    };
  }, [readEnds]);

  const nudge = (dir: -1 | 1) => {
    const el = row.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("li");
    /* One card plus the row's gap. Measured rather than assumed, because the
       card width is a clamp and the gap is a token. */
    const by = card
      ? (card.getBoundingClientRect().width +
          parseFloat(getComputedStyle(el).columnGap || "0")) *
        STEP
      : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * by, behavior: "smooth" });
  };

  const shown = TESTIMONIALS.find((t) => t.id === open) ?? null;

  return (
    <section className="sec" id="testimonials" aria-labelledby="testimonials-h">
      <div className="sec-head cl-head">
        <h2 id="testimonials-h">
          Good work speaks for itself.
        </h2>

        {/* D03: chevrons, never arrows. At the right of the heading, which is
            where the row they drive ends. aria-disabled rather than disabled,
            so the press is still detectable at an end (D04). */}
        <RailChevrons place="head" ends={ends} onStep={nudge} prev="Previous clients" next="More clients" />
      </div>

      {/* The collectible card, one per client: name and role with the
          client's logo at the far right, the poster with its play mark, the
          opening of the quote and a foot line. The card is the control; it
          opens the video. */}
      <div className="rail-wrap">
      <ul className="tc-row cl-row" ref={row}>
        {TESTIMONIALS.map((t) => (
          <li key={t.id}>
            <Collectible
              title={t.who}
              sub={t.role}
              label={`Watch ${t.who} — ${t.role}`}
              onPress={() => setOpen(t.id)}
              logo={<WhiteLogo id={t.id} />}
              art={
                <>
                  <Image
                    className="cl-poster"
                    src={t.poster}
                    alt=""
                    width={640}
                    height={360}
                    sizes="(max-width: 560px) 80vw, 320px"
                  />
                  {/* Orange, because the whole card is operable. */}
                  <span className="cl-play">
                    <Play className="glyph" />
                  </span>
                </>
              }
              caption={t.quote}
              foot={
                <>
                  <Play className="glyph" aria-hidden="true" />
                  <span>Video testimonial</span>
                </>
              }
            />
          </li>
        ))}
      </ul>
      </div>

      {shown && (
        <ClientModal
          key={shown.id}
          t={shown}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  );
}

/**
 * The video and the whole quote. The clip is the client's own, and it plays
 * only here — opened deliberately, with controls, never autoplaying behind a
 * card nobody pressed.
 */
function ClientModal({
  t,
  onClose,
}: {
  t: (typeof TESTIMONIALS)[number];
  onClose: () => void;
}) {
  const box = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // The page behind must not scroll under the overlay.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    /* Focus the dialog so the keyboard is inside it, not back up the page.
       preventScroll, because the panel is itself scrollable: focusing it
       scrolled it down by 29px and took the close control half out of view. */
    box.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="cl-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`${t.who} — ${t.role}`}
      /* A press on the ground closes; a press inside must not, so the panel
         stops it rather than the ground testing what was hit. */
      onPointerDown={onClose}
    >
      <div
        className={`cl-panel${t.tall ? " is-tall" : ""}`}
        ref={box}
        tabIndex={-1}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="cl-panel-bar">
          <Image
            className="cl-logo"
            src={t.logo}
            alt={t.role}
            width={200}
            height={80}
          />
          {/* D06: every modal has a visible, working close. */}
          <Cta variant="icon" underline label="Close" onActivate={onClose}>
            <X className="glyph" aria-hidden="true" />
          </Cta>
        </div>

        <video
          className="cl-video"
          src={t.video}
          poster={t.poster}
          controls
          autoPlay
          playsInline
          preload="metadata"
        />

        <figure className="cl-said">
          <blockquote>{t.quote}</blockquote>
          <figcaption>
            <span className="cl-who">{t.who}</span>
            <span className="cl-role">{t.role}</span>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
