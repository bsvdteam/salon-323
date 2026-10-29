// The pass images, read once from disk. The `new URL(..., import.meta.url)`
// pattern lets Next's file tracing bundle these PNGs into the server output.
// Regenerate them with: node scripts/gen-pass-assets.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SCALES = ["", "@2x", "@3x"] as const;
const DESIGNS = 3; // strip-0 Mist · strip-1 Ember · strip-2 Moos (cardStyles)

let cached: Record<string, Buffer> | null = null;

function load(): Record<string, Buffer> {
  if (cached) return cached;
  const names = [
    ...SCALES.flatMap((s) => [`icon${s}.png`, `logo${s}.png`]),
    ...Array.from({ length: DESIGNS }, (_, d) =>
      SCALES.map((s) => `strip-${d}${s}.png`),
    ).flat(),
  ];
  const out: Record<string, Buffer> = {};
  for (const f of names)
    out[f] = readFileSync(
      fileURLToPath(new URL(`./assets/${f}`, import.meta.url)),
    );
  cached = out;
  return out;
}

/** { "icon.png": <Buffer>, "strip@2x.png": … } for PKPass — the strip is the
 *  member's card design (0–2), so the Wallet face matches the dashboard card. */
export function passImages(design: number): Record<string, Buffer> {
  const all = load();
  const d = design >= 0 && design < DESIGNS ? design : 0;
  const out: Record<string, Buffer> = {};
  for (const s of SCALES) {
    out[`icon${s}.png`] = all[`icon${s}.png`];
    out[`logo${s}.png`] = all[`logo${s}.png`];
    out[`strip${s}.png`] = all[`strip-${d}${s}.png`];
  }
  return out;
}
