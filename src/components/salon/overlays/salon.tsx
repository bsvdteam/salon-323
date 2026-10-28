"use client";

import { useSalon, TWEAKS } from "../store";
import { useOverlayActions } from "./overlay-actions";
import { bgImg, usePortrait } from "../use-portrait";
import { ImageSlot } from "../image-slot";
import { IsoMap } from "../iso-map";
import { salon as S, dateOf, wdL, fmtTime, milestones } from "@/lib/data";

export function SalonOverlay() {
  const { state } = useSalon();
  const ov = useOverlayActions();
  const portrait = usePortrait();
  const img = bgImg(portrait);
  if (!state.salOn) return null;

  const fmt = fmtTime;
  const dayW = (o: number) => state.ovr[o] ?? state.week[dateOf(o).getDay()];
  const nd = new Date();
  const nowM = nd.getHours() * 60 + nd.getMinutes();
  const twd = dateOf(0).getDay();
  const w0 = dayW(0);
  let status: string,
    open = false;
  if (w0.on && nowM < w0.e) {
    open = nowM >= w0.s;
    status = open ? `Jetzt offen · bis ${fmt(w0.e)}` : `Heute ab ${fmt(w0.s)}`;
  } else {
    let o = 1;
    while (o < 15 && !dayW(o).on) o++;
    const d = dateOf(o),
      w = dayW(o);
    status =
      o < 15
        ? `Geschlossen · ${o === 1 ? "morgen" : wdL[d.getDay()]} ab ${fmt(w.s)}`
        : "Geschlossen";
  }
  const q = encodeURIComponent(`Salon 323 ${S.a1} ${S.a2}`);
  const salHours = [1, 2, 3, 4, 5, 6, 0].map((wd) => {
    const w = state.week[wd],
      t = wd === twd;
    return {
      d: wdL[wd],
      t: w.on ? `${fmt(w.s)} – ${fmt(w.e)}` : "Geschlossen",
      fw: t ? 600 : 400,
      fg: w.on ? "#0E141C" : "rgba(14,20,28,.45)",
      dot: t ? 1 : 0,
    };
  });
  const facts = [
    {
      k: "Parkieren",
      v: "[2 Plätze direkt vor dem Haus]",
      s: "[Sonst Parkhaus X · 3 Min zu Fuss]",
    },
    { k: "ÖV", v: "[Haltestelle X]", s: "[Tram/Bus · 2 Min zu Fuss]" },
    {
      k: "Eingang",
      v: "Klingel «323»",
      s: "[Hinterhof, 1. Stock]. Wir öffnen dir.",
    },
    TWEAKS.payOnline
      ? {
          k: "Bezahlung",
          v: "TWINT · Apple Pay · Karte",
          s: "Wird nach dem Schnitt automatisch belastet. Bar geht auch.",
        }
      : {
          k: "Bezahlung",
          v: "Vor Ort",
          s: "Bar oder TWINT am Stuhl. Keine Zahlungsdaten im Portal.",
        },
    {
      k: "Absagen",
      v: "Bis 24 h vorher gratis",
      s: "Direkt im Portal – ein Tipp reicht.",
    },
    {
      k: "Wer kommt rein",
      v: "Nur Mitglieder",
      s: "Und wen ein Mitglied einlädt.",
    },
  ];

  const kick: React.CSSProperties = {
    fontFamily: "var(--font-geist-mono)",
    fontSize: 9,
    letterSpacing: ".24em",
    textTransform: "uppercase",
    color: "rgba(14,20,28,.62)",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        overflowY: "auto",
        overflowX: "hidden",
        background: "#E4EAF0",
        color: "#0E141C",
        opacity: state.salVis ? 1 : 0,
        pointerEvents: state.salVis ? "auto" : "none",
        transition: "opacity 1s cubic-bezier(.4,0,.2,1)",
      }}
    >
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `url(${img.url})`,
          backgroundSize: "cover",
          backgroundPosition: img.pos,
          filter: "blur(70px) saturate(.85)",
          opacity: 0.55,
          transform: "scale(1.25)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: 44,
          padding:
            "calc(14px + env(safe-area-inset-top)) clamp(20px,4vw,48px) 14px",
          fontFamily: "var(--font-geist-mono)",
          fontSize: 9,
          letterSpacing: ".26em",
          textTransform: "uppercase",
          background:
            "linear-gradient(180deg,rgba(228,234,240,.9),rgba(228,234,240,0))",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <span>salon 323 — Salon</span>
        <button
          onClick={ov.closeSalon}
          style={{
            border: 0,
            background: "transparent",
            color: "inherit",
            font: "inherit",
            letterSpacing: "inherit",
            textTransform: "inherit",
            padding: "12px 0",
          }}
        >
          Schliessen ✕
        </button>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1100,
          margin: "0 auto",
          padding:
            "clamp(20px,6vh,64px) clamp(16px,4vw,48px) calc(64px + env(safe-area-inset-bottom))",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(56px,10vh,110px)",
        }}
      >
        {/* hero */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "clamp(28px,5vh,48px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 24,
              flexWrap: "wrap",
              animation: "up 1.4s cubic-bezier(.22,1,.36,1) both",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <span style={kick}>N° 323 · Members only</span>
              <h1
                style={{
                  margin: 0,
                  fontSize: "clamp(46px,9vw,112px)",
                  fontWeight: 200,
                  letterSpacing: "-.05em",
                  lineHeight: 0.9,
                }}
              >
                Ein Raum.
                <br />
                Ein Stuhl.
              </h1>
            </div>
            <div
              className="glass-dark"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                height: 44,
                padding: "0 18px",
                borderRadius: 999,
                fontSize: 12.5,
              }}
            >
              <span
                data-loop
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: open ? "#F4A69E" : "rgba(244,247,250,.4)",
                  animation: "ping 2.8s ease-out infinite",
                }}
              />
              {status}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              animation: "up 1.6s cubic-bezier(.22,1,.36,1) .15s both",
            }}
          >
            <div
              style={{
                flex: "1.6 1 340px",
                minWidth: 0,
                height: "clamp(300px,50vw,560px)",
                borderRadius: 30,
                overflow: "hidden",
                boxShadow: "0 30px 60px -36px rgba(20,32,52,.5)",
              }}
            >
              <ImageSlot label="Salon · der Raum" hue={220} radius={30} />
            </div>
            <div
              style={{
                flex: "1 1 260px",
                minWidth: 0,
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div
                style={{
                  flex: "1 1 220px",
                  minHeight: "clamp(180px,24vw,275px)",
                  borderRadius: 30,
                  overflow: "hidden",
                  boxShadow: "0 30px 60px -36px rgba(20,32,52,.5)",
                }}
              >
                <ImageSlot label="Der Stuhl" hue={28} radius={30} />
              </div>
              <div
                style={{
                  flex: "1 1 220px",
                  minHeight: "clamp(180px,24vw,275px)",
                  borderRadius: 30,
                  overflow: "hidden",
                  boxShadow: "0 30px 60px -36px rgba(20,32,52,.5)",
                }}
              >
                <ImageSlot label="Detail · Werkzeug" hue={200} radius={30} />
              </div>
            </div>
          </div>
        </div>

        {/* map + hours + contact */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(320px,100%),1fr))",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              minHeight: 360,
              borderRadius: 34,
              background:
                "radial-gradient(120% 90% at 62% 42%,#2a3546,#121924)",
              boxShadow:
                "inset 0 0 0 1px rgba(255,255,255,.08),0 40px 80px -40px rgba(10,20,40,.6)",
              color: "#F4F7FA",
            }}
          >
            <IsoMap />
            <div
              style={{
                position: "absolute",
                left: 20,
                top: 20,
                fontFamily: "var(--font-geist-mono)",
                fontSize: 9,
                letterSpacing: ".24em",
                textTransform: "uppercase",
                color: "rgba(244,247,250,.62)",
              }}
            >
              Hier findest du uns
            </div>
            <div
              style={{
                position: "absolute",
                left: 14,
                right: 14,
                bottom: 14,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                padding: "14px 14px 14px 18px",
                borderRadius: 24,
                background: "rgba(14,20,28,.55)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  minWidth: 0,
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 400 }}>{S.a1}</span>
                <span
                  style={{ fontSize: 11.5, color: "rgba(244,247,250,.65)" }}
                >
                  {S.a2}
                </span>
              </div>
              <div style={{ flex: "none", display: "flex", gap: 6 }}>
                <a
                  href={`https://maps.apple.com/?q=${q}`}
                  target="_blank"
                  style={{
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 14px",
                    borderRadius: 999,
                    background: "#F4F7FA",
                    color: "#0E141C",
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Route
                </a>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${q}`}
                  target="_blank"
                  style={{
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 14px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,.2)",
                    color: "#F4F7FA",
                    fontSize: 12,
                    textDecoration: "none",
                  }}
                >
                  Google
                </a>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              className="glass-light"
              style={{
                borderRadius: 30,
                padding: 22,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingBottom: 8,
                }}
              >
                <span style={kick}>Öffnungszeiten</span>
                <span style={{ fontSize: 11, color: "rgba(14,20,28,.55)" }}>
                  Mittag {fmt(state.pause.s)}–{fmt(state.pause.e)}
                </span>
              </div>
              {salHours.map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "7px 0",
                    fontSize: 13.5,
                    fontWeight: h.fw,
                    color: h.fg,
                  }}
                >
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "#F4A69E",
                        opacity: h.dot,
                      }}
                    />
                    {h.d}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 12,
                    }}
                  >
                    {h.t}
                  </span>
                </div>
              ))}
              <span
                style={{
                  paddingTop: 8,
                  fontSize: 11.5,
                  color: "var(--ink-60)",
                  textWrap: "pretty",
                }}
              >
                Kurzfristige Änderungen siehst du immer live beim Buchen.
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <a
                href={S.tel}
                className="glass-dark"
                style={{
                  borderRadius: 26,
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  textDecoration: "none",
                }}
              >
                <span
                  style={{ fontSize: 11.5, color: "rgba(244,247,250,.65)" }}
                >
                  Anrufen
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 12.5,
                    overflowWrap: "anywhere",
                  }}
                >
                  {S.phone}
                </span>
              </a>
              <a
                href={S.wa}
                target="_blank"
                className="glass-light"
                style={{
                  borderRadius: 26,
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  textDecoration: "none",
                  color: "#0E141C",
                }}
              >
                <span style={{ fontSize: 11.5, color: "var(--ink-62)" }}>
                  Nachricht
                </span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>
                  WhatsApp →
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* facts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span style={kick}>Gut zu wissen</span>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(min(240px,100%),1fr))",
              gap: 1,
              borderRadius: 30,
              overflow: "hidden",
              background: "rgba(14,20,28,.07)",
              boxShadow: "0 24px 50px -34px rgba(20,32,52,.4)",
            }}
          >
            {facts.map((f, i) => (
              <div
                key={i}
                style={{
                  padding: 22,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  background: "rgba(246,248,250,.82)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                }}
              >
                <span style={{ fontSize: 11.5, color: "var(--ink-60)" }}>
                  {f.k}
                </span>
                <span
                  style={{ fontSize: 16, fontWeight: 400, lineHeight: 1.35 }}
                >
                  {f.v}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--ink-62)",
                    lineHeight: 1.5,
                    textWrap: "pretty",
                  }}
                >
                  {f.s}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* history */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(min(300px,100%),1fr))",
            gap: "clamp(24px,5vw,72px)",
            alignItems: "start",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              position: "sticky",
              top: 90,
            }}
          >
            <span style={kick}>Geschichte</span>
            <h2
              style={{
                margin: 0,
                fontSize: "clamp(30px,4.6vw,48px)",
                fontWeight: 200,
                letterSpacing: "-.035em",
                lineHeight: 1,
              }}
            >
              Vom Keller
              <br />
              zum Circle.
            </h2>
            <button
              onClick={ov.openStory}
              className="glass-dark"
              style={{
                alignSelf: "flex-start",
                height: 46,
                display: "flex",
                alignItems: "center",
                gap: 12,
                border: 0,
                borderRadius: 999,
                padding: "0 20px",
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              Story erleben <span style={{ fontWeight: 300 }}>→</span>
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {milestones.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "64px minmax(0,1fr)",
                  gap: 16,
                  padding: "22px 0",
                  borderTop: "1px solid rgba(14,20,28,.09)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 12,
                    color: "rgba(14,20,28,.55)",
                    paddingTop: 3,
                  }}
                >
                  {m.year}
                </span>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <span
                    style={{
                      fontSize: 17,
                      fontWeight: 400,
                      letterSpacing: "-.01em",
                    }}
                  >
                    {m.title}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: "rgba(14,20,28,.66)",
                      textWrap: "pretty",
                    }}
                  >
                    {m.text}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
