// Client-only: draws the invite "story" (1080×1920, Instagram/WhatsApp story
// size) on a canvas — the member's own card design as backdrop and as a real
// card, the code big in glass, tier and standing at the bottom. Fonts come
// from the page (next/font), so it looks exactly like the app.
import { cardStyles, tierAt, fmtTop, type Standing } from "@/lib/data";

export type StoryInput = {
  first: string;
  last: string;
  no: string;
  cuts: number;
  card: number;
  since: [number, number];
  code: string;
  link: string; // shown without https://
  standing: Standing | null;
};

const W = 1080;
const H = 1920;

const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((ok, fail) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = fail;
    i.src = src;
  });

/** Draw an image to fill a box (like background-size: cover). */
function cover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  fx = 0.5,
  fy = 0.45,
) {
  const s = Math.max(w / img.width, h / img.height);
  const iw = img.width * s;
  const ih = img.height * s;
  ctx.drawImage(img, x + (w - iw) * fx, y + (h - ih) * fy, iw, ih);
}

/** Text with manual letter-spacing (canvas letterSpacing isn't everywhere). */
function spaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  sp: number,
  align: "left" | "center" | "right" = "left",
) {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + sp * (chars.length - 1);
  let cx =
    align === "left" ? x : align === "center" ? x - total / 2 : x - total;
  const prev = ctx.textAlign;
  ctx.textAlign = "left";
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + sp;
  });
  ctx.textAlign = prev;
  return total;
}

function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const ROMAN_FALLBACK = "I";

export async function renderStory(d: StoryInput): Promise<Blob> {
  const cs = cardStyles[d.card] ?? cardStyles[0];
  const css = getComputedStyle(document.body);
  const sans = css.getPropertyValue("--font-urbanist").trim() || "sans-serif";
  const mono =
    css.getPropertyValue("--font-geist-mono").trim() || "ui-monospace";
  await Promise.all([
    document.fonts.load(`200 120px ${sans}`),
    document.fonts.load(`400 40px ${sans}`),
    document.fonts.load(`300 150px ${mono}`),
    document.fonts.load(`400 30px ${mono}`),
  ]).catch(() => {});
  const img = await loadImg(cs.img);

  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  const ink = cs.text;
  const points = d.standing?.points ?? 0;
  const { T } = tierAt(points, d.cuts);

  // ── backdrop: the card photo, blown up, blurred, sunk into its own colour
  ctx.fillStyle = cs.base;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.filter = "blur(46px) saturate(120%)";
  cover(ctx, img, -120, -120, W + 240, H + 240, 0.5, 0.4);
  ctx.restore();
  const shade = ctx.createLinearGradient(0, 0, 0, H);
  shade.addColorStop(0, rgba(cs.base, 0.55));
  shade.addColorStop(0.42, rgba(cs.base, 0.2));
  shade.addColorStop(0.7, rgba(cs.base, 0.55));
  shade.addColorStop(1, rgba(cs.base, 0.92));
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);
  // coral glow behind the card
  const glow = ctx.createRadialGradient(760, 980, 0, 760, 980, 620);
  glow.addColorStop(0, "rgba(244,166,158,.42)");
  glow.addColorStop(1, "rgba(244,166,158,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── top bar
  ctx.fillStyle = rgba(ink, 0.92);
  ctx.textBaseline = "alphabetic";
  ctx.font = `400 28px ${mono}`;
  spaced(ctx, "SALON 15", 84, 150, 13);
  ctx.fillStyle = rgba(ink, 0.6);
  spaced(ctx, "MEMBERS ONLY", W - 84, 150, 9, "right");

  // ── headline
  ctx.fillStyle = ink;
  ctx.font = `200 118px ${sans}`;
  ["Rein kommt", "nur, wer", "eingeladen", "wird."].forEach((l, i) =>
    ctx.fillText(l, 80, 330 + i * 122),
  );

  // ── the card itself, sharp and tilted
  const cw = 860;
  const ch = cw / 1.586;
  ctx.save();
  ctx.translate(W / 2 + 30, 1060);
  ctx.rotate((-7 * Math.PI) / 180);
  ctx.shadowColor = "rgba(0,0,0,.55)";
  ctx.shadowBlur = 90;
  ctx.shadowOffsetY = 50;
  ctx.beginPath();
  ctx.roundRect(-cw / 2, -ch / 2, cw, ch, 52);
  ctx.fillStyle = cs.base;
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.clip();
  cover(ctx, img, -cw / 2 - 30, -ch / 2 - 30, cw + 60, ch + 60, 0.48, 0.42);
  const ov = ctx.createLinearGradient(-cw / 2, ch / 2, cw / 2, -ch / 2);
  ov.addColorStop(0, rgba(cs.base, 0.85));
  ov.addColorStop(0.55, rgba(cs.base, 0.22));
  ov.addColorStop(1, "rgba(255,255,255,.14)");
  ctx.fillStyle = ov;
  ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
  // specular sheen
  const sh = ctx.createLinearGradient(-cw / 2, -ch / 2, cw / 2, ch / 2);
  sh.addColorStop(0.38, "rgba(255,255,255,0)");
  sh.addColorStop(0.5, "rgba(255,255,255,.18)");
  sh.addColorStop(0.62, "rgba(255,255,255,0)");
  ctx.fillStyle = sh;
  ctx.fillRect(-cw / 2, -ch / 2, cw, ch);
  // card text
  const px = -cw / 2 + 56;
  ctx.fillStyle = ink;
  ctx.font = `400 22px ${mono}`;
  spaced(ctx, "SALON 15", px, -ch / 2 + 78, 10);
  ctx.fillStyle = rgba(ink, 0.6);
  ctx.font = `400 18px ${mono}`;
  spaced(ctx, "MEMBER", px, -ch / 2 + 112, 6);
  ctx.fillStyle = ink;
  ctx.font = `200 56px ${sans}`;
  ctx.textAlign = "right";
  ctx.fillText(T.r || ROMAN_FALLBACK, cw / 2 - 56, -ch / 2 + 98);
  ctx.textAlign = "left";
  ctx.font = `400 46px ${sans}`;
  ctx.fillText(`${d.first} ${d.last}`.trim(), px, ch / 2 - 104);
  ctx.fillStyle = rgba(ink, 0.72);
  ctx.font = `400 20px ${mono}`;
  spaced(ctx, `N° ${d.no} · ${T.n.toUpperCase()}`, px, ch / 2 - 58, 5);
  const since =
    String(d.since[0] + 1).padStart(2, "0") + "·" + String(d.since[1]).slice(2);
  spaced(ctx, `SEIT ${since}`, cw / 2 - 56, ch / 2 - 58, 5, "right");
  ctx.restore();
  // thin rim on the card
  ctx.save();
  ctx.translate(W / 2 + 30, 1060);
  ctx.rotate((-7 * Math.PI) / 180);
  ctx.beginPath();
  ctx.roundRect(-cw / 2, -ch / 2, cw, ch, 52);
  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  // ── the code, in glass
  const gx = 80;
  const gy = 1430;
  const gw = W - 160;
  const gh = 270;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(gx, gy, gw, gh, 56);
  ctx.clip();
  ctx.filter = "blur(30px)";
  cover(ctx, img, -120, -120, W + 240, H + 240, 0.5, 0.4);
  ctx.filter = "none";
  ctx.fillStyle = "rgba(255,255,255,.12)";
  ctx.fillRect(gx, gy, gw, gh);
  ctx.restore();
  ctx.beginPath();
  ctx.roundRect(gx, gy, gw, gh, 56);
  ctx.strokeStyle = "rgba(255,255,255,.32)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = rgba(ink, 0.65);
  ctx.font = `400 24px ${mono}`;
  spaced(ctx, "MEIN CODE", gx + 64, gy + 76, 10);
  ctx.fillStyle = ink;
  ctx.font = `300 132px ${mono}`;
  spaced(ctx, d.code, W / 2, gy + 214, 34, "center");

  // ── link + standing
  ctx.fillStyle = rgba(ink, 0.85);
  ctx.font = `400 34px ${sans}`;
  ctx.textAlign = "center";
  ctx.fillText(d.link, W / 2, 1790);
  ctx.textAlign = "left";
  ctx.fillStyle = rgba(ink, 0.55);
  ctx.font = `400 20px ${mono}`;
  const brag =
    d.standing && d.standing.of > 1
      ? `TIER ${T.r} · ${T.n.toUpperCase()} · ${fmtTop(d.standing.top).toUpperCase()}`
      : `TIER ${T.r} · ${T.n.toUpperCase()}`;
  spaced(ctx, brag, W / 2, 1850, 6, "center");

  // ── film grain, very light
  const grain = ctx.getImageData(0, 0, W, H);
  const px8 = grain.data;
  for (let i = 0; i < px8.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    px8[i] += n;
    px8[i + 1] += n;
    px8[i + 2] += n;
  }
  ctx.putImageData(grain, 0, 0);

  return new Promise((ok, fail) =>
    cv.toBlob((b) => (b ? ok(b) : fail(new Error("toBlob"))), "image/png"),
  );
}
