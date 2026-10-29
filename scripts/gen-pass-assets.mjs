// One-off generator for the Apple Wallet pass images. Run once; the PNGs are
// committed and used at runtime — sharp is only a devDependency, never bundled.
//
//   node scripts/gen-pass-assets.mjs
//
// Apple needs, at minimum, icon.png (+ @2x/@3x). We also ship a logo wordmark
// shown top-left on the card. Sizes follow Apple's point→pixel table:
//   icon  29×29  (@2x 58, @3x 87)      logo  up to 160×50 (@2x 320×100, @3x 480×150)
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "../src/lib/wallet/apple/assets");
mkdirSync(OUT, { recursive: true });

const INK = "#0E141C"; // the brand dark
const LIGHT = "#F4F7FA";

/** A rounded dark tile with the "15" mark — used as the pass icon. */
function iconSVG(px) {
  const r = Math.round(px * 0.22);
  const fs = Math.round(px * 0.34);
  const ls = (px * 0.012).toFixed(2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${px} ${px}">
  <rect width="${px}" height="${px}" rx="${r}" ry="${r}" fill="${INK}"/>
  <text x="50%" y="50%" dy="0.01em" text-anchor="middle" dominant-baseline="central"
    font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="500"
    font-size="${fs}" letter-spacing="${ls}" fill="${LIGHT}">15</text>
</svg>`;
}

/** The "SALON 15" wordmark on a transparent ground — the pass logo. */
function logoSVG(w, h) {
  const fs = Math.round(h * 0.42);
  const ls = (w * 0.018).toFixed(2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <text x="0" y="50%" dominant-baseline="central"
    font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="400"
    font-size="${fs}" letter-spacing="${ls}" fill="${LIGHT}">SALON 15</text>
</svg>`;
}

async function png(svg, file, { trim = false } = {}) {
  let img = sharp(Buffer.from(svg));
  // Trim the transparent margin so the wordmark fills Apple's logo box.
  if (trim) img = img.trim({ threshold: 1 });
  await img.png().toFile(join(OUT, file));
  console.log("·", file);
}

await png(iconSVG(29), "icon.png");
await png(iconSVG(58), "icon@2x.png");
await png(iconSVG(87), "icon@3x.png");
// Render roomy, then trim to the glyphs — keeps a consistent tight wordmark.
await png(logoSVG(360, 50), "logo.png", { trim: true });
await png(logoSVG(720, 100), "logo@2x.png", { trim: true });
await png(logoSVG(1080, 150), "logo@3x.png", { trim: true });

console.log("Done →", OUT);
