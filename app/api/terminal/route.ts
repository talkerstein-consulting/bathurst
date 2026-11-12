/**
 * POST /api/terminal: the Canadian Business Terminal's answers (contract: lib/terminal/BACKEND.md).
 * Validates the conversation, picks knowledge base passages (lib/terminal/knowledge.ts), asks Gemini with the terminal's
 * instructions (lib/terminal/prompt.ts) and streams newline-delimited JSON events back: meta, source, delta, suggestions, done.
 * The model cites [S#] tags; this route turns them into the page's numbered sources, sending each source event before
 * the text that cites it, and drops any tag that isn't in the list (so no invented URL reaches the visitor).
 *
 * Env (server only, never NEXT_PUBLIC_):
 *   GEMINI_API_KEY      required
 *   GEMINI_MODELS       optional, comma-separated fallback order (default below); a model that is overloaded,
 *                       out of quota or slow to start is skipped for the next one
 *   GEMINI_THINKING     optional thinking level: low (default), medium, high, or off to leave it to the model
 *   KB_CONTEXT_CHARS    optional, excerpt budget per question (default 24000 ≈ 6k tokens)
 * Vercel cost: this is a function (the key must stay secret). It is a thin streaming proxy: almost all of its time is
 * spent waiting on Gemini, not computing. Rate limited per visitor below; cross-site browser requests are refused.
 */
import { DEFAULT_JURISDICTION, JURISDICTIONS, MAX_QUESTION, jurisdictionLabel } from "@/lib/terminal/contract";
import type { ChatTurn, JurisdictionCode, Source, TerminalErrorCode, TerminalEvent } from "@/lib/terminal/contract";
import { retrieve } from "@/lib/terminal/knowledge";
import { OUT_OF_SCOPE, systemPrompt } from "@/lib/terminal/prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// measured 2026-11-12 on this key: 3.5 Flash at low thinking starts streaming in ~3 s, the Flash-Lite models in under 2 s;
// gemini-3.8-flash was overloaded (503) and gemini-2.5-flash is closed to new keys (404)
const MODELS = (process.env.GEMINI_MODELS || "gemini-3.5-flash,gemini-3.5-flash-lite,gemini-3.1-flash-lite").split(",").map((m) => m.trim()).filter(Boolean);
const THINKING = process.env.GEMINI_THINKING || "low";   // thinking happens before the first visible word: keep it low for a chat
const BUDGET = Number(process.env.KB_CONTEXT_CHARS) || 24_000;
const FIRST_BYTE_MS = 10_000;     // a model that hasn't started answering by then is skipped
const MAX_TURNS = 12;             // conversation turns sent upstream (the newest)
const MAX_TURN_CHARS = 4_000;
const MAX_BODY = 64_000;

/* ---------- rate limit: per visitor, per server instance (best effort; see BACKEND.md for a shared limit) ---------- */
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now(), day = 86_400_000;
  const list = (hits.get(ip) ?? []).filter((t) => now - t < day);
  const lastMinute = list.filter((t) => now - t < 60_000).length;
  if (lastMinute >= 8 || list.length >= 80) { hits.set(ip, list); return true; }
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < day)) hits.delete(k);
  return false;
}

const fail = (status: number, code: TerminalErrorCode) => Response.json({ type: "error", code }, { status, headers: { "Cache-Control": "no-store" } });

type Valid = { conversationId: string; jurisdiction: JurisdictionCode; messages: ChatTurn[] };
function validate(body: unknown): Valid | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const jurisdiction = (JURISDICTIONS.some((j) => j.code === b.jurisdiction) ? b.jurisdiction : DEFAULT_JURISDICTION) as JurisdictionCode;
  const conversationId = typeof b.conversationId === "string" && /^[\w-]{1,64}$/.test(b.conversationId) ? b.conversationId : crypto.randomUUID();
  if (!Array.isArray(b.messages) || b.messages.length < 1 || b.messages.length > 60) return null;
  const messages: ChatTurn[] = [];
  for (const m of b.messages) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string" || !content.trim()) return null;
    messages.push({ role, content: content.slice(0, MAX_TURN_CHARS) });
  }
  const last = messages[messages.length - 1];
  if (last.role !== "user" || last.content.length > MAX_QUESTION) return null;
  return { conversationId, jurisdiction, messages: messages.slice(-MAX_TURNS) };
}

/** Gemini's streamed reply (server-sent events): yields the visible text, skipping the model's thoughts. */
async function* geminiText(res: Response): AsyncGenerator<string> {
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (value) buf += value.replace(/\r/g, "");
    let i: number;
    while ((i = buf.indexOf("\n\n")) >= 0 || (done && buf.trim())) {
      const block = i >= 0 ? buf.slice(0, i) : buf; buf = i >= 0 ? buf.slice(i + 2) : "";
      const data = block.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("");
      if (!data) continue;
      let ev: { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[]; promptFeedback?: { blockReason?: string }; error?: { status?: string } };
      try { ev = JSON.parse(data); } catch { continue; }
      if (ev.error || ev.promptFeedback?.blockReason) throw new Error(`upstream:${ev.error?.status ?? ev.promptFeedback?.blockReason}`);
      const c = ev.candidates?.[0];
      for (const p of c?.content?.parts ?? []) if (p.text && !p.thought) yield p.text;
      if (c?.finishReason && !["STOP", "MAX_TOKENS", "FINISH_REASON_UNSPECIFIED"].includes(c.finishReason)) throw new Error(`finish:${c.finishReason}`);
    }
    if (done) return;
  }
}

/** Ask the models in order; returns the first response that starts streaming. */
type Payload = { generationConfig: Record<string, unknown> } & Record<string, unknown>;
async function openStream(payload: Payload, signal: AbortSignal): Promise<{ res: Response; model: string } | { error: TerminalErrorCode }> {
  const key = process.env.GEMINI_API_KEY!;
  for (const model of MODELS) {
    // a model that doesn't accept the thinking setting (HTTP 400) is asked once more without it
    for (const body of [payload, { ...payload, generationConfig: { ...payload.generationConfig, thinkingConfig: undefined } }]) {
      const ac = new AbortController(), t = setTimeout(() => ac.abort(), FIRST_BYTE_MS);
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
          method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body: JSON.stringify(body),
          signal: AbortSignal.any([signal, ac.signal]),
        });
        clearTimeout(t);
        if (res.ok && res.body) return { res, model };
        const detail = (await res.text().catch(() => "")).slice(0, 300).replace(/\s+/g, " ");
        console.error(`[terminal] ${model} → HTTP ${res.status} ${detail}`);
        if (res.status === 400 && body === payload && payload.generationConfig.thinkingConfig) continue;   // retry without thinking
        if ([400, 401, 403].includes(res.status)) return { error: "unavailable" };   // key or request problem: no point trying others
        break;   // busy (503), out of quota (429), gone (404) or failing (5xx): next model
      } catch (e) {
        clearTimeout(t);
        if (signal.aborted) throw e;
        console.error(`[terminal] ${model} → no response within ${FIRST_BYTE_MS / 1000}s`);
        break;
      }
    }
  }
  return { error: "unavailable" };
}

export async function POST(request: Request) {
  // browsers on other sites can't spend this site's Gemini quota
  const site = request.headers.get("sec-fetch-site"), origin = request.headers.get("origin"), host = request.headers.get("host");
  if (site === "cross-site" || (origin && host && new URL(origin).host !== host)) return fail(403, "bad_request");
  if (!process.env.GEMINI_API_KEY) { console.error("[terminal] GEMINI_API_KEY is not set"); return fail(503, "unavailable"); }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  if (limited(ip)) return fail(429, "rate_limited");

  const raw = await request.text();
  if (raw.length > MAX_BODY) return fail(413, "bad_request");
  let parsed: unknown; try { parsed = JSON.parse(raw); } catch { return fail(400, "bad_request"); }
  const req = validate(parsed);
  if (!req) return fail(400, "bad_request");

  // retrieval reads the new question plus the one before it, so a short follow-up ("what about employees?") keeps its topic
  const userTurns = req.messages.filter((m) => m.role === "user");
  const query = userTurns.slice(-2).map((m) => m.content).join("\n");
  const kb = await retrieve(`${query} ${jurisdictionLabel(req.jurisdiction)}`, BUDGET);

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "long", day: "numeric" }).format(new Date());
  const payload = {
    systemInstruction: { parts: [{ text: systemPrompt({ jurisdiction: req.jurisdiction, context: kb.context, sources: kb.sources, today }) }] },
    contents: req.messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    generationConfig: { temperature: 0.3, maxOutputTokens: 8192, ...(THINKING !== "off" ? { thinkingConfig: { thinkingLevel: THINKING } } : {}) } as Record<string, unknown>,
  };

  const opened = await openStream(payload, request.signal);
  if ("error" in opened) return fail(503, opened.error);
  console.info(`[terminal] ${opened.model} · ${kb.passages}/${kb.kbPassages} passages · ${kb.sources.length} sources`);

  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (ev: TerminalEvent) => controller.enqueue(enc.encode(JSON.stringify(ev) + "\n"));
      send({ type: "meta", conversationId: req.conversationId });

      // [S#] → the page's numbering, in order of first citation; each source is sent before the text that cites it.
      // A source the research hasn't reviewed yet (register entry marked "Seed:") is listed under the answer as a place to
      // confirm, but gets no inline marker: the model only knew its topic, so it can't vouch for a sentence.
      const shown = new Map<number, number>();
      const cite = (tags: string) => tags.match(/\d+/g)!.map(Number).map((n) => {
        const s = kb.sources[n - 1]; if (!s) return "";
        if (!shown.has(n)) {
          shown.set(n, shown.size + 1);
          const source: Source = { id: `s${n}-${s.url.length}`, title: s.title, url: s.url, publisher: s.publisher };
          send({ type: "source", source });
        }
        return /^seed:/i.test(s.about) ? "" : `[${shown.get(n)}]`;
      }).join("");
      const TAG = /\[S\d+(?:\]\s*\[S\d+|\s*,\s*S?\d+)*\]/g;

      let pending = "", tail = "", inTail = false, started = false, sentText = false;
      const emit = (text: string) => {
        const out = text.split(OUT_OF_SCOPE).join("").replace(TAG, cite).replace(/ +([.,;:!?])/g, "$1").replace(/[ \t]+\n/g, "\n");
        if (out) { send({ type: "delta", text: out }); if (out.trim()) sentText = true; }
      };
      // the follow-ups marker, however the model spaces or bolds it ("<<<FOLLOWUPS>>>", "**<< FOLLOW-UPS >>**")
      const MARK = /[*_]*<{2,3}\s*FOLLOW-?UPS\s*>{2,3}[*_]*/i;
      const pump = (final: boolean) => {
        if (inTail) { tail += pending; pending = ""; return; }
        const m = pending.match(MARK);
        if (m) { emit(pending.slice(0, m.index).replace(/\s+$/, "")); tail = pending.slice(m.index! + m[0].length); pending = ""; inTail = true; return; }
        let cut = pending.length;
        if (!final) {
          // hold back anything that could be the start of a tag or a marker split across chunks: an unclosed "[S…",
          // or a trailing run of "<" (with any partial word after it), held from its FIRST "<"
          const b = pending.lastIndexOf("["); if (b >= 0 && pending.indexOf("]", b) < 0 && pending.length - b < 24) cut = Math.min(cut, b);
          const lt = pending.match(/[*_]*<{1,3}\s*[A-Za-z_-]{0,12}\s*>{0,2}$/); if (lt) cut = Math.min(cut, lt.index!);
        }
        emit(pending.slice(0, cut)); pending = pending.slice(cut);
      };

      try {
        for await (const text of geminiText(opened.res)) {
          pending += text;
          if (!started) {   // the out-of-scope marker can only come first
            if (pending.trimStart().length < OUT_OF_SCOPE.length && !pending.includes("\n")) continue;
            started = true;
            if (pending.trimStart().startsWith(OUT_OF_SCOPE)) { send({ type: "error", code: "out_of_scope" }); controller.close(); return; }
          }
          pump(false);
        }
        if (!started && pending.trim().startsWith(OUT_OF_SCOPE.slice(0, 8))) { send({ type: "error", code: "out_of_scope" }); controller.close(); return; }
        pump(true);
        if (!sentText) { send({ type: "error", code: "unavailable" }); controller.close(); return; }
        try {
          const items = JSON.parse(tail.replace(/```(json)?/g, "").trim().match(/\[[\s\S]*\]/)?.[0] ?? "[]");
          if (Array.isArray(items)) {
            const clean = items.filter((s): s is string => typeof s === "string" && s.trim().length > 3).map((s) => s.trim().slice(0, 120)).slice(0, 3);
            if (clean.length) send({ type: "suggestions", items: clean });
          }
        } catch { /* no follow-ups is fine */ }
        send({ type: "done" });
      } catch (e) {
        if (!request.signal.aborted) {
          console.error(`[terminal] stream from ${opened.model} failed: ${(e as Error).message}`);
          send({ type: "error", code: "unavailable" });
        }
      }
      try { controller.close(); } catch { /* the visitor already left */ }
    },
    cancel() { /* the visitor pressed Stop or left: request.signal aborts the upstream fetch */ },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
