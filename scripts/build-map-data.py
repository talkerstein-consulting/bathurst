#!/usr/bin/env python3
"""
Bake OpenStreetMap data for the Bathurst Street corridor into public/map/bathurst-osm.tcgm.gz.

Input:  Overpass JSON files (`out tags geom`) for buildings, roads, parks, water.
Output: a small binary the map engine streams in (see lib/bathurst/osm-layer.ts for the reader).

Coordinates use the engine's local frame: metres from Bathurst & Lawrence,
x = east, z = south (north is -z), quantised to 0.5 m in int16.

Map data © OpenStreetMap contributors, ODbL 1.0. Attribution is shown on the map.

Usage: python3 scripts/build-map-data.py <overpass-json>... > report
"""
import json, struct, sys, math, os

O_LAT, O_LON = 43.7196, -79.4296
KX, KZ = 80300.0, 111000.0
Q = 0.5  # metres per unit

def to_xz(lat, lon):
    return ((lon - O_LON) * KX, -(lat - O_LAT) * KZ)

# Bathurst centreline (same control points as the engine) for the corridor filter
LINE0 = [to_xz(*p) for p in [(43.6980,-79.4232),(43.7057,-79.4254),(43.71833,-79.42920),(43.7225,-79.43089),(43.72678,-79.43129),
         (43.7288,-79.43177),(43.7340,-79.4336),(43.74678,-79.43666),(43.7545,-79.4390),(43.7765,-79.4435),(43.7906,-79.4452),
         (43.79896,-79.44632),(43.8120,-79.4500)]]

def x_at(z):
    for (ax, az), (bx, bz) in zip(LINE0, LINE0[1:]):
        if bz <= z <= az:
            return ax + (bx - ax) * (z - az) / (bz - az)
    return LINE0[0][0] if z > LINE0[0][1] else LINE0[-1][0]

Z_SOUTH, Z_NORTH = to_xz(43.700, 0)[1], to_xz(43.812, 0)[1]
BUILDING_HALF_WIDTH = 560     # extruded 3D buildings: metres either side of Bathurst (where the camera flies)
FOOTPRINT_HALF_WIDTH = 4000   # flat footprints fill the rest of the frame (low memory: no walls, no outlines)
CONTEXT_HALF_WIDTH = 4000     # roads / parks / water

def in_corridor(x, z, half):
    return Z_NORTH - 200 <= z <= Z_SOUTH + 200 and abs(x - x_at(z)) <= half

ROAD_CLASS = {
    "residential": 0, "unclassified": 0, "living_street": 0,
    "tertiary": 1, "secondary": 2, "primary": 3, "trunk": 3,
    "motorway": 4, "motorway_link": 5, "primary_link": 5, "secondary_link": 5,
}
AREA_CLASS = {"park": 0, "golf_course": 0, "cemetery": 0, "water": 1}
LINE_CLASS = {"stream": 0, "river": 1}

def height_of(tags):
    for key in ("height", "building:height"):
        v = tags.get(key)
        if v:
            try:
                return max(2.5, min(250.0, float(v.replace("m", "").strip().split(";")[0])))
            except ValueError:
                pass
    lv = tags.get("building:levels")
    if lv:
        try:
            return max(2.5, min(250.0, float(lv.split(";")[0]) * 3.2 + 1.0))
        except ValueError:
            pass
    kind = tags.get("building", "yes")
    return {"garage": 3.0, "garages": 3.0, "shed": 3.0, "roof": 4.0, "carport": 3.0,
            "house": 7.5, "detached": 7.5, "semidetached_house": 7.5, "terrace": 8.0, "residential": 8.0,
            "apartments": 18.0, "commercial": 7.0, "retail": 6.0, "school": 9.0, "synagogue": 10.0,
            "church": 12.0, "industrial": 8.0, "hospital": 20.0, "office": 15.0}.get(kind, 7.0)

def quantise(pts):
    out = []
    for x, z in pts:
        qx, qz = round(x / Q), round(z / Q)
        if not (-32767 <= qx <= 32767 and -32767 <= qz <= 32767):
            return None
        if out and out[-1] == (qx, qz):
            continue
        out.append((qx, qz))
    return out

def simplify(pts, tol=1.0):
    # Ramer-Douglas-Peucker on a closed ring (footprints only: they are drawn flat and small)
    if len(pts) <= 4: return pts
    def rdp(seq):
        if len(seq) < 3: return seq
        (ax, az), (bx, bz) = seq[0], seq[-1]
        dx, dz = bx - ax, bz - az; L = math.hypot(dx, dz) or 1e-9
        i, dmax = 0, -1.0
        for k in range(1, len(seq) - 1):
            d = abs((seq[k][0] - ax) * dz - (seq[k][1] - az) * dx) / L
            if d > dmax: i, dmax = k, d
        if dmax <= tol: return [seq[0], seq[-1]]
        return rdp(seq[:i + 1])[:-1] + rdp(seq[i:])
    out = rdp(pts + [pts[0]])[:-1]
    return out if len(out) >= 3 else pts

def ring(way):
    pts = [to_xz(p["lat"], p["lon"]) for p in way.get("geometry", []) if p]
    if len(pts) > 1 and pts[0] == pts[-1]:
        pts = pts[:-1]
    return pts

buildings, footprints, roads, areas, lines = [], [], [], [], []
seen = set()
for path in sys.argv[1:]:
    data = json.load(open(path))
    for el in data.get("elements", []):
        if el.get("type") != "way" or el["id"] in seen:
            continue
        seen.add(el["id"])
        tags = el.get("tags", {})
        pts = ring(el)
        if len(pts) < 2:
            continue
        cx = sum(p[0] for p in pts) / len(pts); cz = sum(p[1] for p in pts) / len(pts)
        if "building" in tags:
            if len(pts) < 3:
                continue
            if in_corridor(cx, cz, BUILDING_HALF_WIDTH):
                q = quantise(pts)
                if q and len(q) >= 3:
                    buildings.append((q, height_of(tags)))
            elif in_corridor(cx, cz, FOOTPRINT_HALF_WIDTH):
                q = quantise(simplify(pts))
                if q and len(q) >= 3:
                    footprints.append(q)
        elif tags.get("highway") in ROAD_CLASS:
            keep = [p for p in pts if in_corridor(p[0], p[1], CONTEXT_HALF_WIDTH)]
            if len(keep) >= 2:
                q = quantise(pts)
                if q and len(q) >= 2:
                    roads.append((ROAD_CLASS[tags["highway"]], q))
        elif tags.get("waterway") in LINE_CLASS:
            q = quantise(pts)
            if q and len(q) >= 2 and in_corridor(cx, cz, CONTEXT_HALF_WIDTH + 1500):
                lines.append((LINE_CLASS[tags["waterway"]], q))
        else:
            cls = AREA_CLASS.get(tags.get("leisure") or tags.get("landuse") or tags.get("natural"))
            if cls is not None and len(pts) >= 3 and in_corridor(cx, cz, CONTEXT_HALF_WIDTH + 1500):
                q = quantise(pts)
                if q and len(q) >= 3:
                    areas.append((cls, q))

# v3: every number is a varint; each ring/line is its vertex count then zigzag deltas from the previous
# vertex (the first from 0,0). Small deltas compress well, and the whole file is gzipped (the browser
# unpacks it with DecompressionStream), so it ships at a fraction of the fixed-width v2 size.
def uv(n):
    b = bytearray()
    while True:
        byte = n & 0x7F; n >>= 7
        if n: b.append(byte | 0x80)
        else: b.append(byte); return bytes(b)
def zz(n): return (n << 1) if n >= 0 else ((-n << 1) - 1)
def pts_bytes(q, step=1):
    # step 2 stores a ring at 1 m instead of 0.5 m (flat footprints: nobody sees half a metre from up there)
    q = [(round(x / step), round(z / step)) for x, z in q]
    q = [p for i, p in enumerate(q) if i == 0 or p != q[i - 1]]
    b = bytearray(uv(len(q))); px = pz = 0
    for x, z in q:
        b += uv(zz(x - px)) + uv(zz(z - pz)); px, pz = x, z
    return b

out = bytearray()
out += b"TCGM" + struct.pack("<HHf", 3, 0, Q)
out += struct.pack("<IIIII", len(buildings), len(footprints), len(roads), len(areas), len(lines))
for q, h in buildings:
    out += uv(int(round(h * 10))) + pts_bytes(q)
for q in footprints:
    out += pts_bytes(q, 2)
for group in (roads, areas, lines):
    for cls, q in group:
        out += uv(cls) + pts_bytes(q)
raw_len = len(out)
import gzip
out = gzip.compress(bytes(out), 9, mtime=0)
dest = os.path.join(os.path.dirname(__file__), "..", "public", "map", "bathurst-osm.tcgm.gz")
os.makedirs(os.path.dirname(dest), exist_ok=True)
open(dest, "wb").write(out)
hs = sorted(h for _, h in buildings)
print(json.dumps({
    "buildings": len(buildings), "footprints": len(footprints), "footprint_vertices": sum(len(q) for q in footprints), "roads": len(roads), "areas": len(areas), "lines": len(lines),
    "bytes": len(out), "raw_bytes": raw_len, "tallest_m": hs[-1] if hs else 0, "median_m": hs[len(hs)//2] if hs else 0,
    "vertices": sum(len(q) for q, _ in buildings),
}, indent=1))
