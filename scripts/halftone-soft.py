"""Soft halftone after the reference: the photo keeps (some of) its own colour, split-toned toward TCG blue in the
shadows and cream in the highlights, with a fine 45-degree dot screen laid over it as a low-contrast texture.

usage: python -I halftone_soft.py in.png out.webp [size=840|WxH] [cell=3.4] [screen=.2] [tone=.5]
  screen: how much the dot screen darkens (0 none .. 1 full halftone)
  tone:   how far the colour moves to the blue/cream split tone (0 photo .. 1 pure duotone)
"""
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageOps

src, dst = sys.argv[1], sys.argv[2]
arg_size = sys.argv[3] if len(sys.argv) > 3 else "840"
# a single number keeps the square crop this started with; WxH crops to that frame instead
box = tuple(int(n) for n in arg_size.lower().split("x")) if "x" in arg_size.lower() else (int(arg_size),) * 2
cell = float(sys.argv[4]) if len(sys.argv) > 4 else 3.4
screen = float(sys.argv[5]) if len(sys.argv) > 5 else 0.2
tone = float(sys.argv[6]) if len(sys.argv) > 6 else 0.5

INK = np.array([0x19, 0x25, 0x4A], dtype=np.float32) / 255     # --steel
PAPER = np.array([0xED, 0xE5, 0xCB], dtype=np.float32) / 255   # --cream

im = ImageOps.fit(Image.open(src).convert("RGB"), box, Image.LANCZOS)
rgb = np.asarray(im, dtype=np.float32) / 255
lum = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)

# split tone: shadows toward Steel, highlights toward cream, the photo's own colour kept underneath
duo = INK * (1 - lum[..., None]) + PAPER * lum[..., None]
# a softer lift so the shadows stay open (the reference never goes to black)
base = 0.08 + 0.92 * rgb
col = base * (1 - tone) + duo * tone

# the dot screen: AM dots at 45 degrees sized by local darkness, used as a light multiply texture
h, w = lum.shape
yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
a = np.deg2rad(45)
u = (xx * np.cos(a) + yy * np.sin(a)) / cell
v = (-xx * np.sin(a) + yy * np.cos(a)) / cell
du, dv = u - np.floor(u) - 0.5, v - np.floor(v) - 0.5
d = np.sqrt(du * du + dv * dv)
ls = np.asarray(Image.fromarray((lum * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(cell * 0.4)), dtype=np.float32) / 255
r = np.sqrt(np.clip(1 - ls, 0.02, 1) / np.pi)
dots = np.clip((r - d) / (1.1 / cell) + 0.5, 0, 1)        # 1 inside a dot
tex = 1 - screen * dots
col = col * tex[..., None]

# a breath of paper grain
rng = np.random.default_rng(7)
col = np.clip(col + rng.normal(0, 0.015, lum.shape)[..., None], 0, 1)

Image.fromarray((col * 255).astype(np.uint8)).save(dst, quality=80, method=6)
print("wrote", dst)
