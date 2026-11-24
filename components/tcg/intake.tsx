"use client";

import { ArrowUp, Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Cta } from "./cta";
import { Chat } from "./chat";
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
  /** Which hint is showing. It starts at the first one on both the server and
   *  the client — a value randomised during render is baked into the
   *  prerendered HTML, which both freezes it and trips Next's unstable-value
   *  check — and the walk below varies its stride, so the order a visitor sees
   *  differs from visit to visit without any of it happening during render. */
  const [hint, setHint] = useState(0);
  /** The first message, which opens the fullscreen conversation. */
  const [sent, setSent] = useState("");
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState("");

  const field = useRef<HTMLTextAreaElement | null>(null);
  const wrap = useRef<HTMLDivElement | null>(null);
  const rec = useRef<Recognizer | null>(null);
  /** What was already typed when dictation started, so speech appends to it. */
  const base = useRef("");

  const empty = value.trim().length === 0;

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

  /** Never leave the microphone running behind an unmounted field. */
  useEffect(() => () => rec.current?.stop(), []);

  /**
   * Walk the hints while the box is empty and closed, stepping by one or two
   * each time so no two visits run the same order. A hint changing under
   * someone mid-sentence would be its own small cruelty, so the walk stops the
   * moment the box is in use.
   */
  useEffect(() => {
    const walk = setInterval(
      () => setHint((h) => h + 1 + Math.floor(Math.random() * 2)),
      4200,
    );
    return () => clearInterval(walk);
  }, []);

  const placeholder = HINTS[hint % HINTS.length];

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
        <div className="intake-band">
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
            <label className="sr-only" htmlFor="intake-text">
              Tell us what is not working
            </label>
            <textarea
              id="intake-text"
              ref={field}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (note) setNote("");
              }}
              onFocus={() => setOpen(true)}
              placeholder={placeholder}
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
                  reason="Write a line about the problem first."
                  onActivate={() => setSent(value.trim())}
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
