"use client";

import dynamic from "next/dynamic";
import {
  ArrowUp,
  CalendarCheck,
  ChevronDown,
  Forward,
  Reply,
  Check,
  CreditCard,
  ChartColumn,
  Clock,
  ChevronRight,
  Database,
  LayoutGrid,
  Mail,
  MessageSquare,
  Send,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ComponentType } from "react";
import "@/app/figures.css";

/**
 * Only the props these figures set.
 *
 * The same typed boundary ./hero-ground.tsx puts on Dither, and for the same
 * reason: Dither ships as plain JS, so TypeScript infers its props from the
 * defaults, which leaves the three undefaulted ones (palette, dpr, style)
 * looking required. One declaration is cheaper than passing two meaningless
 * values to every ground, or editing an installed component.
 */
type DitherProps = {
  className?: string;
  palette?: string[];
  ditherMode?: string;
  pixelSize?: number;
  scale?: number;
  waveSpeed?: number;
  waveFrequency?: number;
  waveAmplitude?: number;
  contrast?: number;
  brightness?: number;
  disableAnimation?: boolean;
  intro?: boolean;
  enableMouseInteraction?: boolean;
  clickRipple?: boolean;
};

/**
 * Loaded on the client only, exactly as the hero loads it. Dither is WebGL: it
 * has no server rendering to do, and imported straight it resolves to nothing
 * during prerender and takes the whole page down with it.
 *
 * D07: the fallback is the plate the slot already sits on, at the slot's own
 * size, rather than a gap that collapses when the canvas arrives.
 */
const Dither = dynamic(
  () =>
    import("@/components/Dither") as Promise<{
      default: ComponentType<DitherProps>;
    }>,
  {
    ssr: false,
    loading: () => <div className="scene-ground" aria-hidden="true" />,
  },
);

/**
 * The art for the four feature cards (./features.tsx).
 *
 * THE SHAPE, after Calendly: a coloured ground filling the slot, and one small
 * piece of interface floating on it. The interface is the point and the ground
 * is weather behind it — so each snippet is cut to about four elements and the
 * card's own headline does the explaining. Anything that needed a sentence
 * inside the picture belonged in the dek.
 *
 * THE GROUND is the React Bits Dither (components/Dither.jsx, installed from
 * @react-bits/Dither-JS-CSS), run STATIC: no wave, no intro, no pointer, no
 * ripple. It renders once and stops, so four of these cost four draws, not
 * four animation loops.
 *
 * THE PALETTE is passed as explicit steps rather than left to quantise toward
 * a wave colour, which is what put a green cast in the hero: Sea Breeze's
 * green channel is its highest, so the middle steps landed on the green side
 * of neutral. Every step below is on the BLUE side by construction — blue
 * channel highest, then green, then red, at all six — and the ends are the
 * brand's own paper and Steel Blue. Faded flag blue, washed denim, bayer
 * screen: retro americana without leaving the ink.
 *
 * ONLY THE INTERFACE MOVES, and only a little: one short loop per card, each
 * showing the one thing that card is about happening. It stops dead under
 * prefers-reduced-motion (app/figures.css), where every snippet rests in its
 * finished state rather than its empty one.
 *
 * No orange anywhere in here. Orange marks operable elements, and nothing in a
 * drawing is operable — the real orange on this card is the plus button that
 * adds it to the brief (./card.tsx).
 */

/**
 * Six steps, blue side of neutral at every one (B > G > R all the way down).
 *
 * It starts at a mid blue rather than at paper: a ramp that reached near-white
 * left the white snippet with nothing to sit against wherever the ground went
 * light, and the card stopped floating and started looking like a hole. The
 * field is always darker than the thing on it now.
 */
const PALETTE = [
  "#C7D4E2",
  "#9DB2C9",
  "#7190B0",
  "#4C6C94",
  "#2F4A72",
  "#19254A",
];

/**
 * The ground.
 *
 * FOUR DIFFERENT FIELDS, ONE SET OF SETTINGS. The settings and the palette
 * below are identical on all four cards — same pixelSize, same scale, same
 * frequency and amplitude, same six steps — and the cards differ because each
 * one is a different CROP of that one field. The canvas is rendered half as
 * large again as the slot and slid to a different corner of it per card, so
 * the grain, the contrast and the inks are the same stock on every card and
 * only the weather in view changes.
 *
 * It is the only lever that varies the picture without varying the settings.
 * The field is a pure function of position: with `disableAnimation` the
 * shader's clock is frozen at zero (components/Dither.jsx:496), so two cards
 * given the same numbers render the same pixels. `scale` used to be nudged by
 * 0.06 a card to get around that, which did change the picture — but scale is
 * one of the settings, and a card at 1.18 was being drawn at a measurably
 * coarser grain than a card at 1.00. Now scale is 1 everywhere and the crop
 * does the work.
 */
const CROPS: Array<[string, string]> = [
  ["-4%", "-6%"],
  ["-38%", "-12%"],
  ["-10%", "-40%"],
  ["-42%", "-36%"],
  ["-24%", "-24%"],
];

function Ground({ seed = 0 }: { seed?: number }) {
  const [gx, gy] = CROPS[seed % CROPS.length];
  return (
    <div
      className="scene-crop"
      style={{ "--gx": gx, "--gy": gy } as React.CSSProperties}
      aria-hidden="true"
    >
      <Dither
        className="scene-ground"
        palette={PALETTE}
        ditherMode="bayer"
        /* The hero's own grain, to the value (./hero-ground.tsx): pixelSize 1,
           scale 1, frequency 0.7, amplitude 0.6, contrast and brightness flat.
           Identical on all four cards — see the note above. */
        pixelSize={1}
        scale={1}
        waveFrequency={0.7}
        waveAmplitude={0.6}
        contrast={1}
        brightness={0}
        disableAnimation
        intro={false}
        enableMouseInteraction={false}
        clickRipple={false}
      />
    </div>
  );
}

function Scene({
  seed,
  kind,
  children,
}: {
  seed: number;
  kind: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Ground seed={seed} />
      <div
        className={`scene-card scene-${kind}`}
        style={{ "--phase": `-${seed * 1.5}s` } as React.CSSProperties}
      >
        {children}
      </div>
    </>
  );
}

/**
 * Hover playback for the two flow figures. At rest each one stands on a still
 * COVER frame, so the row is not four things moving at once; it plays only
 * while the pointer is on its card (or the card has keyboard focus), and goes
 * back to the cover when it leaves. Reduced motion never plays. G13: returns
 * the cleanup that removes every listener.
 */
function hoverPlay(el: HTMLElement, play: () => void, rest: () => void) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const card = (el.closest(".card") as HTMLElement | null) ?? el;
  const leave = (e: FocusEvent) => {
    if (!card.contains(e.relatedTarget as Node)) rest();
  };
  card.addEventListener("pointerenter", play);
  card.addEventListener("pointerleave", rest);
  card.addEventListener("focusin", play);
  card.addEventListener("focusout", leave);
  return () => {
    card.removeEventListener("pointerenter", play);
    card.removeEventListener("pointerleave", rest);
    card.removeEventListener("focusin", play);
    card.removeEventListener("focusout", leave);
  };
}

/* ---------- 0 · chief of staff: the agent writes to you ------------------ */

/**
 * The client's integrations diagram (theirs was "Callie"), rebranded as the AI
 * Chief of Staff: three of your apps sit below, lines run from each up to one
 * message, and signals travel from the apps INTO it — the same direction as
 * the portal card — while the tiles float. The message is theirs, shortened
 * at the client's request;
 * the sender is the agent, under the TCG mark.
 *
 * Their Outlook tile is Notion here: simple-icons (what every logo on this
 * page comes from) no longer carries Outlook, and a hand-drawn imitation of
 * someone's logo is worse than a real one in its place. Their geometry is kept
 * in their own units (one unit = 1em, figures.css), so lines meet tiles where
 * theirs did.
 *
 * Like the rest: at rest it stands still with no signals; it plays on hover.
 */
const CHIEF_APPS: Array<[string, string, string]> = [
  ["gmail", "Gmail", "cs-a"],
  ["googlecalendar", "Google Calendar", "cs-b"],
  ["notion", "Notion", "cs-c"],
];

export const FigChief = () => (
  <>
    <Ground seed={4} />
    <div className="cs" aria-hidden="true">
      <svg className="cs-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline points="23.9,66.3 23.9,64.5 27.6,60.8 48.3,54.8" />
        <polyline points="50,69.6 50,54.8" />
        <polyline points="75.4,65.9 75.4,64.5 71.7,60.8 51.7,54.8" />
      </svg>
      <i className="cs-sig cs-a" />
      <i className="cs-sig cs-b" />
      <i className="cs-sig cs-c" />

      {CHIEF_APPS.map(([file, name, k]) => (
        <span key={file} className={`cs-tile ${k}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/portal/${file}.svg`} alt={name} />
        </span>
      ))}

      <article className="cs-mail">
        <header className="cs-from">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/tcg-favicon.svg" alt="" />
          <span>
            <b>Chief of Staff</b>
            <small>
              To me <ChevronDown aria-hidden="true" />
            </small>
          </span>
        </header>
        <p className="cs-msg">
          Two meetings overlap next week. Want me to fix it?
        </p>
        <div className="cs-acts">
          <span><Reply aria-hidden="true" /> Reply</span>
          <span><Forward aria-hidden="true" /> Forward</span>
        </div>
      </article>
    </div>
  </>
);

/* ---------- 1 · quoting: quote, book, pay -------------------------------- */

/**
 * The client's own Smart Quote diagram, rebranded: a quote that grows a line
 * and is accepted, a time that is picked and booked, and a payment that goes
 * through to a receipt. Three panels on one track, slid out to the edge of
 * the dither slot and in from the other. (The original's Quote / Book / Pay
 * pills are gone, at the client's instruction; the confirmations are green.)
 *
 * THE FLOW IS THE CLIENT'S, to the millisecond: the same eleven beats at the
 * same offsets, looping every 18s. Their backdrop — a grey gradient with
 * flowing bars — is replaced by this card's dither ground, their Inter by the
 * brand faces, their greys by Steel Blue, and their bitmap icons by Lucide.
 *
 * NOT INTERACTIVE, unlike the original. Inside a feature card the whole face
 * is the drag handle (./card.tsx), so buttons in the picture could never take
 * a press; they are drawn, not wired. And no orange: nothing here is operable.
 *
 * At rest it stands on a cover — the quote, accepted — and plays only on
 * hover (hoverPlay, above). G13: every pending timer is released on teardown.
 */
type QStage = "quote" | "book" | "pay" | "paid";

const Q_BEATS: Array<[number, QStage, number]> = [
  [0, "quote", 0],
  [1600, "quote", 1],
  [3500, "quote", 2],
  [5500, "book", 0],
  [6600, "book", 1],
  [7300, "book", 2],
  [8700, "book", 3],
  [10500, "pay", 0],
  [12000, "pay", 1],
  [12600, "pay", 2],
  [13200, "paid", 0],
];
const Q_LOOP = 18000;

const Q_DAYS: Array<[string, string]> = [
  ["Mon", "20"],
  ["Tue", "21"],
  ["Wed", "22"],
  ["Thu", "23"],
  ["Fri", "24"],
];

export function FigQuote() {
  const root = useRef<HTMLDivElement | null>(null);
  /** The cover: the quote, complete and accepted. */
  const [[stage, detail], setBeat] = useState<[QStage, number]>(["quote", 2]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const stop = () => {
      timers.forEach(clearTimeout);
      timers = [];
    };
    const play = () => {
      stop();
      timers = Q_BEATS.map(([at, st, d]) => setTimeout(() => setBeat([st, d]), at));
      timers.push(setTimeout(play, Q_LOOP));
    };
    const off = hoverPlay(el, play, () => {
      stop();
      setBeat(["quote", 2]);
    });
    return () => {
      off();
      stop();
    };
  }, []);

  const at = stage === "paid" ? "pay" : stage;

  return (
    <>
      <Ground seed={0} />
      <div className="sq" ref={root} data-stage={stage} aria-hidden="true">
        <div className="sq-track">
            {/* quote */}
            <section className="sq-panel">
              <p className="sq-h">Quote</p>
              <div className="sq-table">
                <p><span>Package</span><span>$1,450</span></p>
                <p><span>Retainer</span><span>$250</span></p>
                <p className={`sq-new${detail > 0 || stage !== "quote" ? " on" : ""}`}>
                  <span>Revisions</span><span>$405</span>
                </p>
              </div>
              <p className="sq-total">
                <span>Total</span>
                <b>{detail > 0 || stage !== "quote" ? "$2,105" : "$1,700"}</b>
              </p>
              <p className={`sq-btn${detail > 1 || stage !== "quote" ? " done" : ""}`}>
                {detail > 1 || stage !== "quote" ? (
                  <><Check aria-hidden="true" /> Accepted</>
                ) : (
                  <><Send aria-hidden="true" /> Send quote</>
                )}
              </p>
            </section>

            {/* book */}
            <section className="sq-panel">
              <p className="sq-h">
                Book a time <small><Clock aria-hidden="true" /> 30 min</small>
              </p>
              <p className="sq-month">July 2026</p>
              <div className="sq-days">
                {Q_DAYS.map(([d, n], i) => (
                  <p key={n} className={i === 1 && (stage !== "book" || detail > 0) && stage !== "quote" ? "on" : ""}>
                    <small>{d}</small>
                    <b>{n}</b>
                  </p>
                ))}
              </div>
              <div className="sq-times">
                {["9 AM", "10 AM", "11 AM"].map((t, i) => (
                  <p key={t} className={i === 1 && (stage !== "book" || detail > 1) && stage !== "quote" ? "on" : ""}>
                    {t}
                  </p>
                ))}
              </div>
              <p className={`sq-btn${(stage === "book" && detail > 2) || at === "pay" ? " done" : ""}`}>
                {(stage === "book" && detail > 2) || at === "pay" ? (
                  <><Check aria-hidden="true" /> Booked</>
                ) : (
                  "Confirm"
                )}
              </p>
            </section>

            {/* pay, then the receipt */}
            <section className="sq-panel">
              {stage === "paid" ? (
                <div className="sq-receipt">
                  <span className="sq-badge"><Check aria-hidden="true" /></span>
                  <p className="sq-h">Paid</p>
                  <b>$2,105.00</b>
                  <p className="sq-when">
                    <CalendarCheck aria-hidden="true" /> Tue, 21 Jul · 10 AM
                  </p>
                </div>
              ) : (
                <>
                  <p className="sq-h">Payment</p>
                  <p className="sq-due">
                    <span>Total</span>
                    <b>$2,105.00</b>
                  </p>
                  <p className="sq-cardno">
                    <CreditCard aria-hidden="true" />
                    <span>•••• 4242</span>
                  </p>
                  <p className="sq-btn">
                    {stage === "pay" && detail > 0 ? "Processing…" : "Pay now"}
                  </p>
                </>
              )}
            </section>
        </div>
      </div>
    </>
  );
}

/* ---------- 2 · journeys: automated reminders ---------------------------- */

/**
 * The client's Automated Reminders diagram, rebranded the way card 1 was: the
 * email reminder and then the text reminder, each a white panel on the dither,
 * sliding out past the slot's edge and in from the other (.sq-track).
 *
 * THE FLOW IS THE CLIENT'S: on each panel the timing step lights up, settles
 * to done, and the "send" step flips to its confirmation with the badge
 * popping on the icon — their 2s curve, run once per panel and held, rather
 * than looped in place. Their "Workflow" label is dropped, like card 1's pills,
 * and the confirmation is green, like card 1's.
 *
 * The loop is seamless: a copy of the email panel waits after the text one, so
 * the track always slides the same way, then snaps back to the real first
 * panel with the transition off. At rest it stands on a cover — the email
 * panel, finished — and plays only on hover (hoverPlay). G13: timers are
 * released on teardown.
 */
const REMINDERS: Array<[LucideIcon, string, string, string, string]> = [
  [Mail, "Send email reminder", "24 hours before", "Send email to invitees", "Email reminder sent"],
  [MessageSquare, "Send text reminder", "1 hour before", "Send text to invitees", "Text reminder sent"],
];
/** One panel's turn: the slide in (0.7s), the 2s curve, and a beat to read it. */
const R_TURN = 3700;
const R_SLIDE = 700;

export function FigJourney() {
  const root = useRef<HTMLDivElement | null>(null);
  const [at, setAt] = useState(0);
  const [snap, setSnap] = useState(true);
  const [loop, setLoop] = useState(0);
  /** At rest: the cover, the email panel finished. */
  const [still, setStill] = useState(true);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const stop = () => {
      timers.forEach(clearTimeout);
      timers = [];
    };
    const play = () => {
      stop();
      setStill(false);
      setSnap(true);
      setAt(0);
      setLoop((n) => n + 1);
      timers.push(setTimeout(() => setSnap(false), 50));
      timers.push(setTimeout(() => setAt(1), R_TURN));
      timers.push(setTimeout(() => setAt(2), 2 * R_TURN));
      timers.push(setTimeout(play, 2 * R_TURN + R_SLIDE));
    };
    const off = hoverPlay(el, play, () => {
      stop();
      setSnap(true);
      setAt(0);
      setStill(true);
    });
    return () => {
      off();
      stop();
    };
  }, []);

  const panels = [...REMINDERS, REMINDERS[0]];

  return (
    <>
      <Ground seed={1} />
      <div className="sq sr" ref={root} aria-hidden="true">
        <div
          className="sq-track"
          style={{ "--i": at, transition: snap ? "none" : undefined } as React.CSSProperties}
        >
          {panels.map(([Glyph, title, when, act, done], n) => (
            <section
              key={`${n}-${loop}`}
              className={`sq-panel sr-panel${
                still && n === 0 ? " done" : !still && n === at && n < 2 ? " run" : ""
              }`}
            >
              <span className="sr-ico">
                <Glyph aria-hidden="true" />
                <i className="sr-badge">1</i>
              </span>
              <p className="sq-h sr-h">{title}</p>
              <div className="sr-step">
                <p className="sr-when">{when}</p>
                <p className="sr-when sr-on">{when}</p>
                <p className="sr-when sr-past">{when}</p>
              </div>
              <i className="sr-link" />
              <div className="sr-step sr-step--act">
                <p className="sr-act">{act}</p>
                <p className="sr-act sr-sent">
                  <Check aria-hidden="true" /> {done}
                </p>
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}

/* ---------- 3 · portals: every app, through one portal -------------------- */

/**
 * The client's Business Portal diagram, rebranded: six familiar apps arrive
 * around the TCG mark, a line draws from the mark to each, and signals run
 * down the lines in three waves while the mark pulses. Their 15s timeline and
 * their geometry, to the pixel — the canvas is their 580-unit square, set in
 * em off the slot's height (figures.css) so it scales without a transform.
 *
 * THE LOGOS are simple-icons (installed), in each brand's own colour, written
 * to public/portal. Chosen to be familiar AND to keep orange off the drawing:
 * HubSpot and Claude would have been the obvious CRM and AI marks, and both
 * are orange, which this page reserves for what can be pressed. The original's
 * tiles were buttons; here they are drawn, because the card face is the drag.
 *
 * Like cards 1 and 2: at rest it stands on its finished frame (every app in,
 * every line drawn, no signal), and plays only on hover. The reveal is quicker
 * than the client's (about a second, not three), a far ring of eight more apps
 * sits outside the six, and the signals run the other way: from each app INTO
 * the TCG mark, which pulses as they land.
 */
const APPS: Array<[string, string, number, number, number, number, number, number, number]> = [
  // file, name, tile left, top, line length, angle, arrive-from x, y, delay
  ["gmail", "Gmail", 147, 45, 220.045, -115.86, 96, 198, 0],
  ["googledrive", "Google Drive", 335, 57, 207.509, -63.68, -92, 186, 0.08],
  ["anthropic", "Anthropic", 441, 237, 198.091, -1.74, -198, 6, 0.16],
  ["quickbooks", "QuickBooks", 319, 437, 208.355, 68.61, -76, -194, 0.24],
  ["googlemeet", "Google Meet", 89, 393, 214.979, 135.75, 154, -150, 0.32],
  ["googlecalendar", "Google Calendar", 29, 209, 216.684, -171, 214, 34, 0.4],
];

/**
 * The outer ring: thirteen more apps, socials among them, further out and
 * smaller, spaced evenly round the ring (the angles in the list are unused). They run off the slot's edge
 * on purpose — the point is that there are more of them than fit.
 * [file, name, angle in degrees]
 */
const APPS_FAR: Array<[string, string, number]> = [
  ["stripe", "Stripe", -145],
  ["instagram", "Instagram", -118],
  ["notion", "Notion", -90],
  ["facebook", "Facebook", -62],
  ["shopify", "Shopify", -35],
  ["dropbox", "Dropbox", 28],
  ["youtube", "YouTube", 64],
  ["googlesheets", "Google Sheets", 100],
  ["tiktok", "TikTok", 130],
  ["whatsapp", "WhatsApp", 160],
  ["xero", "Xero", 205],
  ["x", "X", 225],
  ["calendly", "Calendly", 245],
];
const FAR_R = 360;
const FAR_SIZE = 74;

type PortalNode = { file: string; name: string; x: number; y: number; size: number; len: number; ang: number; fx: number; fy: number; d: number; far: boolean };

/** Every node in one shape, inner then outer, each with its reveal delay. */
const NODES: PortalNode[] = [
  ...APPS.map(([file, name, x, y, len, ang, fx, fy, d]) => ({
    file, name, x, y, size: 94, len, ang,
    /* the client's arrival offsets, halved, so the move is quicker to read */
    fx: fx / 2, fy: fy / 2, d: d / 2, far: false,
  })),
  ...APPS_FAR.map(([file, name], i) => {
    /* evenly round the ring, so thirteen never bunch up */
    const deg = -150 + (i * 360) / APPS_FAR.length;
    const r = (deg * Math.PI) / 180;
    const cx = 290 + FAR_R * Math.cos(r);
    const cy = 290 + FAR_R * Math.sin(r);
    return {
      file, name,
      x: cx - FAR_SIZE / 2, y: cy - FAR_SIZE / 2, size: FAR_SIZE,
      len: FAR_R, ang: deg,
      fx: -Math.cos(r) * 90, fy: -Math.sin(r) * 90,
      d: 0.12 + i * 0.03, far: true,
    };
  }),
];

export const FigPortal = () => (
  <>
    <Ground seed={2} />
    <div className="sp" aria-hidden="true">
      {NODES.map((n, i) => (
        <span
          key={`l-${n.file}`}
          className={`sp-link${n.far ? " far" : ""}`}
          style={{
            "--len": n.len, "--ang": `${n.ang}deg`, "--d": `${n.d}s`,
            /* signals leave the apps staggered, so they reach the hub in turn */
            "--s": `${0.9 + ((i * 0.37) % 2.4)}s`,
          } as React.CSSProperties}
        >
          <i className="sp-line" />
          <i className="sp-signal" />
        </span>
      ))}
      {NODES.map((n) => (
        <span
          key={n.file}
          className={`sp-tile${n.far ? " far" : ""}`}
          style={{
            "--x": n.x, "--y": n.y, "--size": n.size,
            "--fx": n.fx, "--fy": n.fy, "--d": `${n.d}s`,
          } as React.CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/portal/${n.file}.svg`} alt={n.name} />
        </span>
      ))}
      <span className="sp-hub">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/tcg-icon.svg" alt="TCG" />
      </span>
    </div>
  </>
);

/* ---------- 4 · intelligence: meeting recall ----------------------------- */

/**
 * The client's Meeting Recall diagram, rebranded: a question is typed into the
 * assistant's bar, the bar drops to the bottom, and the answer opens above it —
 * the header, the answer a word at a time, three lines still being written,
 * and two follow-ups to ask next. Their 10.5s timeline, their percentages and
 * their words, verbatim.
 *
 * Their gradient and rhythm bars give way to the dither, Inter to the brand
 * faces, the grey follow-up buttons to Steel Blue, their bitmap icons to
 * Lucide, and their assistant sparkle to the TCG mark. The answer now rises
 * OUT OF the bar, which holds still at the bottom. The send is drawn, not orange: nothing in a figure is pressable.
 *
 * Like the other three: at rest it stands on its finished frame (answer open,
 * every word in) and the timeline runs only on hover.
 */
const ASK = "What concerns did Emily have?";
const ANSWER = [
  "Emily\u2019s", "concerned", "that", "the", "pricing", "of", "Quotient\u2019s",
  "software", "might", "be", "too", "high.", "She", "emphasized",
];

export const FigIntelligence = () => (
  <>
    <Ground seed={3} />
    <div className="sm" aria-hidden="true">
      <section className="sm-answer">
        <header className="sm-head">
          <p className="sq-h">Meeting assistant</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="sm-mark" src="/brand/tcg-favicon.svg" alt="" />
        </header>
        <p className="sm-copy">
          {ANSWER.map((w, i) => (
            <span key={i} style={{ "--w": i } as React.CSSProperties}>
              {w}{" "}
            </span>
          ))}
        </p>
        <div className="sm-more">
          <i />
          <i />
          <i />
        </div>
        <div className="sm-next">
          <p>Ask a follow-up question:</p>
          <span>What&rsquo;s Acme Co.&rsquo;s budget?</span>
          <span>Who are the main stakeholders for this?</span>
        </div>
      </section>

      <div className="sm-bar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="sm-mark" src="/brand/tcg-favicon.svg" alt="" />
        <span className="sm-typed">{ASK}</span>
        <i className="sm-caret" />
        <span className="sm-send">
          <ArrowUp aria-hidden="true" />
        </span>
      </div>
    </div>
  </>
);

const FEATURE_FIGURES = [FigChief, FigQuote, FigJourney, FigPortal, FigIntelligence];

/**
 * The row's art, by position.
 *
 * This is a component rather than the exported array it used to be, because
 * this file is now "use client" (Dither needs the browser) and ./features.tsx
 * is a server component. Across that boundary every export of a client module
 * is replaced by a client REFERENCE, so the array arrived as an opaque proxy
 * and `FEATURE_FIGURES[i]` read as undefined — the row rendered nothing and
 * the page 500'd. Indexing has to happen on this side of the line.
 */
export function FeatureFigure({ at }: { at: number }) {
  const Fig = FEATURE_FIGURES[at];
  return Fig ? <Fig /> : null;
}
