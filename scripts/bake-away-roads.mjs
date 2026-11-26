/**
 * Bake the streets around the away clients: public/map/away-roads.json
 *
 * The baked city (public/map/bathurst-osm.tcgm.gz) and the region tile only cover the GTA, so
 * flying to a client outside it — Montreal, Queens, Smithville, Aventura, George Town — left the
 * map blank apart from the world's coastlines. This pulls the roads and the water around each of
 * those places from OpenStreetMap through Overpass and writes them as polylines in [lon, lat]
 * pairs, which is what lib/bathurst/world.ts's worldLines() takes.
 *
 *   node scripts/bake-away-roads.mjs            # all places
 *   node scripts/bake-away-roads.mjs kidicare   # just one
 *
 * Map data © OpenStreetMap contributors (ODbL), same licence as the rest of the map.
 */
import { writeFile, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

/** Overpass is a shared, often busy service: try the mirrors in turn and back off on 429/504. */
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const OUT = new URL('../public/map/away-roads.json', import.meta.url);

/** id → where to dig. Kept here rather than read from data.ts so the bake is reproducible on its own. */
const PLACES = [
  { id: 'kidicare', lat: 45.54559, lon: -73.65576 },
  { id: 'inspera', lat: 45.54559, lon: -73.65575 },
  { id: 'esthersaadia', lat: 40.7282, lon: -73.7949 },
  { id: 'premierkosher', lat: 43.0939, lon: -79.5487 },
  { id: 'ralphwigs', lat: 25.9565, lon: -80.1392 },
  { id: 'novarrisk', lat: 19.2869, lon: -81.3674 },
];

/** road class, coarse: 0 local, 1 tertiary, 2 secondary, 3 primary, 4 motorway/trunk */
const CLS = {
  motorway: 4, motorway_link: 4, trunk: 4, trunk_link: 4,
  primary: 3, primary_link: 3, secondary: 2, secondary_link: 2,
  tertiary: 1, tertiary_link: 1, residential: 0, unclassified: 0, living_street: 0,
};

const BIG = 3000;    // metres: the through roads, for context
const LOCAL_R = 1400; // metres: the streets around the address itself

const query = (lat, lon) => `[out:json][timeout:90];
(
  way(around:${BIG},${lat},${lon})["highway"~"^(motorway|trunk|primary|secondary|tertiary)(_link)?$"];
  way(around:${LOCAL_R},${lat},${lon})["highway"~"^(residential|unclassified|living_street)$"];
  way(around:${BIG},${lat},${lon})["waterway"~"^(river|canal)$"];
  way(around:${BIG},${lat},${lon})["natural"="coastline"];
  way(around:${BIG},${lat},${lon})["natural"="water"];
);
out geom;`;

const r5 = (n) => Math.round(n * 1e5) / 1e5;

/** drop points closer together than ~8 m: the map never draws them apart */
function thin(geom) {
  const out = [];
  let lx = NaN, ly = NaN;
  for (const g of geom) {
    const x = r5(g.lon), y = r5(g.lat);
    if (out.length && Math.abs(x - lx) < 7e-5 && Math.abs(y - ly) < 7e-5) continue;
    out.push(x, y);
    lx = x; ly = y;
  }
  return out.length >= 4 ? out : null;
}

async function overpass(q) {
  let last;
  for (let attempt = 0; attempt < 6; attempt++) {
    const url = OVERPASS[attempt % OVERPASS.length];
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'tcg-map-baker/1.0' },
        body: new URLSearchParams({ data: q }),
      });
      if (res.ok) return res.json();
      last = new Error(`Overpass ${res.status} ${res.statusText} (${new URL(url).host})`);
    } catch (err) {
      last = err;
    }
    process.stdout.write('retry… ');
    await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
  }
  throw last;
}

async function bake(place) {
  const json = await overpass(query(place.lat, place.lon));
  const roads = [], water = [];
  for (const el of json.elements ?? []) {
    if (el.type !== 'way' || !el.geometry) continue;
    const pts = thin(el.geometry);
    if (!pts) continue;
    const t = el.tags ?? {};
    if (t.highway) roads.push({ c: CLS[t.highway] ?? 0, p: pts });
    else water.push(pts);
  }
  return { id: place.id, lat: place.lat, lon: place.lon, roads, water };
}

const only = process.argv.slice(2);
const wanted = only.length ? PLACES.filter((p) => only.includes(p.id)) : PLACES;

let existing = { places: [] };
try { existing = JSON.parse(await readFile(OUT, 'utf8')); } catch { /* first bake */ }

const out = [...existing.places];
for (const place of wanted) {
  process.stdout.write(`${place.id}… `);
  const baked = await bake(place);
  const at = out.findIndex((p) => p.id === baked.id);
  if (at >= 0) out[at] = baked; else out.push(baked);
  console.log(`${baked.roads.length} roads, ${baked.water.length} water`);
  await new Promise((r) => setTimeout(r, 2000));   // Overpass is a shared public service: one query at a time
}

const text = JSON.stringify({ places: out });
await writeFile(OUT, text);
console.log(`wrote ${OUT.pathname} — ${(text.length / 1024).toFixed(0)} kB, ${(gzipSync(text).length / 1024).toFixed(0)} kB gzipped`);
