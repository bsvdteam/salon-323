import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// The link preview for an invite (WhatsApp, iMessage …) in the same look as
// the story picture: mist, "Look sharp.", the blank "Your Name" card, the
// code. Rendered per code, so the preview already carries it.
export const alt = "Salon 15 — Barber in Degersheim. Members only.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const clean = (raw: string) =>
  raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);

/** A Google font as TTF, subset to the text drawn (no font files in repo). */
async function gfont(family: string, weight: number, text: string) {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}&text=${encodeURIComponent(text)}`,
    ).then((r) => r.text());
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    return src ? await fetch(src[1]).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const code = clean((await params).code) || "SALON";
  const photo = `data:image/jpeg;base64,${(
    await readFile(join(process.cwd(), "public", "mist.jpg"))
  ).toString("base64")}`;

  const sansText =
    "Look sharp.Feel sharp.Barber in Degersheim.Your Name salon15.ch";
  const monoText = `SALON 15MEMBERS ONLYUSE CODEMEMBERINVITEN° —·GUEST${code}`;
  const [thin, regular, mono] = await Promise.all([
    gfont("Urbanist", 200, sansText),
    gfont("Urbanist", 400, sansText),
    gfont("Geist+Mono", 300, monoText),
  ]);
  const fonts = [
    thin && { name: "Urbanist", data: thin, weight: 200 as const },
    regular && { name: "Urbanist", data: regular, weight: 400 as const },
    mono && { name: "Mono", data: mono, weight: 300 as const },
  ].filter(Boolean) as {
    name: string;
    data: ArrayBuffer;
    weight: 200 | 300 | 400;
  }[];

  const ink = "#F4F7FA";
  const monoS = { fontFamily: "Mono", fontWeight: 300 } as const;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "#1a2230",
        color: ink,
        fontFamily: "Urbanist",
      }}
    >
      <img
        src={photo}
        alt=""
        width={1200}
        height={630}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1200,
          height: 630,
          objectFit: "cover",
          objectPosition: "50% 40%",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1200,
          height: 630,
          display: "flex",
          background:
            "linear-gradient(100deg,rgba(14,20,30,.92) 0%,rgba(14,20,30,.7) 45%,rgba(14,20,30,.25) 100%)",
        }}
      />

      {/* left: what it is + the code */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 0 52px 64px",
          width: 640,
        }}
      >
        <div
          style={{
            ...monoS,
            display: "flex",
            fontSize: 18,
            letterSpacing: 7,
          }}
        >
          SALON 15
          <span style={{ marginLeft: 28, opacity: 0.55 }}>MEMBERS ONLY</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 92, fontWeight: 200, lineHeight: 1 }}>
            Look sharp.
          </span>
          <span
            style={{
              fontSize: 92,
              fontWeight: 200,
              lineHeight: 1.05,
              opacity: 0.55,
            }}
          >
            Feel sharp.
          </span>
          <span
            style={{
              fontSize: 30,
              fontWeight: 400,
              marginTop: 22,
              opacity: 0.85,
            }}
          >
            Barber in Degersheim.
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span
            style={{
              ...monoS,
              fontSize: 16,
              letterSpacing: 6,
              opacity: 0.6,
              marginRight: 22,
            }}
          >
            USE CODE
          </span>
          <span style={{ ...monoS, fontSize: 46, letterSpacing: 14 }}>
            {code}
          </span>
          <span style={{ fontSize: 22, marginLeft: 26, opacity: 0.7 }}>
            salon15.ch
          </span>
        </div>
      </div>

      {/* right: the blank card, tilted */}
      <div
        style={{
          position: "absolute",
          right: 70,
          top: 170,
          width: 430,
          height: 271,
          display: "flex",
          borderRadius: 28,
          overflow: "hidden",
          transform: "rotate(-6deg)",
          border: "1.5px solid rgba(255,255,255,.3)",
          boxShadow: "0 40px 80px rgba(0,0,0,.55)",
        }}
      >
        <img
          src={photo}
          alt=""
          width={430}
          height={271}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 430,
            height: 271,
            objectFit: "cover",
            objectPosition: "48% 42%",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 430,
            height: 271,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "26px 28px",
            background:
              "linear-gradient(25deg,rgba(26,34,48,.85),rgba(26,34,48,.2) 60%,rgba(255,255,255,.12))",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ ...monoS, fontSize: 12, letterSpacing: 5 }}>
                SALON 15
              </span>
              <span
                style={{
                  ...monoS,
                  fontSize: 10,
                  letterSpacing: 3,
                  opacity: 0.6,
                  marginTop: 6,
                }}
              >
                MEMBER
              </span>
            </div>
            <span
              style={{ ...monoS, fontSize: 10, letterSpacing: 4, opacity: 0.7 }}
            >
              INVITE
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 28, fontWeight: 400 }}>Your Name</span>
            <span
              style={{
                ...monoS,
                fontSize: 11,
                letterSpacing: 3,
                opacity: 0.72,
                marginTop: 6,
              }}
            >
              N° ———— · GUEST
            </span>
          </div>
        </div>
      </div>
    </div>,
    { ...size, fonts: fonts.length ? fonts : undefined },
  );
}
