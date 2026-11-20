#!/usr/bin/env python3
"""
Repack public/map/bathurst-osm.tcgm.gz (v3, from build-map-data.py) into the smaller v4 layout, in place.

v4 changes only how the same shapes are stored (lib/bathurst/map-bake.ts reads both):
  - shapes are sorted into 100 m serpentine rows, and every ring/line continues its deltas from the
    previous shape's last vertex, so neighbouring houses cost a couple of bytes instead of a fresh origin
  - flat footprints (the far, never-extruded ones): sheds under 40 m² dropped, simplified at 1.5 m, stored at 2 m
  - roads, parks, water: simplified at 0.5 m
3D buildings along Bathurst keep full detail. Header word 6 holds the footprint step (in 0.5 m units).

Usage: python3 scripts/build-map-data.py <overpass-json>... && python3 scripts/repack-map-data.py
"""
import gzip, math, os, struct

PATH = os.path.join(os.path.dirname(__file__), "..", "public", "map", "bathurst-osm.tcgm.gz")
FOOT_MIN_AREA, FOOT_TOL_M, FOOT_STEP = 40.0, 1.5, 4   # FOOT_STEP in 0.5 m units: 4 = 2 m
LINE_TOL = 1                                          # in 0.5 m units

buf = gzip.decompress(open(PATH, "rb").read())
assert buf[:4] == b"TCGM", "not a map file"
version = struct.unpack_from("<H", buf, 4)[0]
assert version == 3, f"expected a v3 file from build-map-data.py, got v{version}"
Q = struct.unpack_from("<f", buf, 8)[0]
counts = struct.unpack_from("<5I", buf, 12)
o = 32

def uv():
    global o
    n = s = 0
    while True:
        b = buf[o]; o += 1; n |= (b & 0x7F) << s; s += 7
        if not b & 0x80: return n

def pts():
    n = uv(); out = []; x = z = 0
    for _ in range(n):
        a, c = uv(), uv(); x += (a >> 1) ^ -(a & 1); z += (c >> 1) ^ -(c & 1); out.append((x, z))
    return out

buildings = [(uv(), pts()) for _ in range(counts[0])]
footprints = [pts() for _ in range(counts[1])]            # stored at 1 m (2 units) in v3
groups = [[(uv(), pts()) for _ in range(counts[g + 2])] for g in range(3)]

def rdp(seq, tol):
    if len(seq) < 3: return seq
    (ax, az), (bx, bz) = seq[0], seq[-1]; dx, dz = bx - ax, bz - az; L = math.hypot(dx, dz) or 1e-9
    i, dmax = 0, -1.0
    for k in range(1, len(seq) - 1):
        d = abs((seq[k][0] - ax) * dz - (seq[k][1] - az) * dx) / L
        if d > dmax: i, dmax = k, d
    if dmax <= tol: return [seq[0], seq[-1]]
    return rdp(seq[:i + 1], tol)[:-1] + rdp(seq[i:], tol)

def rdp_ring(p, tol):
    r = rdp(p + [p[0]], tol)[:-1]
    return r if len(r) >= 3 else p

def dedupe(p): return [v for i, v in enumerate(p) if i == 0 or v != p[i - 1]]
def area(p): return abs(sum(p[i][0] * p[i - 1][1] - p[i - 1][0] * p[i][1] for i in range(len(p)))) / 2

foot = []
for p in footprints:                                      # v3 footprint units are 1 m
    if area(p) < FOOT_MIN_AREA: continue
    s = FOOT_STEP / 2
    q = dedupe([(round(x / s), round(z / s)) for x, z in rdp_ring(p, FOOT_TOL_M)])
    if len(q) >= 3: foot.append(q)
groups = [[(c, rdp_ring(p, LINE_TOL) if g == 1 else rdp(p, LINE_TOL)) for c, p in grp] for g, grp in enumerate(groups)]

def serpentine(items, first, unit):
    row = lambda it: int(first(it)[1] * unit // 100)
    return sorted(items, key=lambda it: (row(it), first(it)[0] * (1 if row(it) % 2 == 0 else -1)))

def enc(n):
    b = bytearray()
    while True:
        x = n & 0x7F; n >>= 7
        if n: b.append(x | 0x80)
        else: b.append(x); return b

zz = lambda n: (n << 1) if n >= 0 else ((-n << 1) - 1)

class Chain:
    def __init__(self): self.x = self.z = 0
    def __call__(self, p):
        b = enc(len(p))
        for x, z in p: b += enc(zz(x - self.x)) + enc(zz(z - self.z)); self.x, self.z = x, z
        return b

out = bytearray(b"TCGM" + struct.pack("<HHf", 4, FOOT_STEP, Q) + struct.pack("<5I", len(buildings), len(foot), *map(len, groups)))
ch = Chain()
for h, p in serpentine(buildings, lambda t: t[1][0], Q): out += enc(h) + ch(p)
ch = Chain()
for p in serpentine(foot, lambda p: p[0], Q * FOOT_STEP): out += ch(p)
for grp in groups:
    ch = Chain()
    for c, p in serpentine(grp, lambda t: t[1][0], Q): out += enc(c) + ch(p)

packed = gzip.compress(bytes(out), 9, mtime=0)
before = os.path.getsize(PATH)
open(PATH, "wb").write(packed)
print(f"v3 {before // 1024} KB -> v4 {len(packed) // 1024} KB ({len(foot)} of {len(footprints)} footprints kept)")
