"use client";

import { ArrowUp, Mic, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Cta } from "./cta";
import { Chat } from "./chat";
import { useBrief } from "./brief";
import { Frame } from "./frame";
import { HeroGround } from "./hero-ground";

/**
 * The prompt hints, shuffled once per visit and cycled through the field while
 * it sits empty. The client's own lines, verbatim.
 */
const HINTS = [
  "Turn my restaurant into a 24/7 ordering machine.",
  "Build an AI receptionist that never misses a customer.",
  "Create a digital twin of my entire business.",
  "Make my warehouse practically manage itself.",
  "Build an app that connects all my business locations.",
  "Turn my traditional store into a global brand.",
];

/* --- the Web Speech API, typed to what we actually touch ------------------ */
type SpeechAlt = { transcript: string };
type SpeechResult = { 0: SpeechAlt; isFinal: boolean };
type SpeechEvent = {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechResult };
};
type Recognizer = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognizer;
  webkitSpeechRecognition?: new () => Recognizer;
};

/**
 * The AI intake: a centred heading, then the box.
 *
 * The box wears a thick filled band in Steel Blue at rest, with a text slot
 * reversed out across the top of it. Pressing it only opens the slot's height —
 * the border is already there. Orange stays on the operable: the send.
 *
 * The mic is live. It runs the browser's own SpeechRecognition straight into
 * the field, so what it hears is what you would have typed. It is not sent
 * anywhere and no audio is stored; the browser asks for the microphone itself.
 * Where the API is missing (Firefox, most of Safari) the press says so rather
 * than failing quietly.
 *
 * SENDING IS NOT WIRED. The backend contract lives in ../../chat-reference
 * (POST /api/chatbot, needs OPENAI_API_KEY and a Node runtime). Submitting here
 * keeps the brief in local state and says so, rather than pretending to send.
 */
export function Intake() {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  /** The first message, which opens the fullscreen conversation. */
  const [sent, setSent] = useState("");
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState("");

  const brief = useBrief();
  const chips = brief?.chips ?? [];

  const field = useRef<HTMLTextAreaElement | null>(null);
  /** The blue band is the drop target: the whole chatbox, not just the slot. */
  const band = useRef<HTMLDivElement | null>(null);
  const wrap = useRef<HTMLDivElement | null>(null);
  const rec = useRef<Recognizer | null>(null);
  /** What was already typed when dictation started, so speech appends to it. */
  const base = useRef("");

  /* A brief can be nothing but cards, so the send is live once either side has
     something. The cards go in front of the typing when it is sent, in the
     order they were dropped. */
  const empty = value.trim().length === 0 && chips.length === 0;
  const briefText = [
    ...chips.map((c) => c.label),
    ...(value.trim() ? [value.trim()] : []),
  ].join("\n");

  /**
   * Fold again on a press outside — but only while the box is still empty. A
   * half-written brief must never collapse under the cursor.
   */
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (wrap.current?.contains(e.target as Node)) return;
      if (value.trim().length === 0) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open, value]);

  /** Tell the provider where the box is, and stop claiming it on unmount. */
  const setDropZone = brief?.setDropZone;
  useEffect(() => {
    if (!setDropZone) return;
    setDropZone(band.current);
    return () => setDropZone(null);
  }, [setDropZone]);

  /** Never leave the microphone running behind an unmounted field. */
  useEffect(() => () => rec.current?.stop(), []);

  /**
   * The typewriter. The native placeholder takes a plain string, so the
   * animation IS that string growing and shrinking; there is no CSS to hand it
   * off to.
   *
   * It writes the attribute on the node instead of holding the characters in
   * state: a character would otherwise be a render, and a render here is the
   * hero canvas and the whole intake along with it, forty-odd times a line.
   * Nothing else on the page reads the placeholder, so the DOM is the honest
   * place to keep it.
   *
   * Each tick schedules only the next one, so the phase lives in the closure
   * and a second timer can never race the first. The step through the hints is
   * one or two, so no two visits run them in the same order; randomising here
   * rather than during render keeps it out of the prerendered HTML, which would
   * otherwise freeze the result and trip Next's unstable-value check.
   *
   * It opens on the hint the server already rendered, by taking that one back
   * out before typing the next, so the first line is not a flash of nothing.
   * G13: the pending timer is cleared on teardown.
   */
  useEffect(() => {
    const el = field.current;
    if (!el) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout>;
    let i = 0;
    let n = HINTS[0].length;
    let erasing = true;
    const step = () => 1 + Math.floor(Math.random() * 2);

    const tick = () => {
      const full = HINTS[i % HINTS.length];

      /* D11: with reduced motion the hints still change — they just arrive
         whole, on a plain interval, rather than being typed. */
      if (mq.matches) {
        el.placeholder = full;
        i += step();
        timer = setTimeout(tick, 4200);
        return;
      }

      if (!erasing) {
        if (n < full.length) {
          n += 1;
          el.placeholder = full.slice(0, n);
          timer = setTimeout(tick, 45);
        } else {
          erasing = true;
          timer = setTimeout(tick, 2400);
        }
        return;
      }

      if (n > 0) {
        n -= 1;
        el.placeholder = full.slice(0, n);
        timer = setTimeout(tick, 18);
      } else {
        erasing = false;
        i += step();
        timer = setTimeout(tick, 300);
      }
    };

    tick();
    return () => clearTimeout(timer);
  }, []);

  const dictate = () => {
    if (rec.current) {
      rec.current.stop();
      return;
    }
    const w = window as SpeechWindow;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      setNote("This browser has no dictation. Chrome and Edge have it.");
      return;
    }

    const r = new SR();
    r.lang = "en-CA";
    r.interimResults = true;
    r.continuous = true;
    base.current = value;

    r.onresult = (e) => {
      let heard = "";
      for (let i = 0; i < e.results.length; i++) heard += e.results[i][0].transcript;
      const lead = base.current.trim();
      setValue(lead ? `${lead} ${heard}` : heard);
    };
    r.onerror = (e) => {
      setNote(
        e.error === "not-allowed"
          ? "The microphone is blocked for this site."
          : "Dictation stopped. Try again, or type it.",
      );
    };
    r.onend = () => {
      rec.current = null;
      setListening(false);
    };

    rec.current = r;
    setNote("");
    setListening(true);
    setOpen(true);
    r.start();
    field.current?.focus();
  };

  /* The status line reports dictation only. Sending opens the conversation,
     which says for itself that nothing has gone anywhere. */
  const status = listening
    ? "Listening. Press the mic again to stop."
    : note;

  return (
    <>
      {sent && <Chat first={sent} onClose={() => setSent("")} />}
      <section className="intake" id="intake">
      <HeroGround />


      <div className="intake-head">
        <h1>What&rsquo;s your big idea?</h1>
        <p>
          Share your vision. Let our AI find the possibilities and map your next
          move.
        </p>
      </div>

      <div className="intake-wrap" ref={wrap}>
        <div
          className="intake-band"
          ref={band}
          /* D07: the box says it will take what is being dragged, while it is
             being dragged — not only once it has landed. */
          data-over={brief?.over ? "true" : "false"}
          data-drag={brief?.dragging ? "true" : "false"}
        >
          {/* The band's text slot. Set at p1, reversed out of the Steel Blue. */}
          <p className="intake-slot">
            Tell us what you need.
          </p>

          <Frame
            accent
            className={`intake-field${open ? " is-open" : ""}`}
            onPointerDown={() => {
              setOpen(true);
              field.current?.focus();
            }}
          >
            {/* The "drop here" state: shown for as long as a card is being
                dragged, so the box says where the card goes before it lands. */}
            <div className="intake-drop" aria-hidden="true">
              <span>{brief?.over ? "Let go to add it" : "Drop the card here"}</span>
            </div>
            <label className="sr-only" htmlFor="intake-text">
              Tell us what is not working
            </label>
            {chips.length > 0 && (
              <ul className="intake-chips">
                {chips.map((c) => (
                  <li key={c.id}>
                    <span className="brief-chip">
                      {c.label}
                      <button
                        type="button"
                        className="brief-chip-x"
                        onClick={() => brief?.remove(c.id)}
                      >
                        <span className="sr-only">Remove {c.label}</span>
                        <X className="glyph" aria-hidden="true" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <textarea
              id="intake-text"
              ref={field}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (note) setNote("");
              }}
              onFocus={() => setOpen(true)}
              /* The effect above takes over from here; this is what the
                 prerendered HTML and a no-JS visitor get. */
              placeholder={HINTS[0]}
              rows={1}
            />

            <div className="intake-foot">
              <small aria-live="polite">{status}</small>

              <div className="intake-tools">
                <Cta
                  variant="icon"
                  label={listening ? "Stop dictating" : "Dictate instead"}
                  className={listening ? "is-live" : ""}
                  onActivate={dictate}
                >
                  <Mic className="glyph" aria-hidden="true" />
                </Cta>
                <Cta
                  variant="icon"
                  label="Send"
                  primary
                  disabled={empty}
                  reason="Write a line, or drag a card in, first."
                  onActivate={() => setSent(briefText)}
                >
                  <ArrowUp className="glyph" aria-hidden="true" />
                </Cta>
              </div>
            </div>
          </Frame>
        </div>
      </div>
      </section>
    </>
  );
}
