#!/usr/bin/env python3
"""In-place recompression of public/ assets. Called by optimize-images.mjs.

Never renames a file and never changes its format. See the header comment in
scripts/optimize-images.mjs for the full rationale.
"""
from __future__ import annotations

import io
import os
import shutil
import sys

from PIL import Image

PUBLIC = "public"
BACKUP = "public-original"
MAX_EDGE = 1920
JPEG_QUALITY = 80
PALETTE_COLORS = 256

# Below this many distinct colours the image is flat art (logo, icon, banner
# with text). Those are already cheap as PNG and quantising them risks visible
# edge artefacts, so they are only re-deflated, never re-palettised.
FLAT_ART_COLOR_LIMIT = 4096

Image.MAX_IMAGE_PIXELS = None


def human(n: int) -> str:
    return f"{n / 1024:.0f} KB" if n < 1024 * 1024 else f"{n / 1048576:.2f} MB"


def downscale(im: Image.Image) -> Image.Image:
    w, h = im.size
    if max(w, h) <= MAX_EDGE:
        return im
    scale = MAX_EDGE / max(w, h)
    return im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)


def encode_jpeg(im: Image.Image) -> bytes:
    if im.mode not in ("RGB", "L"):
        im = im.convert("RGB")
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
    return buf.getvalue()


def encode_png(im: Image.Image) -> bytes:
    colors = im.getcolors(maxcolors=FLAT_ART_COLOR_LIMIT)
    best: bytes | None = None

    # Always try a plain re-deflate first -- lossless, safe for every image.
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True, compress_level=9)
    best = buf.getvalue()

    # Photographic PNG (getcolors returned None => more colours than the limit).
    # This is the case that costs megabytes, so give it a palette.
    if colors is None:
        source = im if im.mode in ("RGB", "RGBA") else im.convert("RGBA")
        quantized = source.quantize(
            colors=PALETTE_COLORS,
            method=Image.FASTOCTREE,
            dither=Image.FLOYDSTEINBERG,
        )
        buf = io.BytesIO()
        quantized.save(buf, "PNG", optimize=True, compress_level=9)
        candidate = buf.getvalue()
        if len(candidate) < len(best):
            best = candidate

    return best


def process(path: str, dry_run: bool) -> tuple[int, int]:
    before = os.path.getsize(path)
    ext = os.path.splitext(path)[1].lower()

    try:
        with Image.open(path) as opened:
            opened.load()
            im = downscale(opened)
            data = encode_jpeg(im) if ext in (".jpg", ".jpeg") else encode_png(im)
    except Exception as exc:  # a corrupt or exotic file is simply left alone
        print(f"  skip  {path}  ({exc})")
        return before, before

    if len(data) >= before:
        return before, before

    if not dry_run:
        backup = os.path.join(BACKUP, os.path.relpath(path, PUBLIC))
        if not os.path.exists(backup):
            os.makedirs(os.path.dirname(backup), exist_ok=True)
            shutil.copy2(path, backup)
        with open(path, "wb") as fh:
            fh.write(data)

    saved = before - len(data)
    print(f"  {human(before):>9} -> {human(len(data)):>9}  (-{100 * saved / before:2.0f}%)  {path}")
    return before, len(data)


def restore() -> int:
    if not os.path.isdir(BACKUP):
        print(f"Nothing to restore: {BACKUP}/ does not exist.")
        return 1
    count = 0
    for root, _dirs, files in os.walk(BACKUP):
        for name in files:
            src = os.path.join(root, name)
            dst = os.path.join(PUBLIC, os.path.relpath(src, BACKUP))
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
            count += 1
    print(f"Restored {count} original file(s) into {PUBLIC}/.")
    return 0


def main() -> int:
    args = sys.argv[1:]
    if "--restore" in args:
        return restore()

    dry_run = "--dry-run" in args

    if not os.path.isdir(PUBLIC):
        print(f"No {PUBLIC}/ directory here -- run this from the project root.")
        return 1

    targets = []
    for root, _dirs, files in os.walk(PUBLIC):
        for name in files:
            if name.lower().endswith((".png", ".jpg", ".jpeg")):
                targets.append(os.path.join(root, name))
    targets.sort(key=os.path.getsize, reverse=True)

    print(f"{'Dry run: ' if dry_run else ''}optimising {len(targets)} image(s) in {PUBLIC}/\n")

    total_before = total_after = 0
    for path in targets:
        before, after = process(path, dry_run)
        total_before += before
        total_after += after

    saved = total_before - total_after
    pct = (100 * saved / total_before) if total_before else 0
    print(f"\n  total  {human(total_before)} -> {human(total_after)}   saved {human(saved)} ({pct:.0f}%)")
    if not dry_run and saved:
        print(f"  originals kept in {BACKUP}/  (npm run optimize:images -- --restore)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
