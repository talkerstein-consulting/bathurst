import { ShapeUtils, Vector2 } from "three";

/**
 * Pure decode + triangulation for public/map/bathurst-osm.tcgm.gz (baked by scripts/build-map-data.py).
 * No scene objects here: it runs inside map.worker.ts so the heavy loop never blocks scrolling,
 * and returns flat typed arrays the main thread wraps in BufferGeometry (osm-layer.ts).
 *
 * Map data © OpenStreetMap contributors (ODbL).
 */

type Pt = [x: number, z: number];

export type MapData = {
  buildings: { pts: Pt[]; h: number }[]; // extruded (near Bathurst)
  footprints: { pts: Pt[] }[]; // flat only (the rest of the frame): cheap to draw, no walls or outlines
  roads: { cls: number; pts: Pt[] }[];
  areas: { cls: number; pts: Pt[] }[];
  lines: { cls: number; pts: Pt[] }[];
};

/** One flat layer, in paint order. kind: park | water | blocks | road0..road5 */
export type FlatLayer = { kind: string; pos: Float32Array; idx: Uint32Array };
/** tone per vertex: 0 roof, 1 lit wall, 2 shaded wall (coloured on the main thread, so palettes swap without a rebake) */
export type BakedBuildings = { pos: Float32Array; idx: Uint32Array; tone: Uint8Array; ink: Float32Array };
export type BakedCity = { roads: MapData["roads"]; flats: FlatLayer[]; buildings: BakedBuildings | null };

const ROAD_WIDTH = [7, 11, 14, 18, 30, 8];
const LINE_WIDTH = [5, 14];
const LIGHT = (() => { const x = -0.8, y = 0.6, l = Math.hypot(x, y); return { x: x / l, y: y / l }; })(); // from the south-west, in (x, z)

export async function gunzip(buf: ArrayBuffer): Promise<ArrayBuffer> {
  const stream = new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}

/**
 * Varint + zigzag-delta reader for the packed city file. v3: each ring's deltas start from 0,0.
 * v4 (scripts/repack-map-data.py): each ring continues from the previous ring's last vertex; reset() starts a new section.
 */
function reader(v: DataView, start: number, chained: boolean) {
  let o = start, x = 0, z = 0;
  const uv = () => {
    let n = 0, shift = 0, b = 0;
    do { b = v.getUint8(o++); n += (b & 0x7f) * 2 ** shift; shift += 7; } while (b & 0x80);
    return n;
  };
  const sv = () => { const n = uv(); return n % 2 ? -(n + 1) / 2 : n / 2; };
  /** One ring or line: vertex count, then deltas. `unit` is metres per stored step. */
  const pts = (unit: number): Pt[] => {
    const n = uv(), out: Pt[] = new Array(n);
    if (!chained) x = z = 0;
    for (let i = 0; i < n; i++) { x += sv(); z += sv(); out[i] = [x * unit, z * unit]; }
    return out;
  };
  const reset = () => { x = z = 0; };
  return { uv, pts, reset };
}

export function decodeMap(buf: ArrayBuffer): MapData {
  const v = new DataView(buf);
  const version = v.getUint16(4, true);
  if (String.fromCharCode(v.getUint8(0), v.getUint8(1), v.getUint8(2), v.getUint8(3)) !== "TCGM" || (version !== 3 && version !== 4)) throw new Error("bad map file");
  const q = v.getFloat32(8, true), footStep = version === 4 ? v.getUint16(6, true) : 2; // footprint step in 0.5 m units (v3: 1 m)
  const counts = Array.from({ length: 5 }, (_, i) => v.getUint32(12 + i * 4, true));
  const r = reader(v, 32, version === 4);
  const buildings: MapData["buildings"] = [];
  for (let i = 0; i < counts[0]; i++) { const h = r.uv() / 10; buildings.push({ pts: r.pts(q), h }); }
  r.reset();
  const footprints: MapData["footprints"] = [];
  for (let i = 0; i < counts[1]; i++) footprints.push({ pts: r.pts(q * footStep) });
  const groups: { cls: number; pts: Pt[] }[][] = [[], [], []];
  for (let g = 0; g < 3; g++) { r.reset(); for (let i = 0; i < counts[g + 2]; i++) { const cls = r.uv(); groups[g].push({ cls, pts: r.pts(q) }); } }
  return { buildings, footprints, roads: groups[0], areas: groups[1], lines: groups[2] };
}

const ring = (pts: Pt[]) => {
  const c = pts.map(([x, y]) => new Vector2(x, y));
  return ShapeUtils.isClockWise(c) ? c.reverse() : c;
};

function bakeBuildings(list: MapData["buildings"]): BakedBuildings {
  const pos: number[] = [], idx: number[] = [], ink: number[] = [], tone: number[] = [];
  for (const b of list) {
    const contour = ring(b.pts), n = contour.length, h = b.h;
    const base = pos.length / 3;
    for (const p of contour) { pos.push(p.x, h, p.y); tone.push(0); }
    for (const t of ShapeUtils.triangulateShape(contour.slice(), [])) idx.push(base + t[0], base + t[1], base + t[2]);
    for (let i = 0; i < n; i++) {
      const a = contour[i], c = contour[(i + 1) % n];
      const dx = c.x - a.x, dz = c.y - a.y, len = Math.hypot(dx, dz) || 1;
      const lit = (dz / len) * LIGHT.x - (dx / len) * LIGHT.y > 0; // outward normal (dz, -dx) for CCW rings
      const w = pos.length / 3;
      pos.push(a.x, 0, a.y, c.x, 0, c.y, c.x, h, c.y, a.x, h, a.y);
      for (let j = 0; j < 4; j++) tone.push(lit ? 1 : 2);
      idx.push(w, w + 1, w + 2, w, w + 2, w + 3);
      // ink: roof edge, plus the corner line on anything taller than a house
      ink.push(a.x, h, a.y, c.x, h, c.y);
      if (h > 9) ink.push(a.x, 0, a.y, a.x, h, a.y);
    }
  }
  return { pos: Float32Array.from(pos), idx: Uint32Array.from(idx), tone: Uint8Array.from(tone), ink: Float32Array.from(ink) };
}

function bakeFlats(data: MapData, flatBuildings: boolean): FlatLayer[] {
  const out: FlatLayer[] = [];
  const push = (kind: string, pos: number[], idx: number[]) => out.push({ kind, pos: Float32Array.from(pos), idx: Uint32Array.from(idx) });

  const polys = (items: { pts: Pt[] }[], y: number, kind: string) => {
    const pos: number[] = [], idx: number[] = [];
    for (const a of items) {
      const contour = ring(a.pts), base = pos.length / 3;
      for (const p of contour) pos.push(p.x, y, p.y);
      for (const t of ShapeUtils.triangulateShape(contour.slice(), [])) idx.push(base + t[0], base + t[1], base + t[2]);
    }
    push(kind, pos, idx);
  };

  const strokes = (items: { pts: Pt[] }[], width: number, y: number, kind: string) => {
    const pos: number[] = [], idx: number[] = [];
    const hw = width / 2;
    for (const l of items) {
      for (let i = 0; i < l.pts.length - 1; i++) {
        const [ax, az] = l.pts[i], [bx, bz] = l.pts[i + 1];
        const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
        if (len < 0.01) continue;
        // extend each quad by half a width so consecutive segments overlap into clean joints
        const ux = dx / len, uz = dz / len, nx = -uz * hw, nz = ux * hw, ex = ux * hw, ez = uz * hw;
        const b = pos.length / 3;
        pos.push(ax - ex + nx, y, az - ez + nz, ax - ex - nx, y, az - ez - nz, bx + ex - nx, y, bz + ez - nz, bx + ex + nx, y, bz + ez + nz);
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
      }
    }
    push(kind, pos, idx);
  };

  polys(data.areas.filter((a) => a.cls === 0), 0.02, "park");
  polys(data.areas.filter((a) => a.cls === 1), 0.03, "water");
  for (const cls of [0, 1]) strokes(data.lines.filter((l) => l.cls === cls), LINE_WIDTH[cls], 0.04, "water");
  // lite (phones): the extruded buildings join the flat footprints instead of getting walls and ink
  const blocks = flatBuildings ? [...data.footprints, ...data.buildings] : data.footprints;
  if (blocks.length) polys(blocks, 0.045, "blocks");
  for (const cls of [0, 5, 1, 2, 3, 4]) strokes(data.roads.filter((r) => r.cls === cls), ROAD_WIDTH[cls], 0.05, `road${cls}`);
  return out;
}

export function bakeCity(buf: ArrayBuffer, lite: boolean): BakedCity {
  const data = decodeMap(buf);
  return { roads: data.roads, flats: bakeFlats(data, lite), buildings: lite || !data.buildings.length ? null : bakeBuildings(data.buildings) };
}

/** Every typed-array buffer in a baked city, so postMessage can move them instead of copying. */
export function transferables(c: BakedCity): ArrayBuffer[] {
  const out: ArrayBuffer[] = [];
  for (const f of c.flats) out.push(f.pos.buffer as ArrayBuffer, f.idx.buffer as ArrayBuffer);
  if (c.buildings) for (const a of [c.buildings.pos, c.buildings.idx, c.buildings.tone, c.buildings.ink]) out.push(a.buffer as ArrayBuffer);
  return out;
}
