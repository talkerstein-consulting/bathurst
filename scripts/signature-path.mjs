// "Built for what's next." as one SVG outline: node scripts/signature-path.mjs
//
// This replaced a traced-centreline approach, which thinned the letterforms to a one-pixel skeleton and had a
// simulated nib redraw them. That made the weight of every stroke a guess: thin enough to look clean and the
// letters broke up, heavy enough to hold together and they smudged. The font already contains the right
// letterforms at the right weight — so take them as they are.
//
// Output: lib/bathurst/signature-path.json, read by components/bathurst/SignatureLine.tsx, which reveals the path
// left to right so it still writes itself on.
import { readFileSync, writeFileSync } from "node:fs";
import { decompress } from "wawoff2";
import opentype from "opentype.js";

const TEXT = "Built for what’s next.";
const EM = 1000;        // the size the outline is taken at; the viewBox is normalised below, so this is only precision
const PAD = 8;          // a little room so the finest strokes are not clipped by the box

const ttf = await decompress(readFileSync("app/fonts/SlowlySignature.woff2"));
const font = opentype.parse(Uint8Array.from(ttf).buffer);

const path = font.getPath(TEXT, 0, 0, EM);
const { x1, y1, x2, y2 } = path.getBoundingBox();

// move the drawing to the origin and give it a round number of units across, so the component can set it in any box
const w = x2 - x1 + PAD * 2, h = y2 - y1 + PAD * 2;
// opentype has no transform on the path data itself, so shift the glyph commands before serialising
for (const c of path.commands) {
  for (const k of ["x", "y", "x1", "y1", "x2", "y2"]) {
    if (typeof c[k] === "number") c[k] = k.startsWith("x") ? c[k] - x1 + PAD : c[k] - y1 + PAD;
  }
}

writeFileSync("lib/bathurst/signature-path.json", JSON.stringify({
  d: path.toPathData(2),
  w: +w.toFixed(1),
  h: +h.toFixed(1),
  text: TEXT,
}));
const d = path.toPathData(2);
console.log(`${TEXT}: one outline, ${d.length} chars, box ${w.toFixed(0)}×${h.toFixed(0)}`);
