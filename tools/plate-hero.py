"""Fit a 16:9 render into the hero's 16:10 plate with a guaranteed empty top band.

The intake bar ends 20.7% down the plate and the navy wash reaches 34%, so content
must start below ~28%. The model never clears more than ~17% on its own, so the band
is extended here: sample the flat cream at the top of the render, pad upward with it,
and trim the bottom to land back on 16:10.
"""
import sys, os
from PIL import Image

TARGET_W, TARGET_H = 1760, 1100          # 16:10
SAFE = 0.28                              # content starts no higher than this

def top_band(im):
    """First row where the flat cream ends.

    Tolerant by design: a handful of stray dark pixels (a print-grain speck, a
    nick at the canvas edge) must not report a band of zero. A row only counts
    as content once more than 1% of the sampled pixels depart from the cream.
    """
    w, h = im.size; px = im.load()
    base = px[w // 2, 2]
    xs = range(0, w, 8)
    for y in range(0, h, 4):
        off = sum(1 for x in xs
                  if max(abs(px[x, y][c] - base[c]) for c in range(3)) > 18)
        if off > max(2, len(list(xs)) // 100):
            return y
    return h


def plate(src, dst):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    base = im.load()[w // 2, 2]
    t = top_band(im)

    final_h = round(w * TARGET_H / TARGET_W)        # 16:10 at this width
    want = round(SAFE * final_h)                    # where content should start
    pad = max(0, want - t)

    if pad:
        if t >= 24:
            # stretch the render's own cream band upward: keeps the canvas tooth and
            # the slight tone falloff, so there is no seam where old meets new
            band = im.crop((0, 0, w, t)).resize((w, t + pad), Image.LANCZOS)
            canvas = Image.new("RGB", (w, h + pad), base)
            canvas.paste(band, (0, 0))
            canvas.paste(im.crop((0, t, w, h)), (0, t + pad))
        else:
            canvas = Image.new("RGB", (w, h + pad), base)
            canvas.paste(im, (0, pad))
    else:
        canvas = im
    canvas = canvas.crop((0, 0, w, final_h))        # trim the bottom back to 16:10
    canvas = canvas.resize((TARGET_W, TARGET_H), Image.LANCZOS)
    canvas.save(dst, "WEBP", quality=88, method=6)
    return t / h, pad / (h + pad), os.path.getsize(dst) // 1024

if __name__ == "__main__":
    src_dir, dst_dir = sys.argv[1], sys.argv[2]
    os.makedirs(dst_dir, exist_ok=True)
    for f in sorted(os.listdir(src_dir)):
        if not f.endswith(".png"): continue
        was, added, kb = plate(os.path.join(src_dir, f),
                               os.path.join(dst_dir, f[:-4] + ".webp"))
        print(f"{f[:-4]:<13} band {was*100:4.1f}% -> {SAFE*100:.0f}%  (+{added*100:.1f}% cream)  {kb}KB")
