/**
 * gen-doc-images — render documentation images from declarative specs.
 *
 * Usage:
 *   pnpm gen-doc-images                    # render all specs
 *   pnpm gen-doc-images edge-polarity      # render a single spec by id
 *
 * Output: docs/images/<id>.png
 *
 * Uses node-canvas for headless Canvas 2D — the same drawScene function the
 * browser uses, so images are guaranteed to match what the app renders.
 */

import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { drawScene } from "../packages/renderer/src/drawScene.ts";
import { IMAGE_SPECS } from "./doc-image-specs.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUT_DIR = resolve(__dirname, "../docs/images");

mkdirSync(OUT_DIR, { recursive: true });

const filter = process.argv[2] ?? null;
const specs = filter ? IMAGE_SPECS.filter((s) => s.id === filter) : IMAGE_SPECS;

if (specs.length === 0) {
  console.error(
    `No spec found with id "${filter}". Available ids:\n` +
      IMAGE_SPECS.map((s) => `  ${s.id}`).join("\n"),
  );
  process.exit(1);
}

const BACKGROUND = "#0f172a"; // slate-900 — matches the app canvas background

let ok = 0;
let fail = 0;

for (const spec of specs) {
  try {
    const { width, height } = spec;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;

    ctx.fillStyle = BACKGROUND;
    (
      ctx as unknown as {
        fillRect: (x: number, y: number, w: number, h: number) => void;
      }
    ).fillRect(0, 0, width, height);

    drawScene(ctx, width, height, spec.graph, spec.sim);

    const outPath = resolve(OUT_DIR, `${spec.id}.png`);
    writeFileSync(
      outPath,
      (canvas as unknown as { toBuffer: (mime: string) => Buffer }).toBuffer(
        "image/png",
      ),
    );
    console.log(`✓  ${spec.id}.png  (${width}×${height})`);
    ok++;
  } catch (err) {
    console.error(`✗  ${spec.id}: ${(err as Error).message}`);
    fail++;
  }
}

console.log(`\n${ok} generated, ${fail} failed → ${OUT_DIR}`);
if (fail > 0) process.exit(1);
