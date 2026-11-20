# Canadian Business Terminal: backend handoff

The front end is built and runs in **demo mode** until one environment variable is set. This file is the contract the backend needs to meet.

| Piece | File |
|---|---|
| UI (section 01: the home page hero's lead-in, over the playing horizon) | `components/terminal/BusinessTerminal.tsx`, `app/terminal.css` |
| Network call (live + demo) | `lib/terminal/client.ts` |
| Types and jurisdiction codes | `lib/terminal/contract.ts` |

## The backend (built 2026-11-12)

| Piece | File |
|---|---|
| Route: validation, guards, Gemini streaming, citations | `app/api/terminal/route.ts` |
| The instructions to Gemini ("the script") | `lib/terminal/prompt.ts` |
| Knowledge base loader and passage picker (BM25) | `lib/terminal/knowledge.ts` |
| Knowledge base (Markdown) | `research/canadian-sme-knowledge-base/` (brief: `research/RESEARCH-BRIEF.md`) |

**How an answer is made:** the route validates the conversation, then picks the knowledge base passages that best match the last two questions (up to `KB_CONTEXT_CHARS`, about 6k tokens) and up to 15 citable sources. It sends those to Gemini with the instructions in `prompt.ts` and streams the reply back as the events below. The model cites `[S#]` tags, and the route renumbers them in the order the visitor sees them, sending each `source` event before the text that cites it. A tag that isn't in the list is dropped, so **only an `https` URL that appears in the knowledge base can ever be cited**.

**Unreviewed sources:** a source-register entry whose "Relevant findings" starts with `Seed:` has been checked to exist but not yet read into the knowledge base. Such a source is still listed under an answer as a place to confirm, but never gets an inline `[n]`, because the model only knew its topic. When the research replaces `Seed:` with real findings, inline citations start working for that source without any code change.

**Guards:** cross-site browser requests are refused (403); bodies over 64 KB (413) and malformed requests (400) are rejected; the newest 12 turns of up to 4,000 characters each go upstream. Rate limiting is per visitor **per server instance** (8 a minute, 80 a day). That's best effort on serverless. For a hard limit across instances, add a Vercel Firewall rate-limit rule on `/api/terminal` or a shared store (for example Upstash).

**Models:** tried in order, and the first to start streaming within 10 s wins. Default: `gemini-3.5-flash` (thinking `low`), then `gemini-3.5-flash-lite`, then `gemini-3.1-flash-lite`. Measured on 2026-11-12: about 2–4 s to first word. `gemini-3.8-flash` was overloaded (503) that day, and `gemini-2.5-flash` is closed to new keys (404). A model that rejects the thinking setting is retried once without it.

**Vercel cost:** this is the site's second function (after `/api/book`) and is needed because the key must stay secret. It's a thin streaming proxy that spends nearly all its time waiting on Gemini, with `maxDuration` 60 s. Nothing has been deployed.

## Turning it on

```bash
# .env.local (git-ignored) locally; Project Settings → Environment Variables on Vercel
GEMINI_API_KEY=…                             # server only. Never NEXT_PUBLIC_
NEXT_PUBLIC_TERMINAL_URL=/api/terminal       # unset = demo mode in the page
GEMINI_MODELS=gemini-3.5-flash,gemini-3.5-flash-lite,gemini-3.1-flash-lite   # optional
GEMINI_THINKING=low                          # optional: low | medium | high | off
KB_CONTEXT_CHARS=24000                       # optional
```

With `NEXT_PUBLIC_TERMINAL_URL` unset, the page runs in demo mode: a scripted placeholder streams locally, and the UI says "Demo". It's a build-time value (`NEXT_PUBLIC_*` is inlined), so rebuild after you change it.

**Before going live:** the key is on Gemini's **free tier**, which has low daily limits and no Pro access. Check Google's current terms on how free-tier prompts may be used, and enable billing on the Google Cloud project before real traffic. The key was also shared in a chat, so rotate it and set the new one in the environment.

## Request

`POST {NEXT_PUBLIC_TERMINAL_URL}` with `Content-Type: application/json` and `Accept: application/x-ndjson`

```json
{
  "conversationId": null,
  "jurisdiction": "ON",
  "messages": [
    { "role": "user", "content": "How do I incorporate my business in Ontario?" }
  ]
}
```

- `conversationId`: `null` on the first question; afterwards, the value your `meta` event returned.
- `jurisdiction`: one of `CA ON QC BC AB MB SK NS NB NL PE YT NT NU`. `CA` means federal law only. A province or territory means that jurisdiction's law plus the federal law that applies there. The page has no location picker, so today it always sends `ON` (`DEFAULT_JURISDICTION` in `contract.ts`). Keep reading it on every request: a picker may come back.
- `messages`: the whole visible conversation, oldest first, ending with the new question. Failed answers are left out. Answers the visitor stopped part-way are included as far as they got.
- The UI caps a question at 2,000 characters (`MAX_QUESTION`). Enforce your own limit too, and validate every field. Never trust the client.

## Response: newline-delimited JSON, streamed

`200` with `Content-Type: application/x-ndjson`. Send one JSON object per line and flush as you go:

```
{"type":"meta","conversationId":"c_8f2…"}
{"type":"source","source":{"id":"obca-s5","title":"Business Corporations Act, R.S.O. 1990, c. B.16","url":"https://www.ontario.ca/laws/statute/90b16","publisher":"Ontario e-Laws","jurisdiction":"ON"}}
{"type":"delta","text":"In Ontario you can incorporate "}
{"type":"delta","text":"provincially or federally [1][2]…"}
{"type":"suggestions","items":["What does it cost?","Do I need a lawyer to incorporate?","Provincial or federal: which is better for me?"]}
{"type":"done"}
```

| Event | Meaning | UI |
|---|---|---|
| `meta` | Conversation id. Send it first. | Sent back on the next question |
| `source` | One citation. `url` must be `https://`, or it shows as plain text. Repeating an `id` is ignored. | Numbered source cards under the answer |
| `delta` | The next piece of answer text | Appended live, with a caret |
| `suggestions` | Up to 3 follow-up questions (extras are dropped) | "Ask next" buttons |
| `done` | The end of the answer | Shows Copy, "Talk it through with us" and the suggestions |
| `error` | `{"type":"error","code":"…","message":"…"}`, which ends the stream | The error card with Try again |

**Citations:** write `[n]` in the text, where `n` is the 1-based order of the `source` events. Send a `source` before the text that cites it, or the marker shows unlinked until it arrives.

**Formatting:** the answer text supports a small Markdown subset: paragraphs separated by a blank line, `- ` bullet lists, `1. ` numbered lists, `### ` headings and `**bold**`. Anything else shows as plain text. HTML is never rendered.

## Errors

| Situation | Send | What the visitor sees |
|---|---|---|
| Too many requests | HTTP `429`, or event code `rate_limited` | Wait a minute, then try again |
| Not a Canadian business-law question | event code `out_of_scope` | It only answers business-law and government-program questions |
| Bad input or too long | HTTP `400`/`413`, or `bad_request` | Shorten it and try again |
| Anything else | HTTP `5xx`, or `unavailable` | Try again in a moment |
| No network | (client side) `network` | Check your connection |

The text for each code is in `ERRORS` in `BusinessTerminal.tsx`. The UI doesn't display your `message` field; use it for logs. A stream that ends with no text and no `done` is treated as `unavailable`.

**Stop:** the visitor can stop an answer, which aborts the fetch. Stop generating when the connection closes.

## What the page promises (the backend has to make these true)

The page says this to every visitor. Confirm each point before going live, or change the copy:

1. **"Answers link to their sources."** Answers cite only the knowledge base (official sources first, plus BDC, CFIB, Google and W3C). Some answers, for example on automation and marketing, cite nothing until the research covers them.
1a. **Scope: the four pillars.** The page copy, the example questions (`PILLARS` in `BusinessTerminal.tsx`) and the `out_of_scope` message cover customers, efficiency, digital presence and AI, plus the rules around each, matching the research brief and `prompt.ts`.
2. **"General information, not legal advice."** The answers should read that way too. Talkerstein is a consultancy, not a law firm. Questions that need a lawyer ("should I sue…") should be answered generally, pointing to the law society's referral service.
3. **Coverage:** the page sends `ON` and its panel header reads "Ontario and federal law". If a visitor asks about another province, answer for that province if you can, or say plainly that the terminal covers Ontario and federal law.

## Not built on the front end yet (needs a backend decision)

- Saving conversations, history or sharing links. The conversation lives only in page memory and is gone on reload.
- Answer feedback (helpful or not helpful).
- File upload and voice input (america.gov has both).
- A privacy statement about what is logged. The page makes no privacy claim today; add one once retention is decided.
- Analytics events for questions asked and handoffs to `/book`, subject to consent (G11).
- French. The UI is English only (G10).
