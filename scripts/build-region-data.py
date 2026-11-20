#!/usr/bin/env python3
"""
Bake the light regional backdrop into public/map/region-osm.tcgm.gz: the wider GTA around the Bathurst
corridor (Mississauga to Unionville), so pins far off Bathurst still sit on a map.

Only big roads (secondary and up), water and large green areas; no buildings. Anything the detailed
corridor file (build-map-data.py) already draws is skipped. Stored at 2 m (Q = 2) in the chained v4
layout, so lib/bathurst/map-bake.ts reads it unchanged. The engine loads it after the main city.

Input: Overpass JSON (`out tags geom`) for bbox 43.59,-79.68,43.91,-79.28.
Map data © OpenStreetMap contributors, ODbL 1.0.

Usage: python3 scripts/build-region-data.py <overpass-json>
"""
import gzip, json, math, os, struct, sys

Q = 2.0
ROAD_CLASS = {"secondary": 2, "primary": 3, "trunk": 3, "motorway": 4, "motorway_link": 5}
AREA_CLASS = {"park": 0, "golf_course": 0, "cemetery": 0, "water": 1}
MIN_AREA = 40000  # m²: small parks vanish at regional zoom
O_LAT, O_LON, KX, KZ = 43.7196, -79.4296, 80300.0, 111000.0
LINE0 = [((lon - O_LON) * KX, -(lat - O_LAT) * KZ) for lat, lon in [(43.6980,-79.4232),(43.7057,-79.4254),(43.71833,-79.42920),(43.7225,-79.43089),(43.72678,-79.43129),
         (43.7288,-79.43177),(43.7340,-79.4336),(43.74678,-79.43666),(43.7545,-79.4390),(43.7765,-79.4435),(43.7906,-79.4452),(43.79896,-79.44632),(43.8120,-79.4500)]]
Z_SOUTH, Z_NORTH = -(43.700 - O_LAT) * KZ, -(43.812 - O_LAT) * KZ

def x_at(z):
    for (ax, az), (bx, bz) in zip(LINE0, LINE0[1:]):
        if bz <= z <= az: return ax + (bx - ax) * (z - az) / (bz - az)
    return LINE0[0][0] if z > LINE0[0][1] else LINE0[-1][0]
def in_main(x, z, half=4000): return Z_NORTH - 200 <= z <= Z_SOUTH + 200 and abs(x - x_at(z)) <= half
def xz(p): return ((p["lon"] - O_LON) * KX, -(p["lat"] - O_LAT) * KZ)

def rdp(seq, tol):
    if len(seq) < 3: return seq
    (ax, az), (bx, bz) = seq[0], seq[-1]; dx, dz = bx - ax, bz - az; L = math.hypot(dx, dz) or 1e-9
    i, dmax = 0, -1.0
    for k in range(1, len(seq) - 1):
        d = abs((seq[k][0] - ax) * dz - (seq[k][1] - az) * dx) / L
        if d > dmax: i, dmax = k, d
    if dmax <= tol: return [seq[0], seq[-1]]
    return rdp(seq[:i + 1], tol)[:-1] + rdp(seq[i:], tol)
def area(p): return abs(sum(p[i][0] * p[i - 1][1] - p[i - 1][0] * p[i][1] for i in range(len(p)))) / 2
def quant(p): 
    q = [(round(x / Q), round(z / Q)) for x, z in p]
    return [v for i, v in enumerate(q) if i == 0 or v != q[i - 1]]

roads, areas, lines, seen = [], [], [], set()
for el in json.load(open(sys.argv[1]))["elements"]:
    if el.get("type") != "way" or el["id"] in seen: continue
    seen.add(el["id"]); t = el.get("tags", {}); pts = [xz(p) for p in el.get("geometry", []) if p]
    if len(pts) < 2: continue
    if t.get("highway") in ROAD_CLASS:
        if all(in_main(x, z) for x, z in pts): continue
        q = quant(rdp(pts, 5.0))
        if len(q) >= 2: roads.append((ROAD_CLASS[t["highway"]], q))
    elif t.get("waterway") == "river":
        if all(in_main(x, z, 5500) for x, z in pts): continue
        q = quant(rdp(pts, 4.0))
        if len(q) >= 2: lines.append((1, q))
    else:
        cls = AREA_CLASS.get(t.get("leisure") or t.get("landuse") or t.get("natural"))
        if cls is None or len(pts) < 3: continue
        if pts[0] == pts[-1]: pts = pts[:-1]
        if len(pts) < 3 or area(pts) < MIN_AREA: continue
        cx = sum(p[0] for p in pts) / len(pts); cz = sum(p[1] for p in pts) / len(pts)
        if in_main(cx, cz, 5500): continue
        r = rdp(pts + [pts[0]], 5.0)[:-1]; q = quant(r if len(r) >= 3 else pts)
        if len(q) >= 3: areas.append((cls, q))

def uv(n):
    b = bytearray()
    while True:
        x = n & 0x7F; n >>= 7
        if n: b.append(x | 0x80)
        else: b.append(x); return bytes(b)
zz = lambda n: (n << 1) if n >= 0 else ((-n << 1) - 1)
class Chain:   # v4: each shape continues its deltas from the previous shape's last vertex
    def __init__(self): self.x = self.z = 0
    def __call__(self, q):
        b = bytearray(uv(len(q)))
        for x, z in q: b += uv(zz(x - self.x)) + uv(zz(z - self.z)); self.x, self.z = x, z
        return b
def serpentine(grp):   # 500 m rows, alternating direction, so neighbouring shapes chain with small deltas
    row = lambda t: int(t[1][0][1] * Q // 500)
    return sorted(grp, key=lambda t: (row(t), t[1][0][0] * (1 if row(t) % 2 == 0 else -1)))

out = bytearray(b"TCGM" + struct.pack("<HHf", 4, 1, Q) + struct.pack("<5I", 0, 0, len(roads), len(areas), len(lines)))
for grp in (roads, areas, lines):
    ch = Chain()
    for c, q in serpentine(grp): out += uv(c) + ch(q)
packed = gzip.compress(bytes(out), 9, mtime=0)
dest = os.path.join(os.path.dirname(__file__), "..", "public", "map", "region-osm.tcgm.gz")
open(dest, "wb").write(packed)
print(json.dumps({"roads": len(roads), "areas": len(areas), "lines": len(lines), "bytes": len(packed)}))
