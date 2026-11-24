# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow", "numpy"]
# ///
"""Generate comic-style portraits for the Members section.

Usage: uv run scripts/comic.py
Reads  public/assets/people/*.webp
Writes public/assets/people/comic/<name>.webp   pop-art comic, 3:4: flat colors, halftone shading, ink lines

The site shows the comic at rest and swaps to the real photo on hover/focus.
Re-run after adding or replacing a photo.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

W, H = 480, 640  # 3:4, ~2x the largest displayed size
CELL = 7  # halftone cell in px
COLORS = 7  # flat color fills per portrait
ANGLE = np.deg2rad(45)
PAPER = np.array([247, 246, 242], dtype=np.float32)  # --wall
INK = np.array([17, 17, 17], dtype=np.float32)  # --ink

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public/assets/people"
OUT = SRC / "comic"


def blur(a: np.ndarray, r: float) -> np.ndarray:
    img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    return np.asarray(img.filter(ImageFilter.GaussianBlur(r)), dtype=np.float32)


def comic(img: Image.Image) -> Image.Image:
    img = ImageOps.fit(img.convert("RGB"), (W, H), centering=(0.5, 0.35))
    img = ImageOps.autocontrast(img, cutoff=1)
    # Flatten texture so color quantization gives clean comic fills.
    smooth = img.filter(ImageFilter.MedianFilter(7)).filter(ImageFilter.MedianFilter(5))
    smooth = ImageEnhance.Color(smooth).enhance(1.7)
    smooth = ImageEnhance.Contrast(smooth).enhance(1.15)
    flat = smooth.quantize(colors=COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert("RGB")
    fills = np.asarray(flat, dtype=np.float32)
    # Lift the fills toward paper a little, like printed ink on newsprint.
    fills = fills * 0.88 + PAPER * 0.12

    g = np.asarray(img.convert("L").filter(ImageFilter.MedianFilter(5)), dtype=np.float32)

    # Ink lines: extended difference of Gaussians (XDoG).
    g1, g2 = blur(g, 1.4), blur(g, 1.4 * 1.6)
    lines = (g1 - 0.985 * g2) < -2.2

    tone = blur(g, 1.0) / 255.0  # 0 = dark, 1 = light
    shadow = tone < 0.12
    highlight = tone > 0.9

    # Rotated halftone grid in the shading: dot radius grows with darkness.
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    u = xx * np.cos(ANGLE) + yy * np.sin(ANGLE)
    v = -xx * np.sin(ANGLE) + yy * np.cos(ANGLE)
    du = (u % CELL) - CELL / 2
    dv = (v % CELL) - CELL / 2
    dist = np.sqrt(du * du + dv * dv) / (CELL / 2)
    darkness = np.clip((0.62 - tone) / 0.5, 0, 1)
    dots = dist < darkness * 1.1

    rgb = fills.copy()
    rgb[highlight] = PAPER
    rgb[dots] = rgb[dots] * 0.45  # darker dot of the same ink
    rgb[shadow | lines] = INK
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))


def main() -> None:
    OUT.mkdir(exist_ok=True)
    for src in sorted(SRC.glob("*.webp")):
        out = OUT / f"{src.stem}.webp"
        comic(Image.open(src)).save(out, "WEBP", quality=85, method=6)
        print(f"comic {src.name} -> {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
