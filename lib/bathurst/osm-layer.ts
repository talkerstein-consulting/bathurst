import { BufferAttribute, BufferGeometry, Color, DoubleSide, LineBasicMaterial, LineSegments, Mesh, MeshBasicMaterial, type Material } from "three";
import { bakeCity, gunzip, type BakedCity } from "./map-bake";

/**
 * Loads public/map/bathurst-osm.tcgm.gz and builds the city in the vintage road-map poster style:
 * flat two-tone buildings with ink outlines, flat roads by class, flat parks and water. No lighting:
 * colours are baked per vertex, so the look stays graphic at every zoom.
 * Decoding and triangulation happen in map.worker.ts; this side only wraps the typed arrays in geometry.
 *
 * Map data © OpenStreetMap contributors (ODbL).
 */

export type PosterPalette = {
  roof: Color;
  wallLit: Color;
  wallShade: Color;
  ink: Color;
  roads: Color[]; // by class: 0 local, 1 tertiary, 2 secondary, 3 primary, 4 motorway, 5 link
  park: Color;
  water: Color;
  footprint: Color;
};

/**
 * Fetch on the main thread (so the <link rel=preload> in app/layout.tsx is reused), bake in a worker.
 * lite: phones get flat buildings (no walls, no ink), which is most of the GPU and triangulation cost.
 */
export async function loadCity(url: string, { lite = false, signal }: { lite?: boolean; signal?: AbortSignal } = {}): Promise<BakedCity> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`map file ${url}: ${res.status}`);
  const buf = await res.arrayBuffer(), gz = url.endsWith(".gz");
  if (typeof Worker === "undefined") return bakeCity(gz ? await gunzip(buf) : buf, lite);
  const worker = new Worker(new URL("./map.worker.ts", import.meta.url), { type: "module" });
  try {
    return await new Promise<BakedCity>((resolve, reject) => {
      signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
      worker.onmessage = (e) => (e.data.error ? reject(new Error(e.data.error)) : resolve(e.data.city));
      worker.onerror = (e) => reject(e.error ?? new Error(e.message));
      worker.postMessage({ buf, gz, lite }, [buf]);
    });
  } finally {
    worker.terminate();
  }
}

/** Buildings: flat roofs + two-tone walls (lit / shaded by facing), and one ink-outline line set. */
export function buildBuildings(baked: NonNullable<BakedCity["buildings"]>, pal: PosterPalette) {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(baked.pos, 3));
  g.setAttribute("color", new BufferAttribute(new Float32Array(baked.pos.length), 3));
  g.setIndex(new BufferAttribute(baked.idx, 1));
  g.computeBoundingSphere();
  const mesh = new Mesh(g, new MeshBasicMaterial({ vertexColors: true, side: DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));

  const lg = new BufferGeometry();
  lg.setAttribute("position", new BufferAttribute(baked.ink, 3));
  lg.computeBoundingSphere();
  const lines = new LineSegments(lg, new LineBasicMaterial({ color: pal.ink, transparent: true, opacity: 0.8 }));

  mesh.userData.kind = "buildings";
  lines.userData.kind = "buildings";
  const tones = baked.tone;
  /** Paint (or repaint for another palette) without rebuilding geometry. */
  const recolor = (p: PosterPalette) => {
    const attr = g.getAttribute("color") as BufferAttribute, arr = attr.array as Float32Array;
    const byTone = [p.roof, p.wallLit, p.wallShade];
    for (let i = 0; i < tones.length; i++) { const c = byTone[tones[i]]; arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
    attr.needsUpdate = true;
    (lines.material as LineBasicMaterial).color.copy(p.ink);
  };
  recolor(pal);
  return { mesh, lines, recolor };
}

/** Flat layers: parks, water, flat building footprints, then roads. Painted in order, no depth writes. */
export function buildFlatLayers(baked: BakedCity, pal: PosterPalette, flatMat: (c: Color, o?: number) => Material, nextOrder: () => number) {
  const colour = (kind: string) => kind === "park" ? pal.park : kind === "water" ? pal.water : kind === "blocks" ? pal.footprint : pal.roads[+kind.slice(4)];
  return baked.flats.map(({ kind, pos, idx }) => {
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setIndex(new BufferAttribute(idx, 1));
    g.computeBoundingSphere();
    const m = new Mesh(g, flatMat(colour(kind)));
    m.renderOrder = nextOrder();
    m.userData.kind = kind;
    return m;
  });
}
