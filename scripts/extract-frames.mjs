// Extrahiert Frames aus einem Video als WebP nach public/frames/<name>/.
// Nutzung:  pnpm frames <video> <name> [fps=12] [width=1280]
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import ffmpegPath from "ffmpeg-static";

const [, , input, nameArg, fpsArg, widthArg, qualityArg] = process.argv;

if (!input || !nameArg) {
  console.error(
    "Nutzung: pnpm frames <video> <name> [fps=12] [width=1280] [quality=92]",
  );
  process.exit(1);
}
if (!existsSync(input)) {
  console.error(`Video nicht gefunden: ${input}`);
  process.exit(1);
}

const fps = Number(fpsArg ?? 12);
const width = Number(widthArg ?? 1280);
const quality = Number(qualityArg ?? 92);
const outDir = resolve("public/frames", nameArg);
const prefix = "frame_";
const pad = 4;
const ext = "webp";

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

console.log(
  `Extrahiere "${input}" -> ${nameArg}/  @ ${fps} fps, Breite ${width}px, q${quality} …`,
);

execFileSync(
  ffmpegPath,
  [
    "-i",
    input,
    "-vf",
    `fps=${fps},scale=${width}:-2:flags=lanczos`,
    "-c:v",
    "libwebp",
    "-quality",
    String(quality),
    resolve(outDir, `${prefix}%0${pad}d.${ext}`),
  ],
  { stdio: "inherit" },
);

const count = readdirSync(outDir).filter((f) => f.endsWith(`.${ext}`)).length;

writeFileSync(
  resolve(outDir, "manifest.json"),
  JSON.stringify({ count, prefix, pad, ext }, null, 2) + "\n",
);

console.log(`✓ ${count} Frames + manifest.json in public/frames/${nameArg}/`);
