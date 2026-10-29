// The pass images, read once from disk. The `new URL(..., import.meta.url)`
// pattern lets Next's file tracing bundle these PNGs into the server output.
// Regenerate them with: node scripts/gen-pass-assets.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const FILES = [
  "icon.png",
  "icon@2x.png",
  "icon@3x.png",
  "logo.png",
  "logo@2x.png",
  "logo@3x.png",
] as const;

let cached: Record<string, Buffer> | null = null;

/** { "icon.png": <Buffer>, ... } for PKPass.addBuffer — loaded once per process. */
export function passImages(): Record<string, Buffer> {
  if (cached) return cached;
  const out: Record<string, Buffer> = {};
  for (const f of FILES) {
    out[f] = readFileSync(fileURLToPath(new URL(`./assets/${f}`, import.meta.url)));
  }
  cached = out;
  return out;
}
