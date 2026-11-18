// "Built for what's next." turned into pen strokes: node scripts/trace-signature.mjs
// The React Bits Signature component (components/signature.tsx) animates a nib along point paths, not type, so the line has
// to arrive as strokes. These are the letters themselves, not their edges: the words are rasterised from
// app/fonts/SlowlySignature.woff2 (wawoff2 → opentype.js), the shapes are thinned to a one-pixel skeleton (Zhang-Suen), and
// the skeleton is walked into strokes — the path a pen takes down the middle of each letter. The nib puts the weight back
// on, so the written line reads as the font rather than as an outline of it; the suggested nib is printed at the end.
// Output: lib/bathurst/signature-strokes.json, read by components/bathurst/SignatureLine.tsx.
import { readFileSync, writeFileSync } from "node:fs";
import { decompress } from "wawoff2";
import opentype from "opentype.js";

const TEXT = "Built for what’s next.";
const EM = 1000;            // em size the outlines are taken at
const PX = 0.14;            // raster scale (font units → pixels): the script's strokes land a few pixels thick, which thins cleanly
const TOL = 6;              // curve flattening tolerance, in font units, before rasterising
const SPUR = 4;             // skeleton branches shorter than this many pixels are thinning artefacts at corners, not strokes
const SIMPLIFY = 0.6;       // how far (px) a kept point may sit from the line it replaces
const JOIN = 2.4;           // fragments whose ends meet within this many pixels and keep going the same way are one stroke
const WIDE = 560;           // the written line is handed over this wide. The pen's speed, nib and ease-in are all measured in
                            // these units, so the scale sets how long the line takes to write and how heavy the nib looks.

const ttf = await decompress(readFileSync("app/fonts/SlowlySignature.woff2"));
const font = opentype.parse(Uint8Array.from(ttf).buffer);

/* ---------- 1. the glyph outlines as polygons (opentype hands back SVG-space coordinates, y down) ---------- */
const polys = [];
let poly = null;
let cx = 0, cy = 0;
const add = (x, y) => poly.push([x, y]);
const curve = (pt, n) => { for (let i = 1; i <= n; i++) add(...pt(i / n)); };
const seg = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
for (const c of font.getPath(TEXT, 0, 0, EM).commands) {
  if (c.type === "M") { if (poly?.length > 2) polys.push(poly); poly = [[c.x, c.y]]; cx = c.x; cy = c.y; }
  else if (c.type === "L") { add(c.x, c.y); cx = c.x; cy = c.y; }
  else if (c.type === "Q") {
    const n = Math.max(2, Math.ceil((seg([cx, cy], [c.x1, c.y1]) + seg([c.x1, c.y1], [c.x, c.y])) / TOL));
    curve((t) => { const u = 1 - t; return [u * u * cx + 2 * u * t * c.x1 + t * t * c.x, u * u * cy + 2 * u * t * c.y1 + t * t * c.y]; }, n);
    cx = c.x; cy = c.y;
  } else if (c.type === "C") {
    const n = Math.max(2, Math.ceil((seg([cx, cy], [c.x1, c.y1]) + seg([c.x1, c.y1], [c.x2, c.y2]) + seg([c.x2, c.y2], [c.x, c.y])) / TOL));
    curve((t) => { const u = 1 - t; return [
      u * u * u * cx + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t * t * t * c.x,
      u * u * u * cy + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t * t * t * c.y]; }, n);
    cx = c.x; cy = c.y;
  } else if (c.type === "Z") { if (poly?.length > 2) polys.push(poly); poly = null; }
}
if (poly?.length > 2) polys.push(poly);

/* ---------- 2. rasterise them (nonzero winding, the way the font renderer fills) ---------- */
const all = polys.flat();
const minX = Math.min(...all.map((p) => p[0])), minY = Math.min(...all.map((p) => p[1]));
const W = Math.ceil((Math.max(...all.map((p) => p[0])) - minX) * PX) + 4;
const H = Math.ceil((Math.max(...all.map((p) => p[1])) - minY) * PX) + 4;
const at = (x, y) => y * W + x;
const grid = new Uint8Array(W * H);
const edges = [];
for (const ring of polys) for (let i = 0; i < ring.length; i++) {
  const a = ring[i], b = ring[(i + 1) % ring.length];
  const ay = (a[1] - minY) * PX + 2, by = (b[1] - minY) * PX + 2;
  if (ay !== by) edges.push({ ax: (a[0] - minX) * PX + 2, ay, bx: (b[0] - minX) * PX + 2, by, dir: by > ay ? 1 : -1 });
}
for (let y = 0; y < H; y++) {
  const sy = y + 0.5, hits = [];
  for (const e of edges) {
    if (sy < Math.min(e.ay, e.by) || sy >= Math.max(e.ay, e.by)) continue;
    hits.push({ x: e.ax + ((sy - e.ay) / (e.by - e.ay)) * (e.bx - e.ax), dir: e.dir });
  }
  hits.sort((p, q) => p.x - q.x);
  let wind = 0, from = null;
  for (const h of hits) {
    const was = wind; wind += h.dir;
    if (was === 0 && wind !== 0) from = h.x;
    else if (was !== 0 && wind === 0 && from !== null) {
      for (let x = Math.max(0, Math.round(from)); x <= Math.min(W - 1, Math.round(h.x)); x++) grid[at(x, y)] = 1;
      from = null;
    }
  }
}
const filled = grid.reduce((s, v) => s + v, 0);

/* ---------- 3. thin to a one-pixel skeleton (Zhang-Suen) ---------- */
const ring8 = (x, y) => [grid[at(x, y - 1)], grid[at(x + 1, y - 1)], grid[at(x + 1, y)], grid[at(x + 1, y + 1)],
                         grid[at(x, y + 1)], grid[at(x - 1, y + 1)], grid[at(x - 1, y)], grid[at(x - 1, y - 1)]];
for (let pass = 0; pass < 300; pass++) {
  let changed = false;
  for (const step of [0, 1]) {
    const kill = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (!grid[at(x, y)]) continue;
      const p = ring8(x, y), b = p.reduce((s, v) => s + v, 0);
      if (b < 2 || b > 6) continue;
      let a = 0;
      for (let i = 0; i < 8; i++) if (!p[i] && p[(i + 1) % 8]) a++;
      if (a !== 1) continue;
      const [n, e, s, w] = [p[0], p[2], p[4], p[6]];
      if (step === 0 ? (n && e && s) || (e && s && w) : (n && e && w) || (n && s && w)) continue;
      kill.push(at(x, y));
    }
    if (kill.length) { changed = true; for (const i of kill) grid[i] = 0; }
  }
  if (!changed) break;
}

/* ---------- 4. walk the skeleton into strokes ---------- */
const nbrs = (x, y) => {
  const out = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if ((!dx && !dy) || x + dx < 1 || y + dy < 1 || x + dx >= W - 1 || y + dy >= H - 1) continue;
    if (grid[at(x + dx, y + dy)]) out.push([x + dx, y + dy]);
  }
  return out;
};
const pix = [];
const degree = new Map();
for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (grid[at(x, y)]) { pix.push([x, y]); degree.set(at(x, y), nbrs(x, y).length); }
const seen = new Uint8Array(W * H);
const walk = (sx, sy) => {
  const path = [[sx, sy]];
  let x = sx, y = sy;
  seen[at(x, y)] = 1;
  for (;;) {
    const open = nbrs(x, y).filter(([nx, ny]) => !seen[at(nx, ny)]);
    if (!open.length) break;
    // keep going as straight as the skeleton allows, so a crossing does not throw the pen sideways
    const prev = path[path.length - 2];
    const pick = prev ? open.reduce((best, c) => {
      const score = (p) => (p[0] - x) * (x - prev[0]) + (p[1] - y) * (y - prev[1]);
      return score(c) > score(best) ? c : best;
    }) : open[0];
    [x, y] = pick;
    seen[at(x, y)] = 1;
    path.push([x, y]);
    if ((degree.get(at(x, y)) ?? 0) > 2) break;     // a junction ends the stroke; the next one starts from it
  }
  return path;
};
const raw = [];
for (const [x, y] of pix) if ((degree.get(at(x, y)) ?? 0) === 1 && !seen[at(x, y)]) raw.push(walk(x, y));
for (const [x, y] of pix) if ((degree.get(at(x, y)) ?? 0) > 2 && !seen[at(x, y)]) raw.push(walk(x, y));
for (const [x, y] of pix) if (!seen[at(x, y)]) raw.push(walk(x, y));   // closed loops (o, e, the dot of an i)

const len = (p) => p.reduce((s, q, i) => (i ? s + Math.hypot(q[0] - p[i - 1][0], q[1] - p[i - 1][1]) : 0), 0);
// a short run is a thinning artefact only when it hangs off a junction; on its own it is a real mark (a dot, the period)
const loose = (p) => (degree.get(at(p[0][0], p[0][1])) ?? 0) <= 2 && (degree.get(at(p[p.length - 1][0], p[p.length - 1][1])) ?? 0) <= 2;
let kept = raw.filter((p) => p.length > 1 && (len(p) >= SPUR || loose(p)));

// the walk stops at every junction, which would hand the pen a letter in pieces. Put the pieces back together: a fragment
// that starts where another ended and carries on in the same direction is the same stroke of the pen.
const dirOf = (p, head) => {
  const a = head ? p[Math.min(3, p.length - 1)] : p[Math.max(0, p.length - 4)];
  const b = head ? p[0] : p[p.length - 1];
  return Math.atan2(b[1] - a[1], b[0] - a[0]);
};
const turn = (u, v) => { let d = Math.abs(u - v); if (d > Math.PI) d = Math.PI * 2 - d; return d; };
for (let again = true; again; ) {
  again = false;
  outer:
  for (let i = 0; i < kept.length; i++) {
    const a = kept[i], tail = a[a.length - 1], outDir = dirOf(a, false);
    for (let j = 0; j < kept.length; j++) {
      if (i === j) continue;
      const b = kept[j];
      for (const asHead of [true, false]) {
        const end = asHead ? b[0] : b[b.length - 1];
        if (Math.hypot(end[0] - tail[0], end[1] - tail[1]) > JOIN) continue;
        const inDir = asHead ? dirOf(b, true) + Math.PI : dirOf(b, false);
        if (turn(outDir, inDir + (asHead ? Math.PI : 0)) > Math.PI / 2.2) continue;
        kept[i] = a.concat(asHead ? b : [...b].reverse());
        kept.splice(j, 1);
        again = true;
        break outer;
      }
    }
  }
}
kept = kept.filter((p) => p.length > 1);

/* ---------- 5. simplify, order left to right, normalise ---------- */
const rdp = (pts, eps) => {
  if (pts.length < 3) return pts;
  const a = pts[0], b = pts[pts.length - 1];
  let far = -1, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / l;
    if (d > far) { far = d; idx = i; }
  }
  return far > eps ? [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)] : [a, b];
};
const strokes = kept.map((p) => rdp(p, SIMPLIFY)).filter((p) => p.length > 1);
strokes.sort((a, b) => Math.min(...a.map((p) => p[0])) - Math.min(...b.map((p) => p[0])));

const xs = strokes.flat().map((p) => p[0]), ys = strokes.flat().map((p) => p[1]);
const x0 = Math.min(...xs), y0 = Math.min(...ys), k = WIDE / (Math.max(...xs) - x0);
// flat ([x, y, x, y, …]) so the file the page downloads stays small
const out = strokes.map((p) => p.flatMap(([x, y]) => [+((x - x0) * k).toFixed(1), +((y - y0) * k).toFixed(1)]));
writeFileSync("lib/bathurst/signature-strokes.json", JSON.stringify(out));

// the font's own stroke weight: filled pixels over skeleton length, carried into the handed-over units. The component's
// nib is 9.6 × its `thickness` prop, so that is the number to give it.
const skeleton = strokes.reduce((s, p) => s + len(p), 0);
const nib = (filled / Math.max(1, skeleton)) * k;
console.log(`${TEXT}: ${out.length} strokes, ${xs.length} points, box ${WIDE}×${Math.round((Math.max(...ys) - y0) * k)}`);
console.log(`pen weight: nib ≈ ${nib.toFixed(1)} units → thickness={${(nib / 9.6).toFixed(2)}} in SignatureLine.tsx`);
