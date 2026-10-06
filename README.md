# Talkerstein Consulting Group landing page

Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn · React Bits Pro · three.js

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
```

## Layout

| Path | What it is |
|---|---|
| `app/page.tsx` | Page composition, top to bottom |
| `app/globals.css` | Brand tokens (Sea Breeze / Steel Blue / Muted Orange) mapped into Tailwind and shadcn |
| `app/bathurst-map.css` | Styles for the hero + maps-app chrome driven by the engine |
| `components/bathurst/BathurstHero.tsx` | Hero markup (Street View → crane → live map); mounts the engine |
| `lib/bathurst/engine.ts` | three.js scene, fly-through, map camera, gestures, industry scroll steps |
| `lib/bathurst/data.ts` | Clients, cross streets, services, steps, review. Single source for map and sections |
| `components/bathurst/*.tsx` | Sections: Bathurst line, Directions, Services, Saved places, Reviews, Contact, Footer |
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
