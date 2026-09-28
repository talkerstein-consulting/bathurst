import * as THREE from "three";

/**
 * Reads public/map/bathurst-osm.tcgm.gz (baked by scripts/build-map-data.py) and builds the city in the
 * vintage road-map poster style: flat two-tone buildings with ink outlines, flat roads by class, flat
 * parks and water. No lighting: colours are baked per face, so the look stays graphic at every zoom.
 *
 * Map data © OpenStreetMap contributors (ODbL).
 */

export type PosterPalette = {
  roof: THREE.Color;
  wallLit: THREE.Color;
  wallShade: THREE.Color;
  ink: THREE.Color;
  roads: THREE.Color[]; // by class: 0 local, 1 tertiary, 2 secondary, 3 primary, 4 motorway, 5 link
  park: THREE.Color;
  water: THREE.Color;
  footprint: THREE.Color;
};

type Pt = [x: number, z: number];

type MapData = {
  buildings: { pts: Pt[]; h: number }[]; // extruded (near Bathurst)
  footprints: { pts: Pt[] }[]; // flat only (the rest of the frame): cheap to draw, no walls or outlines
  roads: { cls: number; pts: Pt[] }[];
  areas: { cls: number; pts: Pt[] }[];
  lines: { cls: number; pts: Pt[] }[];
};

const ROAD_WIDTH = [7, 11, 14, 18, 30, 8];
const LINE_WIDTH = [5, 14];
const LIGHT = new THREE.Vector2(-0.8, 0.6).normalize(); // light from the south-west, in (x, z)

/** Fetches a baked map file. v3 files are gzipped (see scripts/build-map-data.py) and unpacked in the browser. */
async function fetchPacked(url: string, signal?: AbortSignal): Promise<DataView> {
  const res = await fetch(url, { signal });
  if (!res.ok || !res.body) throw new Error(`map file ${url}: ${res.status}`);
  const stream = url.endsWith(".gz") ? res.body.pipeThrough(new DecompressionStream("gzip")) : res.body;
  return new DataView(await new Response(stream).arrayBuffer());
}

/** Varint + zigzag-delta reader shared by the city and contour files. */
function reader(v: DataView, start: number) {
  let o = start;
  const uv = () => {
    let n = 0, shift = 0, b = 0;
    do { b = v.getUint8(o++); n += (b & 0x7f) * 2 ** shift; shift += 7; } while (b & 0x80);
    return n;
  };
  const sv = () => { const n = uv(); return n % 2 ? -(n + 1) / 2 : n / 2; };
  /** One ring or line: vertex count, then deltas. `unit` is metres per stored step. */
  const pts = (unit: number): Pt[] => {
    const n = uv(), out: Pt[] = new Array(n);
    let x = 0, z = 0;
    for (let i = 0; i < n; i++) { x += sv(); z += sv(); out[i] = [x * unit, z * unit]; }
    return out;
  };
  return { uv, pts };
}

export async function loadMapData(url: string, signal?: AbortSignal): Promise<MapData> {
  const v = await fetchPacked(url, signal);
  if (String.fromCharCode(v.getUint8(0), v.getUint8(1), v.getUint8(2), v.getUint8(3)) !== "TCGM" || v.getUint16(4, true) !== 3) throw new Error("bad map file");
  const q = v.getFloat32(8, true);
  const counts = Array.from({ length: 5 }, (_, i) => v.getUint32(12 + i * 4, true));
  const r = reader(v, 32);
  const buildings: MapData["buildings"] = [];
  for (let i = 0; i < counts[0]; i++) { const h = r.uv() / 10; buildings.push({ pts: r.pts(q), h }); }
  const footprints: MapData["footprints"] = [];
  for (let i = 0; i < counts[1]; i++) footprints.push({ pts: r.pts(q * 2) }); // footprints are stored at 1 m
  const groups: { cls: number; pts: Pt[] }[][] = [[], [], []];
  for (let g = 0; g < 3; g++) for (let i = 0; i < counts[g + 2]; i++) { const cls = r.uv(); groups[g].push({ cls, pts: r.pts(q) }); }
  return { buildings, footprints, roads: groups[0], areas: groups[1], lines: groups[2] };
}

/** Buildings: flat roofs + two-tone walls (lit / shaded by facing), and one ink-outline line set. */
export function buildBuildings(data: MapData, pal: PosterPalette, { maxBuildings = Infinity } = {}) {
  const pos: number[] = [], col: number[] = [], idx: number[] = [], ink: number[] = [], tone: number[] = []; // tone: 0 roof, 1 lit wall, 2 shaded wall
  const list = data.buildings.slice(0, maxBuildings);
  for (const b of list) {
    let contour = b.pts.map(([x, z]) => new THREE.Vector2(x, z));
    if (THREE.ShapeUtils.isClockWise(contour)) contour = contour.reverse();
    const n = contour.length, h = b.h;

    // roof
    const base = pos.length / 3;
    for (const p of contour) { pos.push(p.x, h, p.y); col.push(pal.roof.r, pal.roof.g, pal.roof.b); tone.push(0); }
    for (const t of THREE.ShapeUtils.triangulateShape(contour.slice(), [])) idx.push(base + t[0], base + t[1], base + t[2]);

    // walls
    for (let i = 0; i < n; i++) {
      const a = contour[i], c = contour[(i + 1) % n];
      const dx = c.x - a.x, dz = c.y - a.y, len = Math.hypot(dx, dz) || 1;
      const lit = (dz / len) * LIGHT.x - (dx / len) * LIGHT.y > 0; // outward normal (dz, -dx) for CCW rings
      const k = lit ? pal.wallLit : pal.wallShade;
      const w = pos.length / 3;
      pos.push(a.x, 0, a.y, c.x, 0, c.y, c.x, h, c.y, a.x, h, a.y);
      for (let j = 0; j < 4; j++) { col.push(k.r, k.g, k.b); tone.push(lit ? 1 : 2); }
      idx.push(w, w + 1, w + 2, w, w + 2, w + 3);
      // ink: roof edge, plus the corner line on anything taller than a house
      ink.push(a.x, h, a.y, c.x, h, c.y);
      if (h > 9) ink.push(a.x, 0, a.y, a.x, h, a.y);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));

  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.Float32BufferAttribute(ink, 3));
  lg.computeBoundingSphere();
  const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: pal.ink, transparent: true, opacity: 0.8 }));

  mesh.userData.kind = "buildings";
  lines.userData.kind = "buildings";
  const tones = Uint8Array.from(tone);
  /** Repaint for another palette without rebuilding geometry. */
  const recolor = (p: PosterPalette) => {
    const attr = g.getAttribute("color") as THREE.BufferAttribute, arr = attr.array as Float32Array;
    const byTone = [p.roof, p.wallLit, p.wallShade];
    for (let i = 0; i < tones.length; i++) { const c = byTone[tones[i]]; arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
    attr.needsUpdate = true;
    (lines.material as THREE.LineBasicMaterial).color.copy(p.ink);
  };
  return { mesh, lines, recolor, count: list.length };
}

/** Flat layers: parks, water, flat building footprints, then roads. Painted in order, no depth writes. */
export function buildFlatLayers(data: MapData, pal: PosterPalette, flatMat: (c: THREE.Color, o?: number) => THREE.Material, nextOrder: () => number) {
  const out: THREE.Mesh[] = [];

  const polys = (items: { pts: Pt[] }[], color: THREE.Color, y: number, kind: string) => {
    const pos: number[] = [], idx: number[] = [];
    for (const a of items) {
      let contour = a.pts.map(([x, z]) => new THREE.Vector2(x, z));
      if (THREE.ShapeUtils.isClockWise(contour)) contour = contour.reverse();
      const base = pos.length / 3;
      for (const p of contour) pos.push(p.x, y, p.y);
      for (const t of THREE.ShapeUtils.triangulateShape(contour.slice(), [])) idx.push(base + t[0], base + t[1], base + t[2]);
    }
    return mesh(pos, idx, color, kind);
  };

  const strokes = (items: { pts: Pt[] }[], width: number, color: THREE.Color, y: number, kind: string) => {
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
    return mesh(pos, idx, color, kind);
  };

  const mesh = (pos: number[], idx: number[], color: THREE.Color, kind: string) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, flatMat(color));
    m.renderOrder = nextOrder();
    m.userData.kind = kind;
    out.push(m);
    return m;
  };

  polys(data.areas.filter((a) => a.cls === 0), pal.park, 0.02, "park");
  polys(data.areas.filter((a) => a.cls === 1), pal.water, 0.03, "water");
  for (const cls of [0, 1]) strokes(data.lines.filter((l) => l.cls === cls), LINE_WIDTH[cls], pal.water, 0.04, "water");
  if (data.footprints.length) polys(data.footprints, pal.footprint, 0.045, "blocks");
  for (const cls of [0, 5, 1, 2, 3, 4]) strokes(data.roads.filter((r) => r.cls === cls), ROAD_WIDTH[cls], pal.roads[cls], 0.05, `road${cls}`);
  return out;
}

/**
 * Topographic contours (public/map/bathurst-topo.tcgt.gz, baked by scripts/build-topo.py): fine engraved lines
 * that fill the land beyond the city data. Minor contours every 5 m, index contours every 25 m.
 * Elevation: AWS Terrain Tiles (sources include NRCan CDEM).
 */
export async function loadTopo(url: string, signal?: AbortSignal) {
  const v = await fetchPacked(url, signal);
  if (String.fromCharCode(v.getUint8(0), v.getUint8(1), v.getUint8(2), v.getUint8(3)) !== "TCGT" || v.getUint16(4, true) !== 2) throw new Error("bad topo file");
  const q = v.getFloat32(8, true), index = v.getUint16(14, true), count = v.getUint32(16, true);
  const minor: number[] = [], major: number[] = [];
  const r = reader(v, 20);
  for (let i = 0; i < count; i++) {
    const level = r.uv(), line = r.pts(q);
    const into = level % index === 0 ? major : minor;
    for (let k = 1; k < line.length; k++) into.push(line[k - 1][0], 0.01, line[k - 1][1], line[k][0], 0.01, line[k][1]);
  }
  const make = (arr: number[], kind: string) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    g.computeBoundingSphere();
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ transparent: true, depthWrite: false }));
    l.userData.kind = kind;
    return l;
  };
  return { minor: make(minor, "topo"), major: make(major, "topo-index") };
}
