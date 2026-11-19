"""Generate dithered portraits for the People section.

Usage: python3 scripts/dither.py
Reads  public/assets/people/*.webp
Writes public/assets/people/dither/<name>.png       1-bit Atkinson, white on black (shown at rest)
       public/assets/people/dither/<name>-ansi.png  16-color ANSI terminal palette, chunky (shown on hover/focus)
The site scales both with `image-rendering: pixelated`.
"""

from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

MONO_SIZE = 240
ANSI_SIZE = 120  # half resolution: bigger pixels read as "terminal"
MONO_GAMMA = 1.4  # >1 darkens midtones so bright backgrounds become sparse dots
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public/assets/people"
OUT = SRC / "dither"

# Classic 16-color ANSI terminal palette (normal + bright).
ANSI16 = [
    (0, 0, 0), (205, 49, 49), (13, 188, 121), (229, 229, 16),
    (36, 114, 200), (188, 63, 188), (17, 168, 205), (229, 229, 229),
    (102, 102, 102), (241, 76, 76), (35, 209, 139), (245, 245, 67),
    (59, 142, 234), (214, 112, 214), (41, 184, 219), (255, 255, 255),
]


def prepare(img: Image.Image, size: int) -> Image.Image:
    img = ImageOps.fit(img, (size, size), centering=(0.5, 0.35))
    img = ImageOps.autocontrast(img, cutoff=1)
    return img.filter(ImageFilter.UnsharpMask(radius=1.5, percent=100, threshold=2))


def atkinson(img: Image.Image) -> Image.Image:
    w, h = img.size
    px = [float(v) for v in img.tobytes()]
    for y in range(h):
        for x in range(w):
            i = y * w + x
            old = px[i]
            new = 255.0 if old >= 128 else 0.0
            px[i] = new
            err = (old - new) / 8
            for dx, dy in ((1, 0), (2, 0), (-1, 1), (0, 1), (1, 1), (0, 2)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and ny < h:
                    px[ny * w + nx] += err
    out = Image.new("1", (w, h))
    out.putdata([255 if v >= 128 else 0 for v in px])
    return out


def ansi_palette() -> Image.Image:
    pal = Image.new("P", (1, 1))
    flat = [c for rgb in ANSI16 for c in rgb]
    pal.putpalette(flat + [0] * (768 - len(flat)))
    return pal


def main() -> None:
    OUT.mkdir(exist_ok=True)
    pal = ansi_palette()
    for src in sorted(SRC.glob("*.webp")):
        img = Image.open(src).convert("RGB")

        mono = prepare(img, MONO_SIZE).convert("L")
        mono = mono.point(lambda v: round(255 * (v / 255) ** MONO_GAMMA))
        atkinson(mono).save(OUT / f"{src.stem}.png", optimize=True)

        color = prepare(img, ANSI_SIZE).quantize(palette=pal, dither=Image.Dither.FLOYDSTEINBERG)
        color.save(OUT / f"{src.stem}-ansi.png", optimize=True)
        print(f"dithered {src.name}")


if __name__ == "__main__":
    main()
