"use client";

import Link from "next/link";
import { previewAnswer, previewQuestion } from "@/lib/chatbot/preview";

import { useEffect, useRef, useState, type ReactNode } from "react";

const examples = [
  ["Quotes take me three hours every night", "electrical", "quotes estimates pricing trades"],
  ["Customers can’t book a service slot online", "auto-service", "booking appointments website"],
  ["Our reservations all come in by phone", "restaurant", "bookings restaurant tables"],
  ["We still do intake on paper", "paperwork", "forms CRM automation"],
  ["Half our clients miss their appointments", "salon", "reminders booking no-shows"],
  ["We want online ordering without the delivery apps", "takeout", "food orders restaurant"],
  ["Event enquiries get lost in my inbox", "events", "leads CRM follow-up quotes"],
  ["Patients can’t see when we’re free", "clinic", "scheduling booking availability"],
  ["The shop and the website disagree on stock", "retail", "inventory Shopify POS"],
  ["Catering orders arrive six different ways", "catering", "orders inbox automation"],
];
const questions = [...examples.map(([q,, tags]) => ({q, tags})),
  { q: "How can I tell which ads bring in qualified leads?", tags: "advertising ad spend campaigns reporting paid leads" },
  { q: "What did Talkerstein build for Fringe Boutique?", tags: "portfolio shopify retail work projects case studies" },
  { q: "How does a business diagnostic work?", tags: "consulting process getting started" },
];
type Message = { role: "assistant" | "user"; content: string; sources?: {title: string; url: string}[]; followups?: string[]; meetingBrief?: string; invite?: boolean };
function AnswerRating() {
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  return <div className="answer-rating" role="group" aria-label="Rate this answer">
    {(["up", "down"] as const).map(direction => {
      const label = direction === "up" ? "Helpful" : "Not helpful";
      return <button type="button" key={direction} aria-label={label} title={label} aria-pressed={vote === direction}
        onClick={() => setVote(vote === direction ? null : direction)}>
        <svg aria-hidden="true" viewBox="0 0 24 24" className={direction === "down" ? "thumb-down" : undefined}>
          <path d="M7 10v11H3V10h4Zm0 1 5-7c1-2 4-1 3 2l-1 4h5a2 2 0 0 1 2 2.4l-1.5 6.8A2 2 0 0 1 17.5 21H10l-3-1"/>
        </svg>
      </button>;
    })}
  </div>;
}

function Arrow() {
  return <svg className="glyph" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>;
}

export default function AgencyChat({children, designPreview = false}: {children: ReactNode; designPreview?: boolean}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [docked, setDocked] = useState(false);
  const [draft, setDraft] = useState("");
  const [reply, setReply] = useState("");
  const [suggest, setSuggest] = useState(false);
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(designPreview);
  const [panel, setPanel] = useState<"menu" | "booking" | null>(null);
  const [note, setNote] = useState("");
  const [previewBooked, setPreviewBooked] = useState(false);
  const sheet = useRef<HTMLDialogElement>(null);
  const menuTrigger = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Message[]>(() => {
    if (!designPreview) return [];
    const sample = previewAnswer(previewQuestion);
    return [{role: "user", content: previewQuestion}, {role: "assistant", content: sample.answer, sources: sample.sources, followups: sample.followups, meetingBrief: sample.meetingBrief}];
  });
  const hero = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const modal = useRef<HTMLDialogElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);
  const stick = useRef(true);

  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPaused(motion.matches);
    sync(); motion.addEventListener("change", sync);
    const observer = new IntersectionObserver(([entry]) => setDocked(entry.boundingClientRect.bottom < 75), { rootMargin: "-75px 0px 0px 0px" });
    observer.observe(hero.current!);
    const details = menu.current!;
    const dismiss = (event: PointerEvent) => { if (!details.contains(event.target as Node)) details.open = false; };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && details.open) { details.open = false; details.querySelector("summary")?.focus(); }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      controller.current?.abort(); observer.disconnect(); motion.removeEventListener("change", sync);
      document.removeEventListener("pointerdown", dismiss); document.removeEventListener("keydown", escape);
      document.documentElement.classList.remove("chatting");
    };
  }, []);
  useEffect(() => {
    if (paused || docked || open || draft) return;
    const timer = setInterval(() => { if (!document.hidden) setIndex(previous => (previous + 1) % examples.length); }, 6000);
    return () => clearInterval(timer);
  }, [paused, docked, open, draft]);
  useEffect(() => {
    if (open) { modal.current?.showModal(); composer.current?.focus(); }
    else if (modal.current?.open) modal.current.close();
    document.documentElement.classList.toggle("chatting", open);
  }, [open]);
  useEffect(() => {
    if (stick.current && log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages, busy, open, error]);

  async function requestAnswer(turns: Message[]) {
    if (controller.current) return;
    const ac = new AbortController();
    controller.current = ac; setBusy(true); setError(""); stick.current = true;
    const previousBrief = turns.filter(m => m.role === "assistant").at(-1)?.meetingBrief || "";
    try {
      if (designPreview) {
        const sample = previewAnswer(turns[turns.length - 1].content);
        await new Promise(resolve => setTimeout(resolve, 650));
        const invite = turns.filter(m => m.role === "assistant").length >= 3 || /book a call|schedule a call/i.test(turns[turns.length - 1].content);
        const meetingBrief = [previousBrief, sample.meetingBrief && !previousBrief.includes(sample.meetingBrief) ? sample.meetingBrief : ""].filter(Boolean).join(" ").slice(0, 600);
        if (!ac.signal.aborted) setMessages([...turns, {role: "assistant", content: invite ? "On a free 30-minute call, Rishon can walk through one example with you and help you choose what to tackle first." : sample.answer,
          sources: invite ? [] : sample.sources, followups: invite ? [] : sample.followups, meetingBrief, invite}]);
        return;
      }
      const res = await fetch("/api/chatbot", {
        method: "POST", headers: {"Content-Type": "application/json"}, signal: ac.signal,
        body: JSON.stringify({previousBrief, messages: turns.slice(-11).map(({role, content}) => ({role, content}))}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "The answer could not be completed.");
      if (!ac.signal.aborted) setMessages([...turns, {role: "assistant", content: data.answer, sources: data.sources, followups: data.followups, meetingBrief: data.meetingBrief, invite: data.invite}]);
    } catch (reason) {
      if (!ac.signal.aborted) setError(reason instanceof TypeError ? "Connection interrupted. Check your connection and retry." : (reason as Error).message);
    } finally {
      if (controller.current === ac) { controller.current = null; setBusy(false); }
    }
  }
  function stop() {
    controller.current?.abort(); controller.current = null; setBusy(false); setError("Answer stopped.");
  }
  function send(value: string) {
    const content = value.trim();
    if (!content || controller.current) return;
    setSuggest(false); setDraft(""); setReply(""); setOpen(true);
    const turns: Message[] = [...messages, {role:"user", content}];
    setMessages(turns); void requestAnswer(turns);
  }
  function openBooking() {
    setNote(messages.filter(m => m.role === "assistant").at(-1)?.meetingBrief || "");
    setPreviewBooked(false);
    setPanel("booking");
    if (!sheet.current?.open) sheet.current?.showModal();
  }
  async function dismissSheet() {
    const dialog = sheet.current;
    const trigger = menuTrigger.current;
    const close = dialog?.querySelector<HTMLButtonElement>(".sheet-close");
    if (!dialog?.open || !trigger || !close || dialog.hasAttribute("data-closing")) return;

    const destination = trigger.getBoundingClientRect();
    const origin = close.getBoundingClientRect();
    dialog.style.setProperty("--return-x", (destination.right - origin.right) + "px");
    dialog.style.setProperty("--return-y", (destination.top - origin.top) + "px");
    dialog.style.setProperty("--return-width", destination.width + "px");
    dialog.setAttribute("data-closing", "");
    // Keep the modal in the top layer until its pill covers the header trigger.
    await Promise.allSettled(dialog.getAnimations({subtree: true}).map(animation => animation.finished));
    dialog.close();
    dialog.removeAttribute("data-closing");
  }
  useEffect(() => {
    if (panel === "booking") sheet.current?.querySelector<HTMLButtonElement>(".sheet-close")?.focus();
  }, [panel]);

  const terms = draft.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const matches = (terms.length ? questions.map(item => ({...item, score: terms.filter(term => (item.q + " " + item.tags).toLowerCase().includes(term)).length}))
    .filter(item => item.score > 0).sort((a,b) => b.score - a.score).slice(0,3)
    : [questions[index], questions[10], questions[11]]);
  const listOpen = suggest && matches.length > 0;
  const suggestion = messages.at(-1)?.followups?.[0]?.trim() || "";
  const outgoing = reply === "" ? suggestion : reply.trim();
  function chooseExample(n: number) { setPaused(true); setIndex((n + examples.length) % examples.length); }

  return <>
    <a className="ask-skip" href="#q">Skip to the question box</a>
    <header className="site-head" id="head"><div className="wrap">
      <a className="brand" href="#top"><img src="/brand/tcg-logo-s-h.svg" alt="Talkerstein Consulting Group" /></a>
      <div className="ask-nav">
        {docked && <button className="ask-return" onClick={() => { setOpen(true); }}>Ask Talkerstein <Arrow /></button>}
        <details ref={menu} className="ask-menu"><summary>Menu <span aria-hidden="true">☰</span></summary>
          <nav aria-label="Main navigation">
            <a href="https://talkerstein.com/services">Services</a><a href="https://talkerstein.com/work">Our work</a>
            <a href="https://talkerstein.com/our-process">Our process</a><Link href="/book">Book a call</Link>
          </nav>
        </details>
      </div>
    </div></header>
    <main id="top">
      <section className="hero"><div className="wrap">
        <h1>Better Business Systems</h1><p className="deck">What would you like to make easier?</p>
        <div className="plate">
          <div className="shots" aria-hidden="true">
            {examples.map(([,photo], n) => (index === n || n === (index + 1) % examples.length) &&
              <img key={photo} className={n === index ? "on" : ""} src={`/photos/${photo}.webp`} alt="" fetchPriority={n === index ? "high" : "low"}/>)}
          </div>
          <div className="agency-composer" ref={hero} onBlur={e => {if (!e.currentTarget.contains(e.relatedTarget)) setSuggest(false);}}>
            <form className="ask" onSubmit={e => {e.preventDefault(); send(listOpen && active >= 0 ? matches[active].q : draft || examples[index][0]);}}>
              <label className="sr" htmlFor="q">Describe what you need</label>
              <input ref={field} id="q" role="combobox" aria-autocomplete="list" aria-expanded={listOpen} aria-controls="ask-options"
                aria-activedescendant={listOpen && active >= 0 ? "ask-option-" + active : undefined}
                value={draft} maxLength={2000} autoComplete="off" enterKeyHint="send" placeholder={`Try “${examples[index][0]}”`}
                onChange={e => {setDraft(e.target.value); setSuggest(true); setActive(-1);}}
                onFocus={() => {setPaused(true); setSuggest(true);}} onClick={() => setSuggest(true)}
                onKeyDown={e => {
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === "Escape") {setSuggest(false); setActive(-1);}
                  if ((e.key === "ArrowDown" || e.key === "ArrowUp") && matches.length) {
                    e.preventDefault(); setSuggest(true);
                    setActive(i => (i + (e.key === "ArrowDown" ? 1 : i === -1 ? 0 : -1) + matches.length) % matches.length);
                  }
                }} />
              <button type="submit" className="send" aria-label={draft.trim() ? "Send question" : "Ask this example"}><Arrow/></button>
            </form>
            <div id="ask-options" role="listbox" aria-label="Suggested questions" hidden={!listOpen}>
              {matches.map(({q}, n) => <button role="option" type="button" id={"ask-option-" + n} aria-selected={active === n}
                key={q} tabIndex={-1} onMouseDown={e => e.preventDefault()} onClick={() => send(q)}>{q}<span aria-hidden="true">↗</span></button>)}
            </div>
          </div>
          <button type="button" className="shot-cap" onClick={() => send(examples[index][0])}><i/> {examples[index][0]} <span aria-hidden="true">↗</span></button>
        </div>
        <div className="rotor">
          <button onClick={() => chooseExample(index-1)} aria-label="Previous example">‹</button>
          <span className="count">{index+1} / {examples.length}</span>
          <button onClick={() => setPaused(!paused)} aria-label={paused ? "Play examples" : "Pause examples"}>{paused ? "▷" : "Ⅱ"}</button>
          <button onClick={() => chooseExample(index+1)} aria-label="Next example">›</button>
        </div>
      </div></section>
      {children}
    </main>
    <dialog ref={modal} className="chatsec" aria-label="Ask Talkerstein" onClose={() => {
      if (controller.current) stop(); setOpen(false);
    }}>
      <div className="chat-top"><img className="chat-mark" src="/brand/tcg-logo-s-h.svg" alt="Talkerstein"/>
        <button ref={menuTrigger} className="chat-menu-trigger" aria-haspopup="dialog" aria-controls="chat-panel" aria-expanded={panel !== null}
          onClick={() => {setPanel("menu"); sheet.current?.showModal();}}>Menu</button></div>
      <div className="thread-scroll" ref={log} onScroll={e => {const el=e.currentTarget; stick.current=el.scrollHeight-el.scrollTop-el.clientHeight<60;}}>
        <div className="thread" role="log" aria-live="polite" aria-relevant="additions">
          {!messages.length && <p className="ask-empty">What would you like to make easier?</p>}
          {messages.map((m,i) => m.role === "user" ? <p className="msg-u" key={i}>{m.content}</p>
            : <article className="msg-a beat" key={i}>
              <div className="answer-row">
                <img className="answer-avatar" src="/icon.png" width="28" height="28" alt="Talkerstein"/>
                <div className="answer-bubble">
                  <div className="ask-answer">{m.content}</div>
                  {!!m.sources?.length && <div className="ask-sources" aria-label="Sources">{m.sources.map(s =>
                    <a href={s.url} key={s.url} target="_blank" rel="noreferrer">{s.title.split(/ \|| - Talkerstein/)[0]} ↗</a>)}</div>}
                  {m.invite && i === messages.length - 1 &&
                    <button className="call-cta" onClick={openBooking}>Book a free 30-minute call <span aria-hidden="true">↗</span></button>}
                </div>
              </div>
              <div className="answer-tools"><AnswerRating/></div>
            </article>)}
          {busy && <p className="typing" role="status"><b aria-hidden="true"><span/><span/><span/></b>Checking Talkerstein’s published work…</p>}
        </div>
        {error && <div role="status" className="ask-error">{error} <button onClick={() => void requestAnswer(messages)}>Retry</button></div>}
      </div>
      <div className="chat-foot">
        <form className="ask" onSubmit={e => { e.preventDefault(); if (busy) stop(); else send(outgoing); }}>
          <label htmlFor="ask-reply" className="sr">Ask a question</label>
          <textarea ref={composer} id="ask-reply" rows={1} maxLength={2000} value={reply}
            placeholder={suggestion || "Ask a question…"} onChange={e => setReply(e.target.value)}
            onKeyDown={e => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "ArrowRight" && !reply && suggestion) {
                e.preventDefault();
                setReply(suggestion);
              }
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!busy) send(outgoing);
              }
            }}/>
          <button className="send" disabled={!busy && !outgoing}
            aria-label={busy ? "Stop answer" : !reply && suggestion ? "Send suggested question" : "Send reply"}>
            {busy ? "■" : <Arrow/>}
          </button>
        </form>
      </div>
    </dialog>
    <dialog ref={sheet} id="chat-panel" className="chat-sheet" aria-label={panel === "booking" ? "Book a call" : "Chat menu"}
      onClose={() => setPanel(null)} onCancel={e => {e.preventDefault(); void dismissSheet();}} onClick={e => {
        if (e.target !== e.currentTarget) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) void dismissSheet();
      }}>
      <button className="sheet-close" aria-label={panel === "booking" ? "Close booking" : "Close menu"} onClick={() => void dismissSheet()}>
        <span className="sheet-cross" aria-hidden="true">×</span>
        <span className="sheet-menu-label" aria-hidden="true">Menu</span>
      </button>
      {panel === "booking" ? <div className="booking-content">
        <h2>Meet with Rishon</h2>
        <p>Choose a time for your free 30-minute call.</p>
        <form action="https://calendly.com/hi-talkerstein/30min" method="get" target="_blank" rel="noopener noreferrer"
          onSubmit={e => {if (designPreview) { e.preventDefault(); setPreviewBooked(true); }}}>
          <label htmlFor="meeting-brief">Meeting notes for Rishon</label>
          <textarea id="meeting-brief" name="a1" value={note} maxLength={600} rows={4} onChange={e => setNote(e.target.value)}/>
          <p>Edit or clear these notes before continuing. Calendly includes them with your booking.</p>
          <button className="call-cta" type="submit">Choose a time <span aria-hidden="true">↗</span></button>
          {previewBooked && <p role="status">In the live chat, this opens Rishon’s calendar with your notes.</p>}
        </form>
      </div> : <nav className="sheet-links" aria-label="Chat navigation">
        <button onClick={() => {sheet.current?.close(); modal.current?.close();}} >Close conversation</button>
        <a href="https://talkerstein.com/services">Services</a>
        <a href="https://talkerstein.com/work">Our work</a>
        <button onClick={openBooking}>Book a free call</button>
        <div className="sheet-utility">
          <a href="https://talkerstein.com/terms-of-use">Terms</a>
          <a href="https://talkerstein.com/contact">Contact</a>
          <a href="https://talkerstein.com/#faq">FAQ</a>
        </div>
      </nav>}
    </dialog>
  </>;
}
