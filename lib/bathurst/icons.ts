// Map iconography in the vintage cartography style (quatrefoil route shields, compass rose).
// Brand colours only: Sea Breeze fill, Steel Blue ink, Muted Orange accent. Plain SVG strings so the
// engine (which builds its overlay DOM imperatively) and React components can both use them.

const SEA = "#F3F7F3";
const STEEL = "#19254A";
const ORANGE = "#B3530E";

/** Four-lobed shield outline, viewBox 0 0 40 40 (lobes r=10.2 around the centre). */
export const QUATREFOIL =
  "M9.97 9.97A10.2 10.2 0 1 1 30.03 9.97A10.2 10.2 0 1 1 30.03 30.03A10.2 10.2 0 1 1 9.97 30.03A10.2 10.2 0 1 1 9.97 9.97Z";

/** Quatrefoil shield with a short code in it (e.g. LAW, 401), double-line ink like the rest of the brand. */
export function quatrefoilShield(code: string, fill = SEA, ink = STEEL) {
  return (
    `<svg viewBox="0 0 40 40" aria-hidden="true">` +
    `<path d="${QUATREFOIL}" fill="${fill}" stroke="${ink}" stroke-width="2.6"/>` +
    `<path d="${QUATREFOIL}" transform="translate(20 20) scale(.8) translate(-20 -20)" fill="none" stroke="${ink}" stroke-width="1"/>` +
    `</svg><b>${code}</b>`
  );
}

/** 8-point compass star, viewBox 0 0 48 48, split light/dark halves. Diagonals first, cardinals on top. */
const STAR =
  '<path d="M24 24L34.25 13.75L22.16 22.16Z" fill="#19254A"/><path d="M24 24L34.25 13.75L25.84 25.84Z" fill="#F3F7F3" stroke="#19254A" stroke-width=".8" stroke-linejoin="round"/><path d="M24 24L34.25 34.25L25.84 22.16Z" fill="#19254A"/><path d="M24 24L34.25 34.25L22.16 25.84Z" fill="#F3F7F3" stroke="#19254A" stroke-width=".8" stroke-linejoin="round"/><path d="M24 24L13.75 34.25L25.84 25.84Z" fill="#19254A"/><path d="M24 24L13.75 34.25L22.16 22.16Z" fill="#F3F7F3" stroke="#19254A" stroke-width=".8" stroke-linejoin="round"/><path d="M24 24L13.75 13.75L22.16 25.84Z" fill="#19254A"/><path d="M24 24L13.75 13.75L25.84 22.16Z" fill="#F3F7F3" stroke="#19254A" stroke-width=".8" stroke-linejoin="round"/><path d="M24 24L24.00 1.50L20.40 24.00Z" fill="#19254A"/><path d="M24 24L24.00 1.50L27.60 24.00Z" fill="#F3F7F3" stroke="#19254A" stroke-width=".8" stroke-linejoin="round"/><path d="M24 24L46.50 24.00L24.00 20.40Z" fill="#19254A"/><path d="M24 24L46.50 24.00L24.00 27.60Z" fill="#F3F7F3" stroke="#19254A" stroke-width=".8" stroke-linejoin="round"/><path d="M24 24L24.00 46.50L27.60 24.00Z" fill="#19254A"/><path d="M24 24L24.00 46.50L20.40 24.00Z" fill="#F3F7F3" stroke="#19254A" stroke-width=".8" stroke-linejoin="round"/><path d="M24 24L1.50 24.00L24.00 27.60Z" fill="#19254A"/><path d="M24 24L1.50 24.00L24.00 20.40Z" fill="#F3F7F3" stroke="#19254A" stroke-width=".8" stroke-linejoin="round"/>';

/** Compass rose on an orange quatrefoil (the map's bearing control). */
export const COMPASS_ROSE =
  `<svg viewBox="0 0 48 48" aria-hidden="true">` +
  `<path d="${QUATREFOIL}" transform="translate(24 24) scale(.92) translate(-20 -20)" fill="${ORANGE}" stroke="${STEEL}" stroke-width="2.2"/>` +
  `<path d="${QUATREFOIL}" transform="translate(24 24) scale(.74) translate(-20 -20)" fill="none" stroke="${SEA}" stroke-width="1"/>` +
  STAR +
  `<circle cx="24" cy="24" r="1.6" fill="${ORANGE}" stroke="${STEEL}" stroke-width=".6"/>` +
  // "N" on the north arm so the heading reads at a glance
  `<text x="24" y="10.2" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="6.4" fill="${SEA}" stroke="${STEEL}" stroke-width="1.4" paint-order="stroke">N</text>` +
  `</svg>`;

/** Short codes for cross streets, shown in quatrefoil shields on the map. */
export const STREET_CODES: Record<string, string> = {
  "Eglinton Ave W": "EGL",
  "Lawrence Ave W": "LAW",
  "Wilson Ave": "WIL",
  "Hwy 401": "401",
  "Sheppard Ave W": "SHP",
  "Finch Ave W": "FIN",
  "Steeles Ave W": "STL",
  "Centre St": "CTR",
};
