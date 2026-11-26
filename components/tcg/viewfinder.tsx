"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { useCallback, useRef, useState, type CSSProperties } from "react";
import { ArcList, type ArcListHandle } from "@/components/arc-list";
import { TESTIMONIALS } from "@/lib/bathurst/data";
import { ClientModal } from "./clients";
import { RailChevrons } from "./rail-chevrons";

/**
 * The clients, as a viewfinder.
 *
 * One client is in frame at a time. The frame is on the left — the client's
 * own footage, held in camera chrome: corner brackets, a focus crosshair, a
 * tape counter, the speaker's name on the bottom strip. The right side is the
 * dial: the seven logos riding an arc, the one in frame at its centre. Turning
 * the dial changes what the finder holds.
 *
 * The dial is @reactbits-starter/arc-list (components/arc-list.tsx), with one
 * addition made there: an item may carry a `logo` node instead of a title, so
 * the arc measures and curves a logo exactly as it does a line of type. Its own
 * image panel is off (`imageSide="none"`) — the finder on the left is ours,
 * because the chrome, the counter, the caption and the play control all have to
 * live inside that frame, and the component's panel is a bare plate.
 *
 * The chrome is drawn, not rendered: brackets, ticks and crosshair are CSS and
 * inline SVG, so they stay hairline-sharp at every size, follow the brand tokens
 * and cost nothing to load. A generated plate (Higgsfield) would have been a
 * fixed-resolution image of a frame we can draw exactly — so nothing was
 * generated for it.
 *
 * Rules kept: orange only on the play control, the one operable mark in the
 * frame (D04 states included); chevrons, never arrows (D03); the dial carries
 * its own keyboard (arrows, Home/End, Enter) from the component; wheel capture
 * is off, so the page still scrolls over it; nothing moves under
 * prefers-reduced-motion (the component reads it).
 */

/** Each logo's own pixel size, which fixes the ratio the dial scales by. */
const LOGO: Record<string, [w: number, h: number]> = {
  fringe: [1137, 242],
  mes: [476, 455],
  novarrisk: [1526, 539],
  gemini: [910, 274],
  jrcc: [486, 486],
  uzbek: [160, 112],
  iconrocklear: [1705, 549],
};

const pad2 = (n: number) => String(n).padStart(2, "0");

export function Viewfinder() {
  const arc = useRef<ArcListHandle | null>(null);
  const [at, setAt] = useState(0);
  const [open, setOpen] = useState<string | null>(null);

  const step = useCallback((dir: -1 | 1) => {
    if (dir === 1) arc.current?.next();
    else arc.current?.previous();
  }, []);

  const items = TESTIMONIALS.map((t) => {
    const [w, h] = LOGO[t.id] ?? [1, 1];
    return {
      title: t.who,
      subtitle: t.role,
      logo: (
        <Image
          className="vf-mark"
          src={t.logo}
          alt={t.role}
          width={w}
          height={h}
          /* The wheel sizes its labels in em, so one ratio per logo is all the
             arc needs to give a wide wordmark and a square badge equal weight. */
          style={{ "--r": w / h } as CSSProperties}
        />
      ),
    };
  });

  const shot = TESTIMONIALS[at] ?? TESTIMONIALS[0];

  return (
    <section className="sec vf" id="testimonials" aria-labelledby="testimonials-h">
      <div className="sec-head cl-head">
        <h2 id="testimonials-h">Good work speaks for itself.</h2>
        {/* The dial loops, so neither end is ever reached. */}
        <RailChevrons
          place="head"
          ends={{ start: false, end: false }}
          onStep={step}
          prev="Previous client"
          next="Next client"
        />
      </div>

      <div className="vf-stage">
        {/* ---- the finder: what is in frame -------------------------------- */}
        <div className="vf-finder">
          <div className="vf-gate">
            {TESTIMONIALS.map((t, i) => (
              <Image
                key={t.id}
                className="vf-shot"
                src={t.poster}
                alt=""
                width={640}
                height={360}
                sizes="(max-width: 900px) 92vw, 620px"
                priority={i === 0}
                data-on={i === at ? "" : undefined}
                aria-hidden={i === at ? undefined : "true"}
              />
            ))}

            {/* Chrome. Decorative throughout, so none of it is orange and none
                of it is announced. */}
            <span className="vf-brackets" aria-hidden="true" />
            <svg className="vf-cross" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M24 10v9M24 29v9M10 24h9M29 24h9" />
              <circle cx="24" cy="24" r="13" />
            </svg>
            <span className="vf-ticks" aria-hidden="true" />

            <div className="vf-hud" aria-hidden="true">
              <span className="vf-rec">
                <i />
                TAPE {pad2(at + 1)}
              </span>
              <span>
                {pad2(at + 1)} / {pad2(TESTIMONIALS.length)}
              </span>
            </div>

            <div className="vf-strip">
              <span className="vf-said">
                <span className="vf-who">{shot.who}</span>
                <span className="vf-role">{shot.role}</span>
              </span>
              {/* The one operable mark in the frame, so the one orange thing. */}
              <button
                type="button"
                className="vf-play"
                aria-label={`Watch ${shot.who} — ${shot.role}`}
                onClick={() => setOpen(shot.id)}
              >
                <Play className="glyph" aria-hidden="true" />
              </button>
            </div>
          </div>

          <figure className="vf-quote">
            <blockquote>{shot.quote}</blockquote>
          </figure>
        </div>

        {/* ---- the dial: the seven logos on an arc ------------------------- */}
        <div className="vf-dial">
          <ArcList
            ref={arc}
            className="vf-arc"
            items={items}
            imageSide="none"
            ariaLabel="Clients"
            curve={0.42}
            spacing={70}
            visible={3}
            fade={0.42}
            shrink={0.14}
            fontSize={34}
            gap={0}
            subtitles={false}
            indicator={false}
            loop
            autoplay
            interval={6}
            /* The page must keep scrolling over the dial, so the wheel is the
               page's. It is turned by drag, chevron, keyboard or the clock. */
            wheel={false}
            onChange={(i) => setAt(i)}
            onSelect={(i) => setOpen(TESTIMONIALS[i]?.id ?? null)}
          />
        </div>
      </div>

      {open && (
        <ClientModal
          key={open}
          t={TESTIMONIALS.find((t) => t.id === open)!}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  );
}
