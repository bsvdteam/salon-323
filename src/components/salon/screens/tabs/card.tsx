"use client";

import { useMemo, useRef } from "react";
import { copyText } from "@/lib/share";
import { useSalon } from "../../store";
import {
  salon,
  tiers,
  cardStyles,
  dateOf,
  svcName,
  wdS,
  monS,
} from "@/lib/data";

function buildQR() {
  const qr: boolean[] = [];
  for (let r = 0; r < 21; r++)
    for (let c = 0; c < 21; c++) {
      const f = (rr: number, cc: number) => {
        const a = r - rr,
          b = c - cc;
        if (a < 0 || b < 0 || a > 6 || b > 6) return null;
        return (
          a === 0 ||
          a === 6 ||
          b === 0 ||
          b === 6 ||
          (a >= 2 && a <= 4 && b >= 2 && b <= 4)
        );
      };
      let on = f(0, 0);
      if (on === null) on = f(0, 14);
      if (on === null) on = f(14, 0);
      if (on === null) on = (r * 31 + c * 17 + r * c * 7) % 11 < 5;
      qr.push(!!on);
    }
  return qr;
}

export function CardTab() {
  const { state, set, say } = useSalon();
  const st = state;
  const U = st.user ?? {
    first: "Luca",
    last: "Meier",
    username: "luca",
    cuts: 41,
    since: [2, 2024] as [number, number],
    no: "0047",
    phone: "",
    card: 0,
    isNew: false,
  };
  const ti = tiers.reduce((acc, t, k) => (U.cuts >= t.min ? k : acc), 0);
  const T = tiers[ti];
  const cs = cardStyles[U.card] ?? cardStyles[0];
  const qr = useMemo(() => buildQR(), []);

  const hasAppt = !!st.appt;
  const d = st.appt ? dateOf(st.appt.off) : null;
  const apptShort = d
    ? `${wdS[d.getDay()]} ${d.getDate()}. ${monS[d.getMonth()]}`.toUpperCase()
    : "";
  const apptSvc = st.appt
    ? st.appt.services.map((k) => svcName(k)).join(" · ") + " · 30 min"
    : "";
  const fullName = (U.first + " " + U.last).trim();
  const sinceShort =
    String(U.since[0] + 1).padStart(2, "0") + "·" + String(U.since[1]).slice(2);
  const q = encodeURIComponent(`Salon 15 ${salon.a1} ${salon.a2}`);
  const salAddrUpper = `${salon.a1} · ${salon.a2}`.toUpperCase();

  const cardRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    if (cardRef.current)
      cardRef.current.style.transform = `rotateX(${(-y * 12).toFixed(2)}deg) rotateY(${(x * 16).toFixed(2)}deg)`;
    if (sheenRef.current)
      sheenRef.current.style.transform = `translateX(${(x * 50).toFixed(1)}%)`;
  };
  const onLeave = () => {
    if (cardRef.current)
      cardRef.current.style.transform = "rotateX(0) rotateY(0)";
    if (sheenRef.current) sheenRef.current.style.transform = "translateX(-20%)";
  };
  const flip = () => set((p) => ({ flipped: !p.flipped }));

  const FACE_BACK = (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: "rotateY(180deg)",
        borderRadius: 24,
        overflow: "hidden",
        padding: 20,
        display: "flex",
        alignItems: "center",
        gap: 20,
        background: "linear-gradient(160deg,#f7f9fb,#e3e9ef)",
        color: "#0E141C",
        boxShadow:
          "0 44px 80px -30px rgba(10,20,40,.6),inset 0 0 0 1px rgba(255,255,255,.8)",
      }}
    >
      <div
        style={{
          height: "100%",
          aspectRatio: "1/1",
          display: "grid",
          gridTemplateColumns: "repeat(21,1fr)",
          gridTemplateRows: "repeat(21,1fr)",
        }}
      >
        {qr.map((on, i) => (
          <span
            key={i}
            style={{
              background: on ? "#0E141C" : "transparent",
              borderRadius: 1,
            }}
          />
        ))}
      </div>
      {hasAppt ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 7,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 9,
              letterSpacing: ".3em",
            }}
          >
            TERMIN
          </span>
          <span style={{ fontSize: 18, fontWeight: 300 }}>
            {apptShort} · {st.appt!.time}
          </span>
          <span
            style={{ fontSize: 11.5, color: "var(--ink-62)", lineHeight: 1.45 }}
          >
            {salon.a1}
            <br />
            {salon.a2}
          </span>
          <span style={{ fontSize: 11.5, color: "var(--ink-62)" }}>
            CHF {st.appt!.price ?? 20} · Vor Ort
          </span>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 9,
              letterSpacing: ".3em",
            }}
          >
            SALON 15
          </span>
          <span style={{ fontSize: 20, fontWeight: 300 }}>N° {U.no}</span>
          <span
            style={{ fontSize: 11.5, color: "var(--ink-62)", lineHeight: 1.4 }}
          >
            Beim Eintreten vorzeigen.
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 30,
        paddingTop: "2vh",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          alignItems: "center",
          textAlign: "center",
          animation: "up 1.4s cubic-bezier(.22,1,.36,1) both",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 9,
            letterSpacing: ".22em",
            textTransform: "uppercase",
            color: "var(--ink-62)",
          }}
        >
          {hasAppt ? "Terminkarte" : "Mitgliedskarte"}
        </span>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(28px,4vw,36px)",
            fontWeight: 300,
            letterSpacing: "-.02em",
          }}
        >
          {hasAppt ? "Bis bald." : "Deine Karte."}
        </h1>
      </div>

      <div
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={flip}
        style={{
          width: "min(370px,100%)",
          aspectRatio: "1.586/1",
          perspective: "1200px",
          cursor: "pointer",
          animation: hasAppt
            ? "cardIn 1.8s cubic-bezier(.22,1,.36,1) .1s both"
            : "up 1.8s cubic-bezier(.22,1,.36,1) .15s both",
        }}
      >
        <div
          ref={cardRef}
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            transformStyle: "preserve-3d",
            transition: "transform 1.2s cubic-bezier(.22,1,.36,1)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
              transition: "transform 1.6s cubic-bezier(.22,1,.36,1)",
              transform: `rotateY(${st.flipped ? "180deg" : "0deg"})`,
            }}
          >
            {/* front */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                borderRadius: 24,
                overflow: "hidden",
                background: cs.base,
                color: cs.text,
                boxShadow:
                  "0 44px 80px -30px rgba(10,20,40,.6),inset 0 0 0 1px rgba(255,255,255,.22)",
              }}
            >
              {/* the chosen design stays the face — with or without a Termin */}
              <div
                style={{
                  position: "absolute",
                  inset: "-6%",
                  backgroundImage: cs.front,
                  backgroundSize: "cover",
                  backgroundPosition: "48% 42%",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: hasAppt
                    ? "linear-gradient(180deg,rgba(8,12,20,.35) 0%,rgba(8,12,20,0) 30%,rgba(8,12,20,.4) 58%,rgba(8,12,20,.85) 100%)"
                    : cs.overlay,
                }}
              />
              <div
                ref={sheenRef}
                style={{
                  position: "absolute",
                  inset: "-40%",
                  background:
                    "linear-gradient(115deg,transparent 42%,rgba(255,255,255,.2) 50%,transparent 58%)",
                  transform: "translateX(-20%)",
                  transition: "transform 1.2s cubic-bezier(.22,1,.36,1)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  padding: hasAppt ? "20px 22px" : "22px 24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 5 }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: 9.5,
                        letterSpacing: ".38em",
                      }}
                    >
                      SALON 15
                    </span>
                    {hasAppt ? (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontFamily: "var(--font-geist-mono)",
                          fontSize: 8,
                          letterSpacing: ".24em",
                          color: "#F4A69E",
                        }}
                      >
                        <span
                          data-loop
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: "#F4A69E",
                            animation: "ping 2.8s ease-out infinite",
                          }}
                        />
                        TERMIN
                      </span>
                    ) : (
                      <span
                        style={{
                          fontFamily: "var(--font-geist-mono)",
                          fontSize: 8,
                          letterSpacing: ".24em",
                          color: "rgba(244,247,250,.6)",
                        }}
                      >
                        MEMBER
                      </span>
                    )}
                  </div>
                  {hasAppt ? (
                    <span
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: 9.5,
                        letterSpacing: ".2em",
                        textAlign: "right",
                      }}
                    >
                      {apptShort}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 200,
                        letterSpacing: ".06em",
                      }}
                    >
                      {T.r}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    gap: 12,
                  }}
                >
                  {hasAppt ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 46,
                          fontWeight: 200,
                          letterSpacing: "-.045em",
                          lineHeight: 0.9,
                        }}
                      >
                        {st.appt!.time}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "rgba(244,247,250,.8)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {apptSvc}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-geist-mono)",
                          fontSize: 8.5,
                          letterSpacing: ".18em",
                          color: "rgba(244,247,250,.62)",
                        }}
                      >
                        {salAddrUpper}
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                        minWidth: 0,
                      }}
                    >
                      <span style={{ fontSize: 18, fontWeight: 400 }}>
                        {fullName}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-geist-mono)",
                          fontSize: 9,
                          letterSpacing: ".2em",
                          color: "rgba(244,247,250,.7)",
                        }}
                      >
                        N° {U.no} · {T.n.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span
                    style={{
                      flex: "none",
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 9,
                      letterSpacing: ".2em",
                      color: "rgba(244,247,250,.7)",
                    }}
                  >
                    {hasAppt ? `N° ${U.no}` : `SEIT ${sinceShort}`}
                  </span>
                </div>
              </div>
            </div>
            {FACE_BACK}
          </div>
        </div>
      </div>

      {hasAppt ? (
        <div
          style={{
            display: "flex",
            gap: 8,
            animation: "up 1.6s cubic-bezier(.22,1,.36,1) .4s both",
          }}
        >
          <a
            href={`https://maps.apple.com/?q=${q}`}
            target="_blank"
            className="glass-light"
            style={{
              height: 42,
              display: "flex",
              alignItems: "center",
              padding: "0 18px",
              borderRadius: 999,
              color: "#0E141C",
              fontSize: 12,
              textDecoration: "none",
            }}
          >
            Route
          </a>
          <a
            href={salon.tel}
            className="glass-light"
            style={{
              height: 42,
              display: "flex",
              alignItems: "center",
              padding: "0 18px",
              borderRadius: 999,
              color: "#0E141C",
              fontSize: 12,
              textDecoration: "none",
            }}
          >
            Anrufen
          </a>
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "var(--ink-60)",
            animation: "fade 1.6s ease .5s both",
          }}
        >
          Tippen zum Wenden
        </span>
        <a
          href="/api/wallet/pass"
          onClick={(e) => {
            // Only Safari hands a pass straight to Wallet on iPhone; Chrome &
            // in-app browsers save it as a download instead.
            const ua = navigator.userAgent;
            const iOS = /iPhone|iPad|iPod/.test(ua);
            if (
              iOS &&
              /CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|Instagram|FBAN|FBAV|Line\/|DuckDuckGo|Snapchat|musical_ly/.test(
                ua,
              )
            ) {
              e.preventDefault();
              const url = window.location.origin + "/card";
              say(
                copyText(url)
                  ? "Bitte in Safari öffnen – Link ist kopiert"
                  : "Bitte salon15.ch in Safari öffnen",
              );
            }
          }}
          className="glass-dark"
          style={{
            height: 46,
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderRadius: 999,
            padding: "0 22px",
            fontSize: 12.5,
            fontWeight: 500,
            border: 0,
            color: "inherit",
            textDecoration: "none",
            animation: "up 1.6s cubic-bezier(.22,1,.36,1) .6s both",
          }}
        >
          Zur Wallet hinzufügen
        </a>
      </div>
    </div>
  );
}
