# The client map

Rewritten 2026-11-25, replacing the handoff for the scroll-driven version.

## What it is

A static map of TCG's clients. It opens on the map and stays there; nothing about it is driven
by the page's scroll any more.

| Piece | What it does |
|---|---|
| `components/tcg/map-stage.tsx` | the markup — canvas, chips, place sheet, controls, scale. Every id in it is one the engine looks up by name. It must not re-render after mount. |
| `lib/bathurst/engine.ts` | the map itself: three.js, the pins, the chip filter, the place sheet's contents. Started with `createBathurstEngine(undefined, { static: true })`. |
| `app/map/page.tsx` | `/map` = the stage + the fullscreen button + `map-only.css`. |
| `app/map/map-only.css` | sizes the map to the page, and puts the engine's chrome on the TCG brand. |
| `app/bathurst-map.css` | the chrome's own styles, carried over with the engine. |
| `components/tcg/footprint.tsx` | the homepage section. It frames `/map` in an iframe on a sticky, viewport-wide stage that opens from the page column out to full bleed as the section is scrolled (React Bits ScrollExpand, `components/ScrollExpand.jsx`). The iframe is always the full stage and is scaled down while boxed, so the map never resizes and its chips and controls stay on screen; styles in `app/globals.css` (`.footprint-track/-stage/-clip`). |

## What the engine is now

`lib/bathurst/engine.ts` was 1,724 lines of scroll-driven hero. It is ~1,190 lines of map. Gone:

- the street fly-through, the crane move and the camera curves (`INTRO`, `keys`, `posCurve`) —
  the camera is the map camera, full stop;
- the front page: the rounded window, its scissor, the headline column, the hero road labels;
- the Find Your Way Forward journey: the route ribbons, the road graph and its Dijkstra, the
  runner and nav dots, the step cards, the from/to intake;
- the cover sheet (reviews, services, footer) and the page-length bookkeeping it drove;
- every scroll path: `onScroll`, `heroTop`, the `PH_*` phase constants, `goTo`, the Route Preview
  wheel/touch/key stepping, `tcg:nav` and `tcg:scroll`;
- the off-screen group tabs (their list was filtered to nothing, so they never drew).

Nothing in the file reads `scrollY` any more. `createBathurstEngine(area, { static: true })` keeps
its `static` flag, but it is the only mode that runs: it skips the one remaining scroll courtesy
(`history.scrollRestoration`) and re-fits the opening view once the map reports ready, because the
first fit at mount happens before the city, the region and the pins exist.

## The two states that went

- **No all-clients list.** The sheet used to open on load with a list of every client over the map.
  The panel now exists only while a place is open: `refresh()` puts `.place` on `#mapui`, and
  `map-only.css` hides the panel and its tab without it. Closing a place leaves the bare map.
- **The chips never leave.** They were a scroll state that faded out whenever the panel or a full
  sheet came in. They are part of the map now, up at all times, at full strength.

## Sizing

The map is usually inside a frame, not a browser window, so the chrome is measured against the
map's own box (`app/map/map-only.css`):

- desktop place sheet: `--dock-w: clamp(260px, 38%, 420px)`, inset on all four sides.
- phones: the sheet's three states are **heights** (full / 56% / 104px), anchored to the bottom
  of the map. The reference slid one tall sheet down by a share of its own height, which works
  on a phone screen — the rest is below the fold — and not in a frame, where below the fold is
  simply cut off.
- controls and chips keep a 44px touch target and nothing more.

## The world (2026-11-26)

The map now zooms out to the whole planet, and every client is at its real coordinates.
The old `onEdge` ring, which pulled Montreal, Queens and Mississauga in to the edge of the cluster, is gone.

- **Placement.** Within 60 km of Toronto (`NEAR_M` in `engine.ts`) pins use the old linear
  scale, so they still line up with the baked city. Further out they use an azimuthal equidistant
  projection round Toronto (`lib/bathurst/world.ts`). The two agree near Toronto.
- **The globe.** `GLOBE.maxR` is now Earth's radius. The paper-planet bend wraps that
  projection back into the real globe. The bend angle is capped at π, so far geometry parks at
  the far pole instead of wrapping round to the front.
- **Land and sea.** `public/map/world.json` is Natural Earth 1:50m v5.1.2 (public domain), baked
  from six GeoJSON layers: countries, lakes, rivers, province/state lines, cities and seas.
  Coordinates are rounded to 0.01° and thinned. The file is 2.3 MB, about 0.8 MB gzipped.
  Countries and lakes are painted into a land/lake mask (4096 wide, or 2048 on lite devices),
  which the ground shader reads. Near Toronto, the region bake owns the ground until about
  60 km altitude. Everywhere else the world's water always shows.
- **Atlas look (2026-11-26, "still looks blank").** Countries take one of seven warm paper tints
  from Natural Earth's `MAPCOLOR7`, so neighbours always differ. Canada's slot is the brand paper
  itself. Water is a clear map blue (the print palette's `water`, shared with the city bake).
  The world's water and tints show from about 12–40 km altitude up; below that, near Toronto,
  the region bake owns the ground. A degree grid shows on regional views and a 10° grid on
  continent and globe views. Southern Ontario cities (Hamilton, Oshawa, Barrie…) are hand-placed,
  because the 1:50m places are sparse there.
- **Class clash.** City labels use `.capital`, not `.cap`: `.cap` is a card class in
  `bathurst-map.css` that stretched the label across the whole map.
- **Pen work and names.** Coasts and borders, province/state lines and rivers are line
  geometry, faded in and out by altitude. Continents are hand-placed. Countries, seas, cities
  and lakes come from the data and use the road-label collision pass, in that priority. Lakes
  are ranked by their real extent, because the data's own rank isn't size.
- **Zoom-out limit.** The globe fills about 86% of the map's shorter side. The view centre is
  clamped to within 7,000 km of Toronto.
- **No merging.** Every pin is always its own icon. Zoomed out, the Toronto pins are spread
  into a tight bunch by the existing pin spreader.
- **Edge markers.** Any client off screen shows on the edge of the free map, in its true
  direction. Clients on the same stretch of edge are bunched as overlapping 30px icons in rows,
  each its own button, with its name as a tooltip. Each bunch has one chevron and the distance
  to its nearest client. Tapping an icon opens that client.
- **Readout.** The bottom-right corner shows the country, lake or sea under the middle of the
  view (`placeAt` in `world.ts`), replacing the coordinates and scale. There are no flags: the
  flag set wasn't downloaded, and Windows doesn't render emoji flags. Phones hide this row, as before.
- **Stray line fixed.** The map's `.foot` shares its class with the site footer in
  `app/globals.css`, whose `::before` rule, margin and padding were drawing a line above the
  readout. Reset in `map-only.css`.
- **Moved onto the map from `ELSEWHERE`:** CleverPays (Laval), Ralph Wigs (Aventura) and
  Premier Kosher (West Lincoln). All three use city coordinates. Premier Kosher sits at the
  township centre, not at 1607 Abingdon Rd, and needs confirming.

## The opening view (2026-11-26)

`routeView()` in `engine.ts` now frames every pin, the away ones included (`FAR`), and never comes in
closer than `OPEN_WORLD_SHARE` (.62) of the whole-planet view — so the map opens on about half the
Earth, with Nova Risk Transfer (George Town), Ralph Wigs (Aventura), Esther Saadia (Queens) and
KidiCare (Montreal) in frame around the Toronto bunch. An area page still frames only its own clients.

Nova Risk Transfer is new in `data.ts`: the testimonial (`novarrisk`) puts its co-owner in the Cayman
Islands, and it is pinned at George Town, the capital — not a street address. Confirm it.

Map annotations (continents, countries, lakes, seas, cities, the readout) are all set in the
low-contrast ink in `map-only.css`; the client pins carry the only full-strength marks.

**The reveal (2026-11-26, second pass).** `engine.reveal(p)` flies the camera between the two ends
of the section: **0 is the whole globe**, filling the map's shorter side edge to edge (`worldAlt`'s
fill factor is .985, up from .86 — the globe fills the frame and is never cropped) and centred on
every client, with `REVEAL_SPIN` (18°) of extra turn so it is seen to rotate; **1 is `routeView()`**,
the Toronto bunch at the framing the map has always opened on (~20–45 km). The centre is eased in
lat/lon and the distance geometrically. `footprint.tsx` drives it with the section's own scroll,
divided by `REVEAL_LEAD` (0.62) so the flight is over before the hold ends and the next section
covers the map. `defaultView()` is `revealView(reveal)`, so recenter returns to the scrolled state.
It stops at the first real map interaction (`mapDirty`); `/map` on its own gets 1 from `map-stage.tsx`.

**Featured pins.** `feat: true` in `data.ts` draws a client's pin 52px instead of 34 (42 instead of
28 on phones), on the map and in the edge-marker bunches, above the others in the stack
(`map-only.css`). It is on Esther Saadia, KidiCare, Kapara, Maple Electric Supply, CleverPays and
Beit Halochem.

**The section.** Boxed, the map fills the section's own column (no rule above it, heading centred
right on top of it). Open, it is full bleed and held for `HOLD_DISTANCE` (0.75 stage heights) while
the next section rides up over it: `.footprint` is pulled back by `--fp-overlap` (set from the stage
height by the section's script), and `.footprint + .sec` carries its own edge-to-edge paper at
`z-index: 2` with `min-height: var(--fp-overlap)`, so the held map is never seen past the column.

**Addresses.** KidiCare is pinned at 9540 Boul. Saint-Laurent, Montréal (its own contact page, read
2026-11-26; by appointment), geocoded with Nominatim. **Esther Saadia is still the Queens city pin** —
the label publishes no street address anywhere public. It needs one from TCG.

**The chips** are centred in the row (`safe center`, so the first chip stays reachable when the row
is longer than the map) and painted solid; on phones they stay left-aligned and scroll sideways.

## Known, not done

- Dead since the front page went: `components/bathurst/BookingForm.tsx`, `CornerOffer.tsx`,
  `Icon.tsx`, `Snowfall.tsx`, `TrackRail.tsx`, `lib/bathurst/reels.json`. Left in place.
- The phone sheet's drag still moves it by transform while its three states are heights, so a
  release snaps rather than glides. Not looked at.
- The land/lake mask is about 10 km per pixel, so coasts and lakes are soft when you zoom right
  into an away client (Montreal, Miami). The pen-drawn coasts and borders stay sharp.
- With a filter off, a far view puts all 37 Toronto clients on one edge as a stack. That is
  intended (never merged), but it is large.
