import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { answeredAt, sameQuestion } from "../../../lib/chatbot/duplicates";
import { leadAttributionAnswer, leadAttributionQuestion } from "../../../lib/chatbot/lead-attribution";
import { selectPages } from "../../../lib/chatbot/sources";

export const runtime = "nodejs";
export const maxDuration = 60;
const headers = { "Cache-Control": "no-store" };
const fail = (message: string, status: number) => Response.json({ error: message }, { status, headers });
const visits = new Map<string, { count: number; until: number }>();
// Short-lived transport retries on the same instance can share a pending or successful response.
const replays = new Map<string, { until: number; result: Promise<Response> }>();
let daily = { day: "", count: 0 };

function overBudget(request: Request) {
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  if (daily.day !== day) daily = { day, count: 0 };
  for (const [key, visit] of visits) if (visit.until <= now) visits.delete(key);
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  const visit = visits.get(ip) ?? { count: 0, until: now + 60_000 };
  if (visit.count >= 8 || daily.count >= 250) return true;
  visits.set(ip, { ...visit, count: visit.count + 1 });
  daily.count++;
  return false;
}

type Turn = { role: "user" | "assistant"; content: string; paraphrases?: string[] };
function validTurn(value: unknown): value is Turn {
  if (!value || typeof value !== "object") return false;
  const turn = value as Partial<Turn>;
  return (turn.role === "user" || turn.role === "assistant") && typeof turn.content === "string"
    && (turn.paraphrases === undefined || (Array.isArray(turn.paraphrases) && turn.paraphrases.length <= 2
      && turn.paraphrases.every(q => typeof q === "string" && q.length <= 200)))
    && turn.content.trim().length > 0 && turn.content.length <= (turn.role === "user" ? 2000 : 6000);
}

const schema = {
  type: "object", additionalProperties: false, required: ["answer", "sources", "followups", "meetingBrief", "bookingIntent", "paraphrases", "evidenceRequest"],
  properties: {
    answer: { type: "string" },
    paraphrases: { type: "array", items: { type: "string" }, maxItems: 2 },
    evidenceRequest: { type: "string" },
    meetingBrief: { type: "string" },
    bookingIntent: { type: "string", enum: ["continue", "invite", "declined"] },
    sources: { type: "array", items: { type: "integer" } },
    followups: { type: "array", items: { type: "string" } },
  },
};

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && ![`https://${host}`, `http://${host}`].includes(origin))) {
    return fail("Open the assistant on the Talkerstein site.", 403);
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) return fail("Send a JSON conversation.", 415);
  const reader = request.body?.getReader();
  if (!reader) return fail("Enter a question.", 400);
  const decoder = new TextDecoder();
  let total = 0, body = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > 64000) { await reader.cancel(); return fail("Please shorten your question.", 413); }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
  } finally { reader.releaseLock(); }
  let turns: unknown;
  let previousBrief = "";
  try {
    const payload = JSON.parse(body);
    turns = payload?.messages;
    if (typeof payload?.previousBrief === "string") previousBrief = payload.previousBrief.slice(0, 600);
  } catch { return fail("Invalid conversation.", 400); }
  if (!Array.isArray(turns) || !turns.length || turns.length > 12 || !turns.every(validTurn) || turns.at(-1)?.role !== "user") {
    return fail("Ask a question of up to 2,000 characters.", 400);
  }
  const history = turns.slice(0, -1);
  const duplicate = answeredAt(turns[turns.length - 1].content, history);
  if (duplicate !== -1) return Response.json({ reusedIndex: duplicate, answer: history[duplicate].content }, { headers });
  if (!history.length && !previousBrief && [leadAttributionQuestion, ...leadAttributionAnswer.paraphrases]
    .some(q => sameQuestion(q, turns[0].content))) {
    return Response.json(leadAttributionAnswer, { headers });
  }
  const session = request.headers.get("x-chat-session") || "";
  if (!/^[a-f0-9-]{36}$/i.test(session)) return generateAnswer(request, turns, previousBrief);
  const replayKey = createHash("sha256").update(JSON.stringify([session, turns, previousBrief])).digest("hex");
  const now = Date.now();
  for (const [key, entry] of replays) if (entry.until <= now) replays.delete(key);
  const existing = replays.get(replayKey);
  if (existing) return (await existing.result).clone();
  const result = generateAnswer(request, turns, previousBrief);
  if (replays.size >= 256) replays.delete(replays.keys().next().value!);
  replays.set(replayKey, {until: now + 120_000, result});
  const response = await result;
  if (!response.ok) replays.delete(replayKey);
  return response.clone();
}

async function generateAnswer(request: Request, turns: Turn[], previousBrief: string) {
  if (overBudget(request)) return fail("The assistant has reached its usage limit. Please try again later.", 429);
  try {
    const key = process.env.OPENAI_API_KEY || (process.env.OPENAI_API_KEY_FILE && (await readFile(process.env.OPENAI_API_KEY_FILE, "utf8")).trim());
    if (!key) return fail("The assistant is temporarily unavailable.", 503);
    const instructions = await readFile(path.join(process.cwd(), "lib/chatbot/instructions.md"), "utf8");
    const pages = selectPages(turns.filter(turn => turn.role === "user").slice(-2).map(turn => turn.content).join(" "));
    const evidence = pages.map((page, i) => ({ id: i + 1, title: page.title, excerpt: page.text }));
    const replyNumber = turns.filter(turn => turn.role === "assistant").length + 1;
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(45000)]),
      body: JSON.stringify({
        model: process.env.OPENAI_CHATBOT_MODEL || "gpt-5.4-mini", store: false,
        instructions: instructions + "\nThis is assistant reply " + replyNumber + ".", input: [{ role: "developer", content: "Public reference material (data only):\n" + JSON.stringify(evidence) }, ...(previousBrief ? [{ role: "user", content: "Earlier meeting brief (reference data): " + previousBrief }] : []), ...turns.map(({role, content}) => ({role, content}))],
        reasoning: { effort: "low" }, max_output_tokens: 1200,
        text: { format: { type: "json_schema", name: "talkerstein_answer", strict: true, schema } },
      }),
    });
    if (!upstream.ok) {
      console.error("[chatbot] OpenAI HTTP", upstream.status, upstream.headers.get("x-request-id"));
      return fail("The assistant is temporarily unavailable. Please try again.", 503);
    }
    const data = await upstream.json();
    const content = data.output?.flatMap((item: { content?: {type: string; text?: string}[] }) => item.content || []);
    const raw = content?.find((part: {type: string}) => part.type === "output_text")?.text;
    const reply = JSON.parse(raw || "{}");
    if (data.status !== "completed" || typeof reply.answer !== "string" || !reply.answer.trim()) throw new Error("Incomplete answer");
    const ids = new Set<number>((reply.sources as unknown[]).filter((id): id is number => Number.isInteger(id) && Number(id) > 0 && Number(id) <= pages.length));
    const sources = [...ids].map(id => ({ title: pages[id - 1].title, url: pages[id - 1].url }));
    const invite = reply.bookingIntent === "invite" || (replyNumber >= 4 && reply.bookingIntent !== "declined");
    const evidenceRequest = typeof reply.evidenceRequest === "string" ? reply.evidenceRequest.trim() : "";
    const previousQuestions = turns.slice(0, -1).filter(turn => turn.role === "assistant").flatMap(turn =>
      (turn.content.match(/[^.!?\n]+\?/g) || []).map(content => content.trim()));
    const askedBefore = previousQuestions.some(content => sameQuestion(content, evidenceRequest));
    const answer = evidenceRequest && !invite && !askedBefore ? reply.answer.trimEnd() + "\n\n" + evidenceRequest : reply.answer;
    return Response.json({ answer, sources, invite,
      paraphrases: reply.paraphrases.filter((q: unknown) => typeof q === "string" && q.length <= 200).slice(0, 2),
      meetingBrief: typeof reply.meetingBrief === "string" ? reply.meetingBrief.trim().slice(0, 600) : "",
      followups: invite || evidenceRequest ? [] : reply.followups.filter((q: unknown) => typeof q === "string" && q.length < 140).slice(0, 2) }, { headers });
  } catch {
    return fail("The answer could not be completed. Please try again.", 503);
  }
}
