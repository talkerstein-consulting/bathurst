#!/usr/bin/env python3
"""
Bake topographic contour lines around the Bathurst corridor into public/map/bathurst-topo.tcgt.gz.

Elevation: AWS Terrain Tiles (terrarium PNG, zoom 12, ~30 m cells). Sources include Natural Resources
Canada CDEM; attribution is shown in the map's fine print.

Contours every 5 m (index contour every 25 m), traced with marching squares, stitched into polylines,
simplified, and written in the engine's local frame (metres from Bathurst & Lawrence, 2 m quantised).

Usage: python3 scripts/build-topo.py <tile-cache-dir>
"""
import io, math, os, struct, sys, urllib.request
import numpy as np
from PIL import Image

O_LAT, O_LON = 43.7196, -79.4296
KX, KZ = 80300.0, 111000.0
Z = 12
BBOX = (43.60, -79.62, 43.92, -79.24)   # south, west, north, east (~ ±15 km)
STEP = 5          # metres between contours
INDEX = 25        # every 25 m is an index contour
QUANT = 2.0       # metres per int16 unit
SIMPLIFY = 9.0    # metres, Ramer-Douglas-Peucker

cache = sys.argv[1] if len(sys.argv) > 1 else "/tmp/terrarium"
os.makedirs(cache, exist_ok=True)

def tile_xy(lat, lon):
    n = 2 ** Z
    x = (lon + 180) / 360 * n
    y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
    return x, y

x0, y0 = tile_xy(BBOX[2], BBOX[1]); x1, y1 = tile_xy(BBOX[0], BBOX[3])
tx0, ty0, tx1, ty1 = int(x0), int(y0), int(x1), int(y1)
W, H = (tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256
elev = np.zeros((H, W), dtype=np.float32)
for ty in range(ty0, ty1 + 1):
    for tx in range(tx0, tx1 + 1):
        path = os.path.join(cache, f"{Z}_{tx}_{ty}.png")
        if not os.path.exists(path):
            url = f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{tx}/{ty}.png"
            urllib.request.urlretrieve(url, path)
        a = np.asarray(Image.open(path).convert("RGB"), dtype=np.float32)
        e = a[..., 0] * 256 + a[..., 1] + a[..., 2] / 256 - 32768
        elev[(ty - ty0) * 256:(ty - ty0 + 1) * 256, (tx - tx0) * 256:(tx - tx0 + 1) * 256] = e

# Lake Ontario reads as ~74 m; clamp noise below the shoreline so the lake stays empty
elev = np.maximum(elev, 74.0)
# gentle smoothing (two box-blur passes) so contours read as drawn lines, not pixel stairs
def blur(a, r=2):
    k = 2 * r + 1
    p = np.pad(a, r, mode="edge")
    c = np.cumsum(np.cumsum(p, 0), 1)
    c = np.pad(c, ((1, 0), (1, 0)))
    return (c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]) / (k * k)
elev = blur(blur(elev))

def grid_to_xz(gx, gy):
    n = 2 ** Z
    lon = (tx0 + gx / 256) / n * 360 - 180
    lat = math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * (ty0 + gy / 256) / n))))
    return (lon - O_LON) * KX, -(lat - O_LAT) * KZ

# marching squares: per level, find crossing cells with numpy, then emit segments
def contour(level):
    a = elev
    tl, tr, br, bl = a[:-1, :-1], a[:-1, 1:], a[1:, 1:], a[1:, :-1]
    case = (tl > level) * 8 + (tr > level) * 4 + (br > level) * 2 + (bl > level) * 1
    ys, xs = np.nonzero((case > 0) & (case < 15))
    segs = []
    def lerp(p, q, vp, vq):
        t = (level - vp) / (vq - vp) if vq != vp else 0.5
        return (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)
    for y, x in zip(ys.tolist(), xs.tolist()):
        c = int(case[y, x]); v = (float(tl[y, x]), float(tr[y, x]), float(br[y, x]), float(bl[y, x]))
        P = [(x, y), (x + 1, y), (x + 1, y + 1), (x, y + 1)]
        e = {  # edge midpoints: top, right, bottom, left
            "t": lambda: lerp(P[0], P[1], v[0], v[1]), "r": lambda: lerp(P[1], P[2], v[1], v[2]),
            "b": lambda: lerp(P[3], P[2], v[3], v[2]), "l": lambda: lerp(P[0], P[3], v[0], v[3]),
        }
        table = {1: ["lb"], 2: ["br"], 3: ["lr"], 4: ["tr"], 5: ["lt", "br"], 6: ["tb"], 7: ["lt"], 8: ["lt"],
                 9: ["tb"], 10: ["tr", "lb"], 11: ["tr"], 12: ["lr"], 13: ["br"], 14: ["lb"]}
        for pair in table[c]:
            segs.append((e[pair[0]](), e[pair[1]]()))
    return segs

def stitch(segs):
    key = lambda p: (round(p[0], 3), round(p[1], 3))
    ends = {}
    for i, (a, b) in enumerate(segs):
        ends.setdefault(key(a), []).append((i, 0)); ends.setdefault(key(b), []).append((i, 1))
    used = [False] * len(segs); lines = []
    for i in range(len(segs)):
        if used[i]: continue
        used[i] = True; line = [segs[i][0], segs[i][1]]
        for direction in (1, 0):
            while True:
                tip = line[-1] if direction else line[0]
                nxt = None
                for j, side in ends.get(key(tip), []):
                    if not used[j]: nxt = (j, side); break
                if not nxt: break
                j, side = nxt; used[j] = True
                other = segs[j][1 - side]
                if direction: line.append(other)
                else: line.insert(0, other)
        lines.append(line)
    return lines

def rdp(pts, tol):
    if len(pts) < 3: return pts
    (ax, az), (bx, bz) = pts[0], pts[-1]
    dx, dz = bx - ax, bz - az; L = math.hypot(dx, dz) or 1e-9
    i, dmax = 0, -1.0
    for k in range(1, len(pts) - 1):
        d = abs((pts[k][0] - ax) * dz - (pts[k][1] - az) * dx) / L
        if d > dmax: i, dmax = k, d
    if dmax <= tol: return [pts[0], pts[-1]]
    return rdp(pts[:i + 1], tol)[:-1] + rdp(pts[i:], tol)

lo, hi = int(math.ceil((elev.min() + 0.5) / STEP) * STEP), int(elev.max())
records = []
for level in range(lo, hi + 1, STEP):
    for line in stitch(contour(level)):
        pts = [grid_to_xz(gx, gy) for gx, gy in line]
        if len(pts) < 2: continue
        length = sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(pts, pts[1:]))
        if length < 120: continue  # drop specks
        pts = rdp(pts, SIMPLIFY)
        q = [(max(-32767, min(32767, round(x / QUANT))), max(-32767, min(32767, round(z / QUANT)))) for x, z in pts]
        records.append((level, q))

# v2: varint zigzag deltas per line (see build-map-data.py), gzipped
def uv(n):
    b = bytearray()
    while True:
        byte = n & 0x7F; n >>= 7
        if n: b.append(byte | 0x80)
        else: b.append(byte); return bytes(b)
def zz(n): return (n << 1) if n >= 0 else ((-n << 1) - 1)
out = bytearray(b"TCGT" + struct.pack("<HHfHHI", 2, 0, QUANT, STEP, INDEX, len(records)))
for level, q in records:
    out += uv(level) + uv(len(q)); px = pz = 0
    for x, z in q:
        out += uv(zz(x - px)) + uv(zz(z - pz)); px, pz = x, z
import gzip
out = gzip.compress(bytes(out), 9, mtime=0)
dest = os.path.join(os.path.dirname(__file__), "..", "public", "map", "bathurst-topo.tcgt.gz")
open(dest, "wb").write(out)
print({"levels": f"{lo}-{hi} m", "lines": len(records), "vertices": sum(len(q) for _, q in records), "bytes": len(out), "grid": f"{W}x{H}"})
