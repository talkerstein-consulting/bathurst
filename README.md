# Ask Talkerstein — front-end prototype

A feel-check, not production code. One static page, no build step.

    npx serve -l 4178 .     # or just open index.html

## What came from where

**Formatting / page architecture — america.gov**
- Hero: huge serif headline, one-line deck, a big rounded photo card with the ask bar
  floating over the top of the photo, example question rotating through 10 photos,
  prev / count / next under the card.
- A centred serif statement with small square pictures set inline in the text. The
  treatment itself is the build reference's (`303 Promax/app/sentence.css`): fixed lines
  that don't re-wrap, slots one cap height tall standing on the baseline, opening when the
  block comes into view.
- Three alternating visual + text rows (square tile one side, 40px heading + short body
  + text link the other).
- Wide CTA with its own ask bar, then a footer of stacked serif links, a full-width
  wordmark, a three-column meta row and a legal line.
- A pinned ask bar that appears whenever neither real ask bar is on screen.

**Everything else — the locked TCG brand** (from `303 TCG Promax/bathurst`)
- Sea Breeze `#F3F7F3`, Steel Blue `#19254A`, Muted Orange `#B3530E`, cream `#EDE5CB`.
- Southport (headings) + Jost (body) + Slowly Signature (one accent phrase per section),
  copied from the Promax project into `fonts/`.
- Paper grain, double-line frames, outlined CTAs, orange reserved for actions.
- `brand/` holds the TCG wordmark and icon, copied from the same project.

## Photography — all TCG's own

Copied from `303 TCG Promax/bathurst/public`. Nothing is stock and nothing is a render.

**Hero** (`photos/`) — ten client shots, one per owner problem. The `<img>` order in
`#shots` must match the order of `EXAMPLES` in the script; they pair by index and nothing
enforces it.

| # | Photo | Client | Question |
|---|---|---|---|
| 1 | `electrical.webp` | MES | Quotes take me three hours every night |
| 2 | `auto-service.webp` | AR26 | Customers can't book a service slot online |
| 3 | `restaurant.webp` | Kapara | Our reservations all come in by phone |
| 4 | `paperwork.webp` | Family Tree | We still do intake on paper |
| 5 | `salon.webp` | HOH | Half our clients no-show their appointment |
| 6 | `takeout.webp` | Uzbek | We want online ordering without the delivery apps |
| 7 | `events.webp` | Hily's | Event enquiries get lost in my inbox |
| 8 | `clinic.webp` | Family Tree | Patients can't see when we're free |
| 9 | `retail.webp` | Fringe | The shop and the website disagree on stock |
| 10 | `catering.webp` | Royal Dairy | Catering orders arrive six different ways |

**Sentence slots** (`photos/aria|kidicare|esther.webp`) — the squares that open inside the
statement, taken from the build reference's own `public/sentence/`.

**What's ahead** (`work/`) — ten client screens, six phone and four desktop, set into a
12-column bed after the reference's arrangement. Static: nothing drifts, nothing casts a
shadow. Placement is by class (`.p5-9`, `.rr2`), never inline, so the breakpoints can
override it — at 1040px and below the bed collapses to two-up and the arrangement is
dropped.

## Still filler

- Nothing is wired up: the ask bars don't submit, the links don't go anywhere.
- Footer links, the three row headings and the CTA chips are placeholder copy.

## Known deviations from the guardrails

- **D03** — the send button uses an up-arrow, not a chevron, because that is the ask-bar
  convention america.gov set and the one people expect. Chevrons are used for the
  carousel's prev / next.
- **D04** — CTAs are outlined, never filled, per the Promax `globals.css` rule, which
  overrides the global "main CTA is filled" default. The orange send circle is the one
  filled control.
- The grunge SVG line system from Promax is approximated here with CSS borders +
  inset shadows. It reads the same at a glance; it is not the same code.
