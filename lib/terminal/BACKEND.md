# Canadian Business Terminal: backend handoff

The front end is built and runs in **demo mode** until one environment variable is set. This file is the contract the backend needs to meet.

| Piece | File |
|---|---|
| UI (section 01: the home page hero's lead-in, over the playing horizon) | `components/terminal/BusinessTerminal.tsx`, `app/terminal.css` |
| Network call (live + demo) | `lib/terminal/client.ts` |
| Types and jurisdiction codes | `lib/terminal/contract.ts` |

## Turning it on

```bash
NEXT_PUBLIC_TERMINAL_URL=/api/terminal     # same-origin path (recommended) or a full https URL
```

Unset or empty means demo mode: a scripted placeholder streams locally, and the UI says "Demo" in the panel header and the fine print. It's a build-time value (`NEXT_PUBLIC_*` is inlined), so rebuild after you change it.

A same-origin route (`app/api/terminal/route.ts`) avoids CORS and keeps model and search keys on the server. Don't put any secret in a `NEXT_PUBLIC_` variable.

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

1. **"Answers point to official federal and provincial sources."** Every answer should cite at least one source, and sources should be government or official publishers (Justice Laws, canada.ca, CRA, provincial e-Laws and the like). If you allow other publishers, update `.term-fine` in `BusinessTerminal.tsx`.
2. **"General information, not legal advice."** The answers should read that way too. Talkerstein is a consultancy, not a law firm. Questions that need a lawyer ("should I sue…") should be answered generally, pointing to the law society's referral service.
3. **Coverage:** the page sends `ON` and its panel header reads "Ontario and federal law". If a visitor asks about another province, answer for that province if you can, or say plainly that the terminal covers Ontario and federal law.

## Not built on the front end yet (needs a backend decision)

- Saving conversations, history or sharing links. The conversation lives only in page memory and is gone on reload.
- Answer feedback (helpful or not helpful).
- File upload and voice input (america.gov has both).
- A privacy statement about what is logged. The page makes no privacy claim today; add one once retention is decided.
- Analytics events for questions asked and handoffs to `/book`, subject to consent (G11).
- French. The UI is English only (G10).
