import type { AskRequest, Source, TerminalErrorCode, TerminalEvent } from "./contract";
import { jurisdictionLabel } from "./contract";

/**
 * The terminal's one network call. Live when NEXT_PUBLIC_TERMINAL_URL is set (a same-origin path such as /api/terminal,
 * or a full URL), otherwise demo mode: a scripted placeholder streamed locally and labelled as a demo in the UI,
 * so nobody mistakes it for an answer about the law.
 */
const ENDPOINT = process.env.NEXT_PUBLIC_TERMINAL_URL ?? "";
export const DEMO = ENDPOINT === "";

export class TerminalError extends Error {
  constructor(public code: TerminalErrorCode, message?: string) { super(message ?? code); }
}

export async function* ask(req: AskRequest, signal: AbortSignal): AsyncGenerator<TerminalEvent> {
  if (DEMO) { yield* demo(req, signal); return; }

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" },
      body: JSON.stringify(req),
      signal,
    });
  } catch (e) {
    if (signal.aborted) throw e;
    throw new TerminalError("network");
  }
  if (!res.ok || !res.body) {
    const code: TerminalErrorCode = res.status === 429 ? "rate_limited" : res.status === 400 || res.status === 413 ? "bad_request" : "unavailable";
    throw new TerminalError(code);
  }

  // newline-delimited JSON: one event per line; a partial line waits for the next chunk
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (value) buf += value;
    const lines = buf.split("\n");
    buf = done ? "" : lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      let ev: TerminalEvent;
      try { ev = JSON.parse(line); } catch { continue; }   // a malformed line is skipped, not fatal
      yield ev;
      if (ev.type === "done" || ev.type === "error") return;
    }
    if (done) return;
  }
}

/* ---------- demo mode ---------- */

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((ok, fail) => {
    const t = setTimeout(ok, ms);
    signal.addEventListener("abort", () => { clearTimeout(t); fail(new DOMException("Aborted", "AbortError")); }, { once: true });
  });

// real, official starting points (home pages, not specific provisions): the demo never claims what the law says
const DEMO_SOURCES: Source[] = [
  { id: "justice-laws", title: "Justice Laws Website: consolidated federal Acts and regulations", url: "https://laws-lois.justice.gc.ca/", publisher: "Department of Justice Canada", jurisdiction: "CA" },
  { id: "canada-business", title: "Business and industry", url: "https://www.canada.ca/en/services/business.html", publisher: "Government of Canada", jurisdiction: "CA" },
];
const ON_SOURCE: Source = { id: "e-laws", title: "e-Laws: Ontario’s statutes and regulations", url: "https://www.ontario.ca/laws", publisher: "Government of Ontario", jurisdiction: "ON" };

async function* demo(req: AskRequest, signal: AbortSignal): AsyncGenerator<TerminalEvent> {
  const q = req.messages[req.messages.length - 1]?.content.trim() ?? "";
  const where = jurisdictionLabel(req.jurisdiction);
  const sources = req.jurisdiction === "ON" ? [...DEMO_SOURCES, ON_SOURCE] : DEMO_SOURCES;
  const refs = sources.map((_, i) => `[${i + 1}]`).join("");
  const text =
    `**This is a demo answer.** The live terminal isn’t connected yet, so nothing here is about the law.\n\n` +
    `Once it’s live, you’ll get a short, plain-language answer to “${q.length > 120 ? q.slice(0, 117) + "…" : q}” for ${req.jurisdiction === "CA" ? "federal law" : where}, with every point linked to the official source it came from ${refs}.\n\n` +
    `- What the rule is, in one sentence\n- What it means for a business like yours\n- What to do next, and where to do it\n\n` +
    `If your situation needs more than an answer, book a free consult and talk it through with us.`;

  await wait(900, signal);
  yield { type: "meta", conversationId: req.conversationId ?? `demo-${Date.now().toString(36)}` };
  for (const s of sources) yield { type: "source", source: s };
  // stream in small word groups, like the live service will
  const parts = text.match(/\S+\s*/g) ?? [];
  for (let i = 0; i < parts.length; i += 3) {
    await wait(45, signal);
    yield { type: "delta", text: parts.slice(i, i + 3).join("") };
  }
  yield { type: "suggestions", items: ["Does this change if I have employees?", "What happens if I get this wrong?", "What should I do first?"] };
  yield { type: "done" };
}
