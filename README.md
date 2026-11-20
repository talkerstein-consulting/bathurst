# Talkerstein Consulting Group landing page

Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn · React Bits Pro · three.js

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
```

## Ask Talkerstein

Open `/chatbot` for the prompt-led experience. The browser sends up to 11 recent turns to `/api/chatbot`. The server selects relevant public pages and CRM practice notes, calls OpenAI’s Responses API with storage disabled, and resolves the returned citation IDs into links from the local knowledge base.

- Set the server-only `OPENAI_API_KEY` in your environment, or set `OPENAI_API_KEY_FILE` to an absolute private file path for local development. The key file should live outside this checkout. Set `OPENAI_CHATBOT_MODEL` to override the default `gpt-5.4-mini`.
- Edit `lib/chatbot/instructions.md` to update how the assistant answers. The separate Canadian SME terminal retains its own instructions and endpoint.
- The published site snapshot lives in `lib/chatbot/knowledge.json`. Run `python scripts/refresh-chatbot-knowledge.py` with `requests` and `beautifulsoup4` installed to refresh agency, service and case-study pages from the Talkerstein sitemap.
- The website refresh excludes pricing. Keep CRM and delivery insights in `lib/chatbot/practice-notes.json` as short, anonymized summaries derived from reviewed Gmail threads and GHL materials. Record what the evidence establishes and the question it helps answer. Check workflow publication separately before describing a flow as live. The snapshot is curated manually. The public API has no mailbox or CRM credentials and only links public pages.
- Pricing inquiries go to Rishon’s free 30-minute call. Clear requests take a local path before model generation. Contextual pricing requests use the same response.
- The local route allows eight requests per minute per visitor and 250 per UTC day per server process. A multi-instance deployment needs a shared usage limit for a single production budget.
- Run `npm run test:e2e -- tests/chatbot.spec.ts` for desktop and mobile interaction coverage. These browser tests use fixture responses. A live check requires a configured key.

## Layout

| Path | What it is |
|---|---|
| `app/page.tsx` | Page composition, top to bottom |
| `app/globals.css` | Brand tokens (Sea Breeze / Steel Blue / Muted Orange) mapped into Tailwind and shadcn |
| `app/bathurst-map.css` | Styles for the hero + maps-app chrome driven by the engine |
| `components/bathurst/BathurstHero.tsx` | Hero markup (Street View → crane → live map); mounts the engine |
| `lib/bathurst/engine.ts` | three.js scene, fly-through, map camera, gestures, industry scroll steps |
| `lib/bathurst/globe.ts` | The paper planet: a vertex-shader bend that curls the whole map over a sphere (the curvature of the earth), with the matching maths for pins, fits and raycasts |
| `lib/bathurst/data.ts` | Clients, cross streets, services, steps, review. Single source for map and sections |
| `components/bathurst/*.tsx` | Sections: Bathurst line, Directions, Services, Saved places, Reviews, Contact, Footer |
| `components/bathurst/SignatureLine.tsx` | "Built for what's next." written by the React Bits Signature pen; the paths are the Slowly Signature letterforms traced by `scripts/trace-signature.mjs` into `lib/bathurst/signature-strokes.json` (re-run it if the words change) |
| `components/react-bits/` | React Bits Pro components (Staggered Text, Blur Highlight) |
| `reference/prototype-v15.html` | The approved single-file prototype the engine was ported from |

Sections ask the map to open a client with `openOnMap(id)` (a `tcg:open` window event).

## Get directions (booking)

Every "Get directions" lands on `/book` (`components/bathurst/BookingForm.tsx`), which posts JSON to `/api/book` (`app/api/book/route.ts`).
The route validates the request and forwards it to a webhook set in the environment:

```bash
BOOKING_WEBHOOK_URL=https://…        # HubSpot / Zapier / Make / GoHighLevel inbound webhook
BOOKING_WEBHOOK_SECRET=…             # optional, sent as Authorization: Bearer …
```

Until `BOOKING_WEBHOOK_URL` is set the route answers 503 and the form offers the same request as a pre-filled email, so nothing is lost.
The payload fields are listed at the top of `app/api/book/route.ts`.

## React Bits Pro

The license key lives in `.env.local` (git-ignored) as `REACTBITS_LICENSE_KEY`. Install more with:

```bash
npx shadcn@latest add @reactbits-starter/<slug>-tw   # components
npx shadcn@latest add @reactbits-pro/<slug>          # blocks
```

## Open items

- Brand header font (ITC Cheltenham Std Bold Condensed) and Slowly Signature files: add via `next/font/local`.
- White logo lockup for dark grounds (footer currently uses the colored lockup on a Sea Breeze panel).
- Real buildings: Toronto 3D Massing + OpenStreetMap to replace the placeholder massing.
- Case-study photography, the other six Clutch reviews, and a real submit target for the contact form.
- Services, photos and case studies for the clients added in Oct 2026 (Eli's Barbershop onward in `lib/bathurst/data.ts`).
- Type `lib/bathurst/engine.ts` (ported untyped for this first pass).
