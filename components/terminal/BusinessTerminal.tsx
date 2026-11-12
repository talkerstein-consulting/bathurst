"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { CSSProperties, FormEvent, KeyboardEvent, ReactNode } from "react";
import RiseHeading from "@/components/style/RiseHeading";
import { CtaButton } from "@/components/style/Cta";
import { ask, DEMO, TerminalError } from "@/lib/terminal/client";
import {
  DEFAULT_JURISDICTION, MAX_QUESTION, jurisdictionLabel,
  type ChatTurn, type JurisdictionCode, type Source, type TerminalErrorCode,
} from "@/lib/terminal/contract";
import "@/app/terminal.css";

/**
 * 01 · Canadian Business Terminal (after america.gov's front door): a greeting, one question box with example questions
 * inside it (and rotating in its placeholder), and a trust line. It lives in the hero (BathurstHero's `lead`), in the
 * headline's place over the playing horizon, under the site navbar. On the first scroll it slides up and the headline rises
 * in (#stick.lead); while the box is focused or a conversation is open, the page holds still.
 * There is no location picker: every question goes out as Ontario + federal law (DEFAULT_JURISDICTION). The first question turns the panel into a conversation:
 * answers stream in with numbered citations to official sources, follow-up suggestions and a way to a person.
 * Only sending a question morphs the box to full screen (a view transition from the box to the panel): typing in it, or
 * pressing it, leaves the page as it is. The open panel shows only the conversation, no preset text. × or Escape morphs it
 * back, keeping the conversation (the next question sent reopens it); New question clears it and closes the panel. The textarea stays the same element throughout, so focus and the phone keyboard survive.
 * The network side is lib/terminal/client.ts (demo mode until NEXT_PUBLIC_TERMINAL_URL is set); contract in lib/terminal/BACKEND.md.
 */

/* the four pillars of the Canadian SME research (research/RESEARCH-BRIEF.md); each pillar's questions include one about
   the rules that come with it, since the terminal answers both. `key` is the identifier; `title` is display only. */
const PILLARS = [
  { key: "customers", title: "Getting more customers", questions: [
    "How do I show up higher on Google Maps?",
    "Why isn’t my website bringing in leads?",
    "What do I need before I send marketing emails?",
  ] },
  { key: "efficiency", title: "Running a more efficient business", questions: [
    "What should I automate first in my business?",
    "Which CRM makes sense for a small team?",
    "When do I have to register for GST/HST?",
  ] },
  { key: "digital", title: "Improving your digital presence", questions: [
    "When is Shopify enough, and when do I need a custom site?",
    "Why is my website slow, and does it matter?",
    "Does my website have to meet AODA accessibility rules?",
  ] },
  { key: "ai", title: "Using AI to grow", questions: [
    "How can AI help me answer customer emails?",
    "Which jobs shouldn’t I hand over to AI?",
    "What privacy rules apply when I use AI tools?",
  ] },
] as const;
// the closed box's placeholder walks through them, one pillar after another
const EXAMPLES = [0, 1, 2].flatMap((i) => PILLARS.map((p) => p.questions[i]));

const ERRORS: Record<TerminalErrorCode, string> = {
  rate_limited: "That’s a lot of questions in a short time. Wait a minute, then try again.",
  out_of_scope: "The terminal answers questions about running a business in Canada: customers, operations, websites, AI and the rules around them. Try asking it another way.",
  unavailable: "The terminal couldn’t answer just now. Try again in a moment.",
  bad_request: "That question couldn’t be sent. Shorten it and try again.",
  network: "You seem to be offline. Check your connection and try again.",
};

type Status = "waiting" | "streaming" | "done" | "error" | "stopped";
type Msg =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; sources: Source[]; suggestions: string[]; status: Status; error?: TerminalErrorCode; where: JurisdictionCode };

let seq = 0;
const uid = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`;

/* 20px line glyphs, the page's icon style (round caps, currentColor) */
const G = {
  chevR: <path d="M10 6l6 6-6 6" />,
  chevL: <path d="M14 6l-6 6 6 6" />,
  stop: <rect x="7" y="7" width="10" height="10" rx="1.5" />,
  copy: <><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M15.5 8.5V6a1.5 1.5 0 00-1.5-1.5H6A1.5 1.5 0 004.5 6v8A1.5 1.5 0 006 15.5h2.5" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  ext: <path d="M14 5h5v5M19 5l-8 8M17 14v4a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 015 18V8.5A1.5 1.5 0 016.5 7H10" />,
  turn: <><path d="M12 2.8l9.2 9.2-9.2 9.2L2.8 12z" /><path d="M9 14.5V12a1.5 1.5 0 011.5-1.5H15M13 8.5l2 2-2 2" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" />,
};

/* run a state change as a morph (View Transitions) where the browser has it and motion is welcome; otherwise at once */
function morph(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return update();
  doc.startViewTransition(() => flushSync(update));
}
const Glyph = ({ g }: { g: keyof typeof G }) => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true">{G[g]}</svg>;

const safeUrl = (u: string) => (/^https:\/\//i.test(u) ? u : undefined);

export default function BusinessTerminal() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const where: JurisdictionCode = DEFAULT_JURISDICTION;
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [ex, setEx] = useState(0);
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);   // full screen: the box has morphed into the conversation panel
  const conv = useRef<string | null>(null);
  const ctrl = useRef<AbortController | null>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);
  const stick = useRef(true);   // keep the log pinned to the newest line unless the reader scrolled up
  const chatting = msgs.length > 0;
  const locked = open || focused;   // typing in the box or reading the conversation: the page doesn't scroll away underneath
  const openRef = useRef(open); openRef.current = open;
  // the same textarea carries on into the panel; it is focused again after the morph, since a press that lands mid-transition
  // hits the transition overlay, not the box
  const expand = useCallback(() => {
    if (openRef.current) return;
    morph(() => setOpen(true));
    requestAnimationFrame(() => input.current?.focus({ preventScroll: true }));
  }, []);
  const collapse = useCallback(() => { input.current?.blur(); morph(() => setOpen(false)); }, []);

  // full screen: Escape morphs back; the corner offer badge (fixed over the page) steps aside so it never covers the send button
  useEffect(() => {
    document.documentElement.classList.toggle("term-open", open);
    if (!open) return;
    const esc = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") { e.preventDefault(); collapse(); } };
    addEventListener("keydown", esc);
    return () => { removeEventListener("keydown", esc); document.documentElement.classList.remove("term-open"); };
  }, [open, collapse]);

  // lead-in: the box follows the first part of the hero's scroll (data-lead screens) up and out; past halfway the
  // headline is let in (#stick.lead off, which restarts its rise animation)
  useEffect(() => {
    const sec = section.current, hero = sec?.closest<HTMLElement>("#hero"), stage = hero?.querySelector<HTMLElement>("#stick");
    if (!sec || !hero || !stage) return;
    const screens = parseFloat(hero.dataset.lead || "0") || 0;
    let raf = 0;
    const update = () => {
      raf = 0;
      const l = screens ? Math.min(1, Math.max(0, (scrollY - hero.offsetTop) / (screens * stage.clientHeight))) : 0;
      sec.style.setProperty("--lead", l.toFixed(3));
      sec.classList.toggle("is-gone", l >= .5);   // faded out by now (opacity 1 - 2l): no longer a target
      stage.classList.toggle("lead", l < .5);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);

  // hold the page still while the box is in use: wheel, touch and scroll keys only move the conversation or the text
  useEffect(() => {
    if (!locked) return;
    const scrolls = (el: Element | null) => !!el && el.scrollHeight > el.clientHeight + 1;
    const inside = (t: EventTarget | null) => t instanceof Node &&
      ((log.current?.contains(t) && scrolls(log.current)) || (input.current?.contains(t) && scrolls(input.current)));
    const block = (e: Event) => { if (!inside(e.target)) e.preventDefault(); };
    const KEYS = ["PageDown", "PageUp", "Home", "End", "ArrowDown", "ArrowUp", " "];
    const keys = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (KEYS.includes(e.key) && !(t && (t.matches("textarea, input, select, button, [contenteditable]") || log.current?.contains(t)))) e.preventDefault();
    };
    addEventListener("wheel", block, { passive: false });
    addEventListener("touchmove", block, { passive: false });
    addEventListener("keydown", keys);
    return () => { removeEventListener("wheel", block); removeEventListener("touchmove", block); removeEventListener("keydown", keys); };
  }, [locked]);

  // the placeholder walks through the examples while the box is empty and idle
  useEffect(() => {
    if (chatting || draft || focused) return;
    const t = setInterval(() => setEx((i) => (i + 1) % EXAMPLES.length), 3600);
    return () => clearInterval(t);
  }, [chatting, draft, focused]);
  // a question in flight is cancelled when the section goes away
  useEffect(() => () => ctrl.current?.abort(), []);
  // follow the stream
  useEffect(() => {
    const el = log.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [msgs]);
  // the composer grows with its text, up to a few lines
  useEffect(() => {
    const el = input.current; if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [draft, chatting]);

  const patch = useCallback((id: string, fn: (m: Extract<Msg, { role: "assistant" }>) => Partial<Extract<Msg, { role: "assistant" }>>) =>
    setMsgs((all) => all.map((m) => (m.id === id && m.role === "assistant" ? { ...m, ...fn(m) } : m))), []);

  const send = useCallback(async (raw: string, base: Msg[] = msgs) => {
    const q = raw.trim().slice(0, MAX_QUESTION);
    if (!q) { setHint("Type a question first."); input.current?.focus(); return; }
    if (ctrl.current) return;
    setHint(null);
    expand();

    // history for the service: every question, and every answer that finished (or was stopped part-way)
    const history: ChatTurn[] = base.flatMap((m): ChatTurn[] =>
      m.role === "user" ? [{ role: "user", content: m.text }]
        : (m.status === "done" || m.status === "stopped") && m.text ? [{ role: "assistant", content: m.text }] : []);
    const a: Msg = { id: uid(), role: "assistant", text: "", sources: [], suggestions: [], status: "waiting", where };
    setMsgs([...base, { id: uid(), role: "user", text: q }, a]);
    setDraft("");
    setBusy(true);
    stick.current = true;
    // part-way through the lead-in: back to the top, so the conversation has the whole screen
    const hero = section.current?.closest<HTMLElement>("#hero");
    if (!chatting && hero && scrollY > hero.offsetTop + 2)
      scrollTo({ top: hero.offsetTop, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });

    const ac = new AbortController(); ctrl.current = ac;
    try {
      for await (const ev of ask({ conversationId: conv.current, jurisdiction: where, messages: [...history, { role: "user", content: q }] }, ac.signal)) {
        if (ev.type === "meta") conv.current = ev.conversationId;
        else if (ev.type === "delta") patch(a.id, (m) => ({ text: m.text + ev.text, status: "streaming" }));
        else if (ev.type === "source") patch(a.id, (m) => ({ sources: m.sources.some((s) => s.id === ev.source.id) ? m.sources : [...m.sources, ev.source] }));
        else if (ev.type === "suggestions") patch(a.id, () => ({ suggestions: ev.items.slice(0, 3) }));
        else if (ev.type === "error") throw new TerminalError(ev.code, ev.message);
      }
      patch(a.id, (m) => ({ status: m.text ? "done" : "error", error: m.text ? undefined : "unavailable" }));
    } catch (e) {
      if (ac.signal.aborted) patch(a.id, () => ({ status: "stopped" }));
      else patch(a.id, () => ({ status: "error", error: e instanceof TerminalError ? e.code : "unavailable" }));
    } finally {
      ctrl.current = null;
      setBusy(false);
    }
  }, [msgs, where, chatting, patch, expand]);

  const stop = () => ctrl.current?.abort();
  // the panel only exists for a conversation: a new question closes it and returns to the box, ready to type
  const reset = () => {
    ctrl.current?.abort();
    conv.current = null;
    setDraft(""); setHint(null);
    morph(() => { setMsgs([]); setOpen(false); });
    requestAnimationFrame(() => input.current?.focus({ preventScroll: true }));
  };
  // try again: drop the failed answer and its question, then ask the same question again
  const retry = (id: string) => {
    const i = msgs.findIndex((m) => m.id === id), q = msgs[i - 1];
    if (i < 1 || q?.role !== "user") return;
    send(q.text, msgs.slice(0, i - 1));
  };

  const onSubmit = (e: FormEvent) => { e.preventDefault(); if (busy) stop(); else send(draft); };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (!busy) send(draft); }
  };
  const empty = !draft.trim();

  const composer = (
    <form className="term-compose" onSubmit={onSubmit}
      onMouseDown={(e) => { if (!(e.target as HTMLElement).closest("textarea, button")) { e.preventDefault(); input.current?.focus(); } }}>
      <label className="sr-only" htmlFor="term-q">Ask a question about running your business</label>
      <textarea
        id="term-q" ref={input} rows={1} value={draft} maxLength={MAX_QUESTION} enterKeyHint="send" autoComplete="off"
        placeholder={chatting ? "Ask a follow-up question" : `Try ‘${EXAMPLES[ex]}’`}
        onChange={(e) => { setDraft(e.target.value); if (hint) setHint(null); }}
        onKeyDown={onKey} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        aria-describedby={hint ? "term-hint" : undefined}
      />
      <div className="term-tools">
        {/* aria-disabled, not disabled: a press on an empty box explains itself (the hint below) */}
        <button type="submit" className={`sprout btn icon term-send${busy ? " is-stop" : ""}`} aria-label={busy ? "Stop the answer" : "Ask"}
          aria-disabled={!busy && empty ? true : undefined}>
          <Glyph g={busy ? "stop" : "chevR"} />
        </button>
      </div>
      {hint && <p className="term-hint" id="term-hint" role="status">{hint}</p>}
    </form>
  );

  // one tree for both states, so the composer (and its textarea) is never remounted: focus and the phone keyboard survive
  return (
    <section ref={section} id="terminal" className={`term${open ? " is-chat is-full" : ""}`} aria-label="Canadian Business Terminal"
      role={open ? "dialog" : undefined} aria-modal={open || undefined}>
      <div className="term-main">
        {!open && (
          <div className="term-intro">
            <RiseHeading className="h1 term-h" text="Greetings, Toronto." delay={80} />
            <p className="term-sub rise-after" style={{ "--rise-delay": "380ms" } as CSSProperties}>
              Whatever you need to know about doing business in Toronto, start here.
            </p>
          </div>
        )}

        <div className={`term-panel${open ? " frame" : ""}`}>
          {open ? (
            <div className="term-bar">
              {chatting && (
                <button type="button" className="sprout btn sm term-new" onClick={reset} aria-label="Start a new question">
                  <Glyph g="chevL" /><span>New question</span>
                </button>
              )}
              <span className="term-bar-t"><span className="term-bar-name">Canadian Business Terminal · </span>Not legal or tax advice{DEMO ? " · Demo" : ""}</span>
              <button type="button" className="sprout btn icon term-close" onClick={collapse} aria-label="Close the terminal"><Glyph g="close" /></button>
            </div>
          ) : null}
          {open ? (
            <div ref={log} className="term-log" role="log" aria-live="polite" aria-relevant="additions"
              onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40; }}>
              {msgs.map((m) => m.role === "user"
                ? <p key={m.id} className="term-q">{m.text}</p>
                : <Answer key={m.id} m={m} busy={busy} onRetry={() => retry(m.id)} onAsk={(q) => send(q)} />)}
            </div>
          ) : null}
          {composer}
        </div>

        {!open && (
          <p className="term-fine">
            Ask about customers, operations, your website or AI. Answers link to their sources and are general information, not legal or tax advice.
            {DEMO && <> <b>Demo: the live terminal isn’t connected yet.</b></>}
          </p>
        )}
      </div>
    </section>
  );
}

/* ---------- one answer ---------- */

function Answer({ m, busy, onRetry, onAsk }: {
  m: Extract<Msg, { role: "assistant" }>; busy: boolean; onRetry: () => void; onAsk: (q: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (!copied) return; const t = setTimeout(() => setCopied(false), 1800); return () => clearTimeout(t); }, [copied]);
  const copy = async () => {
    const refs = m.sources.map((s, i) => `[${i + 1}] ${s.title}: ${s.url}`).join("\n");
    try { await navigator.clipboard.writeText(refs ? `${m.text}\n\n${refs}` : m.text); setCopied(true); } catch { /* clipboard blocked: nothing to undo */ }
  };

  if (m.status === "waiting") {
    return (
      <div className="term-a" aria-busy="true">
        <p className="term-wait"><span className="term-load" aria-hidden="true"><img src="/brand/tcg-icon.svg" alt="" /><img src="/brand/tcg-icon.svg" alt="" /></span>
          Finding your answer…</p>
      </div>
    );
  }

  return (
    <div className="term-a" aria-busy={m.status === "streaming"}>
      {m.text && <div className="term-body"><Rich text={m.text} sources={m.sources} />{m.status === "streaming" && <span className="term-caret" aria-hidden="true" />}</div>}

      {m.status === "error" && (
        <div className="term-err frame">
          <p>{ERRORS[m.error ?? "unavailable"]}</p>
          <CtaButton small label="Try again" onClick={onRetry} aria-disabled={busy || undefined} />
        </div>
      )}
      {m.status === "stopped" && <p className="term-note">Stopped. Ask again whenever you’re ready.</p>}

      {m.sources.length > 0 && m.status !== "error" && (
        <div className="term-src">
          <p className="eyebrow">Sources</p>
          <ol>
            {m.sources.map((s, i) => {
              const href = safeUrl(s.url);
              const body = <><span className="term-n">{i + 1}</span><span className="term-src-t"><b>{s.title}</b><small>{s.publisher}{s.jurisdiction ? ` · ${jurisdictionLabel(s.jurisdiction)}` : ""}</small></span>{href && <Glyph g="ext" />}</>;
              return <li key={s.id}>{href ? <a className="single hair" href={href} target="_blank" rel="noopener noreferrer">{body}</a> : <span className="single hair">{body}</span>}</li>;
            })}
          </ol>
        </div>
      )}

      {m.status === "done" && (
        <>
          <div className="term-acts">
            <button type="button" className={`sprout btn sm${copied ? " is-ok" : ""}`} onClick={copy} aria-label={copied ? "Copied" : "Copy answer and sources"}>
              <Glyph g={copied ? "check" : "copy"} /><span>{copied ? "Copied" : "Copy"}</span>
            </button>
            <Link className="sprout link term-human" href="/book" aria-label="Talk it through with a consultant">
              <Glyph g="turn" /><span>Talk it through with us</span>
            </Link>
          </div>
          {m.suggestions.length > 0 && (
            <div className="term-next">
              <p className="eyebrow">Ask next</p>
              <ul>
                {m.suggestions.map((s) => (
                  <li key={s}><button type="button" className="sprout btn sm" onClick={() => onAsk(s)} aria-disabled={busy || undefined}><span>{s}</span><Glyph g="chevR" /></button></li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- a small, safe Markdown subset: paragraphs, - and 1. lists, ### headings, **bold**, [n] citations ---------- */

// a line's kind; consecutive lines of one kind form one element, so a heading or a lead-in sentence followed straight away
// by a list (no blank line between, as models often write) still renders as heading/paragraph + list
const kindOf = (l: string) => (/^\s*[-*•]\s+/.test(l) ? "ul" : /^\s*\d+[.)]\s+/.test(l) ? "ol" : /^#{1,4}\s/.test(l) ? "h" : "p");
const strip = { ul: /^\s*[-*•]\s+/, ol: /^\s*\d+[.)]\s+/, h: /^#+\s*/, p: /^/ } as const;

function Rich({ text, sources }: { text: string; sources: Source[] }) {
  const runs: { kind: keyof typeof strip; lines: string[] }[] = [];
  for (const block of text.replace(/\r/g, "").split(/\n{2,}/)) {
    let prev: (typeof runs)[number] | null = null;
    for (const l of block.split("\n").filter((x) => x.trim())) {
      const kind = kindOf(l);
      if (prev && prev.kind === kind && kind !== "h") prev.lines.push(l);
      else runs.push(prev = { kind, lines: [l] });
    }
  }
  return (
    <>
      {runs.map((r, i) => {
        const items = r.lines.map((l) => l.replace(strip[r.kind], ""));
        if (r.kind === "ul") return <ul key={i}>{items.map((t, j) => <li key={j}><Inline text={t} sources={sources} /></li>)}</ul>;
        if (r.kind === "ol") return <ol key={i}>{items.map((t, j) => <li key={j}><Inline text={t} sources={sources} /></li>)}</ol>;
        if (r.kind === "h") return <h3 key={i} className="term-ah"><Inline text={items[0]} sources={sources} /></h3>;
        return <p key={i}><Inline text={items.join(" ")} sources={sources} /></p>;
      })}
    </>
  );
}

function Inline({ text, sources }: { text: string; sources: Source[] }) {
  const out: ReactNode[] = [];
  text.split(/(\*\*[^*]+\*\*|\[\d+\])/g).forEach((part, i) => {
    if (!part) return;
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    const cite = part.match(/^\[(\d+)\]$/);
    if (bold) out.push(<strong key={i}>{bold[1]}</strong>);
    else if (cite) {
      const n = Number(cite[1]), s = sources[n - 1], href = s && safeUrl(s.url);
      out.push(href
        ? <a key={i} className="term-cite" href={href} target="_blank" rel="noopener noreferrer" aria-label={`Source ${n}: ${s.title}`}>{n}</a>
        : <span key={i} className="term-cite">{n}</span>);
    } else out.push(part);
  });
  return <>{out}</>;
}
