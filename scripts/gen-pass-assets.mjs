// One-off generator for the Apple Wallet pass images. Run once; the PNGs are
// committed and used at runtime — sharp is only a devDependency, never bundled.
//
//   node scripts/gen-pass-assets.mjs
//
// Apple sizes (points → @1x/@2x/@3x pixels):
//   icon   29×29            logo  ≤160×50            strip (storeCard) 375×144
//   artwork (posterGeneric, iOS 27) 358×448 — full-bleed, portrait
//   primaryLogo (posterGeneric) 30 pt tall, 30–126 pt wide
// The strip is the card's face: the member's chosen design photo (Mist / Ember /
// Moos), framed and tinted like the dashboard card (cardStyles in lib/data.ts),
// one set per design: strip-<index>.png. Logo and icon use the real wordmark.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src/lib/wallet/apple/assets");
mkdirSync(OUT, { recursive: true });

const INK = "#0E141C";
const LIGHT = "#F4F7FA";

// ── wordmark glyphs — same geometry as src/components/salon/wordmark.tsx ──
const s = (x) =>
  `M${x + 31} 61C${x + 28} 56.5 ${x + 22} 55 ${x + 16} 55C${x + 7} 55 ${x + 1} 59.5 ${x + 1} 65.5C${x + 1} 72 ${x + 7} 74 ${x + 16} 75C${x + 25} 76 ${x + 31} 78.5 ${x + 31} 85C${x + 31} 91 ${x + 25} 95 ${x + 16} 95C${x + 9} 95 ${x + 3} 92.5 ${x + 0.5} 88`;
const o = (cx) => `M${cx} 54.5A20 20.5 0 1 1 ${cx - 0.01} 54.5`;
const a = (cx) => [o(cx), `M${cx + 20} 49.5V100.5`];
const l = (x) => `M${x} 28V100.5`;
const n = (x) => `M${x} 100.5V49.5M${x} 73A18 18 0 0 1 ${x + 36} 73V100.5`;
const one = (x) => `M${x + 2} 47L${x + 17} 35V95`;
const five = (x) =>
  `M${x + 32} 35H${x + 6}L${x + 3} 63C${x + 7} 59.5 ${x + 12} 58 ${x + 18} 58C${x + 28} 58 ${x + 35} 65.5 ${x + 35} 76.5C${x + 35} 88 ${x + 28} 95 ${x + 18} 95C${x + 10} 95 ${x + 4} 92 ${x + 1} 87`;

const paths = (ds, sw) =>
  ds
    .map(
      (d) =>
        `<path d="${d}" fill="none" stroke="${LIGHT}" stroke-width="${sw}" stroke-linecap="butt" stroke-linejoin="miter"/>`,
    )
    .join("");

/** "salon 15" wordmark on transparent ground — the pass logo (top left). */
function logoSVG(w, h) {
  const d = [s(5), ...a(72), l(108), o(144), n(180), one(250), five(284)];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="-4 24 332 82">${paths(d, 11)}</svg>`;
}

/** Same wordmark, 30 pt tall — the poster pass's top-leading primary logo. */
function primaryLogoSVG(w, h) {
  return logoSVG(w, h);
}

/** Rounded dark tile with the "15" glyphs — the pass icon. */
function iconSVG(px) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="22" fill="${INK}"/>
  <g transform="translate(21.6 -0.4) scale(0.8)">${paths([one(0), five(34)], 11)}</g>
</svg>`;
}

// ── strips: the three card designs ──
// src, background-position and overlay mirror cardStyles (front / overlay).
const DESIGNS = [
  {
    src: "public/mist.jpg",
    // portrait poster art: the portrait photo, framed like the phone background
    poster: { src: "public/mist-mobile.jpg", cx: 0.5, cy: 0.5 },
    tint: ["rgba(8,12,20,.8)", "rgba(8,12,20,.25)", "rgba(255,255,255,.14)"],
  },
  {
    src: "public/cards/ember.webp",
    // portrait window centred between client and barber
    poster: { src: "public/cards/ember.webp", cx: 0.58, cy: 0.5 },
    tint: ["rgba(26,6,10,.72)", "rgba(26,6,10,.18)", "rgba(255,220,214,.1)"],
  },
  {
    src: "public/cards/moos.webp",
    poster: { src: "public/cards/moos.webp", cx: 0.6, cy: 0.5 },
    tint: ["rgba(8,16,10,.74)", "rgba(8,16,10,.2)", "rgba(236,240,214,.1)"],
  },
];
const POS = { x: 0.48, y: 0.42 }; // card: backgroundPosition "48% 42%"

const rgba = (c) => {
  const [r, g, b, al] = c.match(/[\d.]+/g).map(Number);
  return `stop-color="rgb(${r},${g},${b})" stop-opacity="${al}"`;
};

/** Card overlay (115deg tint) + a soft bottom shade so Wallet's name reads. */
function overlaySVG(w, h, tint) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="t" x1="0" y1="0" x2="1" y2="0.47">
      <stop offset="0" ${rgba(tint[0])}/><stop offset=".55" ${rgba(tint[1])}/><stop offset="1" ${rgba(tint[2])}/>
    </linearGradient>
    <linearGradient id="b" x1="0" y1="0" x2="0" y2="1">
      <stop offset=".35" stop-color="rgb(8,12,20)" stop-opacity="0"/><stop offset="1" stop-color="rgb(8,12,20)" stop-opacity=".55"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#t)"/><rect width="100%" height="100%" fill="url(#b)"/>
</svg>`;
}

/** The design photo framed like the card (cover, 48% 42%) with its tint. */
async function tinted(i, w, h) {
  const { src, tint } = DESIGNS[i];
  const meta = await sharp(join(ROOT, src)).metadata();
  const k = Math.max(w / meta.width, h / meta.height);
  const sw = Math.round(meta.width * k);
  const sh = Math.round(meta.height * k);
  const left = Math.round((sw - w) * POS.x);
  const top = Math.round((sh - h) * POS.y);
  return sharp(
    await sharp(join(ROOT, src))
      .resize(sw, sh)
      .extract({ left, top, width: w, height: h })
      .composite([{ input: Buffer.from(overlaySVG(w, h, tint)) }])
      .png()
      .toBuffer(),
  );
}

/** The photo's own dark tone (mean of its top and bottom edge rows): the
 *  pass background, so the strip can fade into it without a visible band. */
async function edgeColor(i) {
  const w = 375,
    h = 144,
    band = 10;
  const { data } = await (
    await tinted(i, w, h)
  )
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let r = 0,
    g = 0,
    b = 0,
    n = 0;
  for (let y = 0; y < h; y++) {
    if (y >= band && y < h - band) continue;
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 3;
      r += data[p];
      g += data[p + 1];
      b += data[p + 2];
      n++;
    }
  }
  const hex = (v) =>
    Math.round((v / n) * 0.85)
      .toString(16)
      .padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** Top and bottom of the strip melt into the pass background colour. */
function fadeSVG(w, h, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${color}" stop-opacity="1"/>
    <stop offset=".3" stop-color="${color}" stop-opacity="0"/>
    <stop offset=".55" stop-color="${color}" stop-opacity="0"/>
    <stop offset="1" stop-color="${color}" stop-opacity="1"/>
  </linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#f)"/>
</svg>`;
}

async function strip(i, w, h, file, color) {
  await (
    await tinted(i, w, h)
  )
    .composite([{ input: Buffer.from(fadeSVG(w, h, color)) }])
    // quantized PNG (Wallet only takes PNG): ~5× smaller, dithered so the
    // smoke gradients don't band
    .png({
      palette: true,
      quality: 100,
      effort: 10,
      dither: 1,
      compressionLevel: 9,
    })
    .toFile(join(OUT, file));
  console.log("·", file);
}

/** Full-bleed portrait poster art: the design photo with the card's tint.
 *  Wallet itself darkens the header and lays a material strip over the
 *  bottom, so no extra shading here. */
async function artwork(i, w, h, file) {
  const { poster, tint } = DESIGNS[i];
  const meta = await sharp(join(ROOT, poster.src)).metadata();
  const k = Math.max(w / meta.width, h / meta.height);
  const sw = Math.round(meta.width * k);
  const sh = Math.round(meta.height * k);
  const clamp = (v, max) => Math.min(Math.max(Math.round(v), 0), max);
  const left = clamp(sw * poster.cx - w / 2, sw - w);
  const top = clamp(sh * poster.cy - h / 2, sh - h);
  const tintOnly = overlaySVG(w, h, tint).replace(
    /<rect width="100%" height="100%" fill="url\(#b\)"\/>/,
    "",
  );
  await sharp(join(ROOT, poster.src))
    .resize(sw, sh)
    .extract({ left, top, width: w, height: h })
    .composite([{ input: Buffer.from(tintOnly) }])
    // 128 colours: the grainy photo hides it, halves the pass size
    .png({
      palette: true,
      colors: 128,
      quality: 65,
      effort: 10,
      dither: 1,
      compressionLevel: 9,
    })
    .toFile(join(OUT, file));
  console.log("·", file);
}

async function png(svg, file) {
  await sharp(Buffer.from(svg)).png().toFile(join(OUT, file));
  console.log("·", file);
}

// per-design pass background = the photo's edge tone (read by pass.ts)
const colors = [];
for (let i = 0; i < DESIGNS.length; i++) colors.push(await edgeColor(i));
writeFileSync(join(OUT, "colors.json"), JSON.stringify(colors) + "\n");
console.log("· colors.json", colors.join(" "));

for (const [suffix, k] of [
  ["", 1],
  ["@2x", 2],
  ["@3x", 3],
]) {
  await png(iconSVG(29 * k), `icon${suffix}.png`);
  // small like the card's top-left mark, not a headline
  await png(logoSVG(96 * k, 24 * k), `logo${suffix}.png`);
  await png(primaryLogoSVG(121 * k, 30 * k), `primaryLogo${suffix}.png`);
  for (let i = 0; i < DESIGNS.length; i++) {
    await strip(i, 375 * k, 144 * k, `strip-${i}${suffix}.png`, colors[i]);
    // poster art ships @2x/@3x only (see assets.ts)
    if (k > 1) await artwork(i, 358 * k, 448 * k, `artwork-${i}${suffix}.png`);
  }
}

console.log("Done →", OUT);
