#!/usr/bin/env node
/**
 * Recompress everything in public/ IN PLACE.
 *
 * Filenames, extensions and formats are never changed, so no import, no <img
 * src>, no CSS url() and no sitemap entry has to be touched. Only the bytes
 * inside each file get smaller.
 *
 * What it does:
 *   - JPEG  -> re-encode at quality 80, progressive, stripped metadata.
 *   - PNG   -> if the image is photographic (thousands of colours stored
 *              losslessly, which is the expensive mistake), quantise to a
 *              256-colour adaptive palette with Floyd-Steinberg dithering.
 *              Flat logos and UI art keep their exact colours.
 *   - Both  -> downscale anything wider/taller than MAX_EDGE (default 1920),
 *              since no layout in this site renders above that.
 *
 * A file is only rewritten when the new version is genuinely smaller.
 * Originals are copied to public-original/ the first time so the change is
 * always reversible.
 *
 * Usage:
 *   node scripts/optimize-images.mjs            # optimise public/
 *   node scripts/optimize-images.mjs --dry-run  # report only, write nothing
 *   node scripts/optimize-images.mjs --restore  # put the originals back
 *
 * Requires Python 3 with Pillow (pip install pillow). If Pillow is missing the
 * script exits cleanly with instructions instead of failing the build.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const script = path.join(here, "optimize-images.py");

if (!existsSync(script)) {
  console.error("Missing scripts/optimize-images.py");
  process.exit(1);
}

const python = process.platform === "win32" ? "python" : "python3";
const probe = spawnSync(python, ["-c", "import PIL"], { stdio: "ignore" });

if (probe.status !== 0) {
  console.log("Pillow is not installed, so images were left untouched.");
  console.log(`Install it with:  ${python} -m pip install pillow`);
  console.log("Then re-run:      npm run optimize:images");
  process.exit(0);
}

const result = spawnSync(python, [script, ...process.argv.slice(2)], {
  cwd: root,
  stdio: "inherit",
});

process.exit(result.status ?? 0);
