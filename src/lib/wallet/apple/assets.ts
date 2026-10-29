// The pass images, read once from disk. They are bundled into the wallet
// route's serverless function via outputFileTracingIncludes (next.config.ts)
// and read from the project root — on Vercel process.cwd() is the function's
// root with the same relative paths. (A `new URL(…, import.meta.url)` with a
// template path got rewritten by the bundler and served one wrong file.)
// Regenerate them with: node scripts/gen-pass-assets.mjs
import { readFileSync } from "node:fs";
import { join } from "node:path";

const DIR = join(process.cwd(), "src/lib/wallet/apple/assets");

const SCALES = ["", "@2x", "@3x"] as const;
const DESIGNS = 3; // 0 Mist · 1 Ember · 2 Moos (cardStyles)
// poster art is only shipped @2x/@3x — no @1x iPhone exists, saves ~200 KB
const HIRES = ["@2x", "@3x"] as const;

let cached: Record<string, Buffer> | null = null;

function load(): Record<string, Buffer> {
  if (cached) return cached;
  const names = [
    ...SCALES.flatMap((s) => [
      `icon${s}.png`,
      `logo${s}.png`,
      `primaryLogo${s}.png`,
    ]),
    ...Array.from({ length: DESIGNS }, (_, d) => [
      ...SCALES.map((s) => `strip-${d}${s}.png`),
      ...HIRES.map((s) => `artwork-${d}${s}.png`),
    ]).flat(),
  ];
  const out: Record<string, Buffer> = {};
  for (const f of names) out[f] = readFileSync(join(DIR, f));
  cached = out;
  return out;
}

/** { "icon.png": <Buffer>, "artwork@2x.png": … } for PKPass — strip (storeCard)
 *  and artwork (posterGeneric) are the member's card design (0–2), so the
 *  Wallet face matches the dashboard card. */
export function passImages(design: number): Record<string, Buffer> {
  const all = load();
  const d = design >= 0 && design < DESIGNS ? design : 0;
  const out: Record<string, Buffer> = {};
  for (const s of SCALES) {
    out[`icon${s}.png`] = all[`icon${s}.png`];
    out[`logo${s}.png`] = all[`logo${s}.png`];
    out[`primaryLogo${s}.png`] = all[`primaryLogo${s}.png`];
    out[`strip${s}.png`] = all[`strip-${d}${s}.png`];
  }
  for (const s of HIRES) out[`artwork${s}.png`] = all[`artwork-${d}${s}.png`];
  return out;
}
