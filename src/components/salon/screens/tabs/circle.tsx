"use client";

import { useState } from "react";
import { useSalon } from "../../store";
import { tiers, type Invite } from "@/lib/data";
import { copyText, inviteMessage, inviteUrl, shareText } from "@/lib/share";

/** People who can join with one member's code (DB: INVITE_LIMIT). */
const LIMIT = 5;

const LGN =
  "linear-gradient(160deg,rgba(255,255,255,.75),rgba(255,255,255,.35))";
const ini = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const rad = (deg: number) => (deg * Math.PI) / 180;
const P = (v: number) => v.toFixed(2) + "%";

export function CircleTab() {
  const { state, set, say } = useSalon();
  const st = state;
  const U = st.user ?? { first: "Luca", last: "Meier", cuts: 41, no: "0047" };
  const INV = st.invites ?? [];
  const used = INV.length;
  const free = Math.max(0, LIMIT - used);
  const slots = Math.max(LIMIT, used);
  const ti = tiers.reduce((acc, t, k) => (U.cuts >= t.min ? k : acc), 0);
  const T = tiers[ti];
  const selKey = st.circleSel;
  const initials = (U.first[0] + (U.last?.[0] || "")).toUpperCase();

  // ── orbit ──
  const orbitNodes: {
    x: string;
    y: string;
    size: string;
    m: string;
    fs: string;
    ini: string;
    bg: string;
    bs: string;
    border: string;
    shadow: string;
    pick: () => void;
  }[] = [];
  const orbitLines: {
    x: string;
    y: string;
    len: string;
    a: string;
    o1: number;
    o2: number;
  }[] = [];
  const line = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    o1: number,
    o2: number,
  ) =>
    orbitLines.push({
      x: P(x1),
      y: P(y1),
      len: P(Math.hypot(x2 - x1, y2 - y1)),
      a: (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI + "deg",
      o1,
      o2,
    });

  Array.from({ length: slots }, (_, k) => k).forEach((k) => {
    const ang = -90 + k * (360 / slots);
    const x = 50 + 31 * Math.cos(rad(ang));
    const y = 50 + 31 * Math.sin(rad(ang));
    const n = INV[k] as Invite | undefined;
    const key = "i" + k;
    const on = selKey === key;
    if (n) {
      line(50, 50, x, y, 0.25, 0.08);
      orbitNodes.push({
        x: P(x),
        y: P(y),
        size: "44px",
        m: "-22px 0 0 -22px",
        fs: "11px",
        ini: ini(n.name),
        bg: LGN,
        bs: "solid",
        border: on ? "#0E141C" : "rgba(255,255,255,.9)",
        shadow: on
          ? "0 10px 30px -10px rgba(14,20,28,.5)"
          : "0 10px 24px -16px rgba(14,20,28,.4)",
        pick: () => set({ circleSel: on ? null : key }),
      });
      (n.kids || []).forEach((c, ci, arr) => {
        const b = ang + (ci - (arr.length - 1) / 2) * 18;
        const cx = 50 + 45 * Math.cos(rad(b));
        const cy = 50 + 45 * Math.sin(rad(b));
        const ck = key + "c" + ci;
        const con = selKey === ck;
        line(x, y, cx, cy, 0.16, 0.05);
        orbitNodes.push({
          x: P(cx),
          y: P(cy),
          size: "30px",
          m: "-15px 0 0 -15px",
          fs: "9px",
          ini: ini(c.name),
          bg: "rgba(255,255,255,.45)",
          bs: "solid",
          border: con ? "#0E141C" : "rgba(255,255,255,.85)",
          shadow: "none",
          pick: () => set({ circleSel: con ? null : ck }),
        });
      });
    } else {
      orbitNodes.push({
        x: P(x),
        y: P(y),
        size: "18px",
        m: "-9px 0 0 -9px",
        fs: "0px",
        ini: "",
        bg: "transparent",
        bs: "dashed",
        border: on ? "#0E141C" : "rgba(14,20,28,.4)",
        shadow: "none",
        pick: () => set({ circleSel: on ? null : key }),
      });
    }
  });

  // caption
  let cap: { name: string; meta: string; tag: string } | undefined;
  if (selKey && selKey.includes("c")) {
    const [pk, ck] = selKey.slice(1).split("c").map(Number);
    const c = INV[pk]?.kids?.[ck];
    if (c) cap = { name: c.name, meta: c.meta, tag: "Tier " + c.tag };
  } else if (selKey) {
    const n = INV[+selKey.slice(1)];
    cap = n
      ? {
          name: n.name,
          meta: n.meta,
          tag: "Tier " + n.tag,
        }
      : {
          name: "Freier Platz",
          meta: "Teil deinen Code mit jemandem, dem du vertraust.",
          tag: "Open",
        };
  }
  if (!cap) {
    const total = INV.reduce((acc, n) => acc + 1 + (n.kids || []).length, 0);
    cap = {
      name: total
        ? total + (total === 1 ? " Person" : " Personen") + " durch dich"
        : "Dein Circle ist noch leer",
      meta: `${Math.min(used, LIMIT)} von ${LIMIT} Plätzen · tippe auf einen Punkt`,
      tag: "Tier " + T.r + " · " + T.n,
    };
  }

  // Copy/share run straight in the tap handler — iOS only allows clipboard
  // and share sheet during the gesture (nothing is awaited before).
  const code = st.refCode;
  const [done, setDone] = useState<"" | "link" | "code">("");
  const flash = (what: "link" | "code") => {
    setDone(what);
    setTimeout(() => setDone(""), 2200);
  };
  const share = () => {
    if (!code) return;
    shareText({
      title: "Einladung zu Salon 15",
      text: inviteMessage(code),
      url: inviteUrl(code),
    }).then((r) => {
      if (r === "copied") say("Einladung kopiert – jetzt einfügen");
      else if (r === "failed") say("Kopieren ging nicht – Code: " + code);
    });
  };
  const copy = (what: "link" | "code") => {
    if (!code) return;
    if (copyText(what === "link" ? inviteUrl(code) : code)) flash(what);
    else say("Kopieren ging nicht – Code: " + code);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          animation: "up 1.4s cubic-bezier(.22,1,.36,1) both",
        }}
      >
        <span style={kick}>
          {st.myInviter ? `Invited by ${st.myInviter}` : "Gründungsmitglied"}
        </span>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(28px,4.4vw,40px)",
            fontWeight: 300,
            letterSpacing: "-.025em",
          }}
        >
          Dein Circle.
        </h1>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(330px,100%),1fr))",
          gap: 20,
          alignItems: "center",
        }}
      >
        {/* orbit */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 340,
              aspectRatio: "1/1",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "19%",
                borderRadius: "50%",
                border: "1px solid rgba(14,20,28,.12)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: "5%",
                borderRadius: "50%",
                border: "1px dashed rgba(14,20,28,.1)",
              }}
            />
            <div
              data-loop
              style={{
                position: "absolute",
                inset: "30%",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle,rgba(244,166,158,.35),transparent 70%)",
                animation: "breathe 9s ease-in-out infinite",
              }}
            />
            <div
              data-loop
              style={{
                position: "absolute",
                inset: 0,
                animation: "spin 180s linear infinite",
              }}
            >
              {orbitLines.map((l, i) => (
                <span
                  key={"l" + i}
                  style={{
                    position: "absolute",
                    left: l.x,
                    top: l.y,
                    width: l.len,
                    height: 1,
                    transformOrigin: "0 50%",
                    transform: `rotate(${l.a})`,
                    background: `linear-gradient(90deg,rgba(14,20,28,${l.o1}),rgba(14,20,28,${l.o2}))`,
                  }}
                />
              ))}
              {orbitNodes.map((n, i) => (
                <button
                  key={"n" + i}
                  onClick={n.pick}
                  style={{
                    position: "absolute",
                    left: n.x,
                    top: n.y,
                    width: n.size,
                    height: n.size,
                    margin: n.m,
                    padding: 0,
                    border: 0,
                    background: "transparent",
                    color: "#0E141C",
                  }}
                >
                  <span
                    data-loop
                    style={{
                      display: "grid",
                      placeItems: "center",
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      fontSize: n.fs,
                      fontWeight: 600,
                      background: n.bg,
                      border: `1px ${n.bs} ${n.border}`,
                      backdropFilter: "blur(18px)",
                      WebkitBackdropFilter: "blur(18px)",
                      boxShadow: n.shadow,
                      transition: "all .9s cubic-bezier(.22,1,.36,1)",
                      animation: "spinr 180s linear infinite",
                    }}
                  >
                    {n.ini}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => set({ circleSel: null })}
              className="glass-dark"
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 64,
                height: 64,
                margin: "-32px 0 0 -32px",
                borderRadius: "50%",
                fontSize: 13,
                fontWeight: 600,
                border: 0,
              }}
            >
              {initials}
            </button>
          </div>
          <div
            style={{
              minHeight: 72,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              textAlign: "center",
              paddingTop: 10,
            }}
          >
            <div
              key={cap.name + cap.tag}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                animation: "up 1s cubic-bezier(.22,1,.36,1) both",
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 400 }}>{cap.name}</span>
              <span style={{ fontSize: 12, color: "var(--ink-62)" }}>
                {cap.meta}
              </span>
              <span style={{ ...kick, paddingTop: 2 }}>{cap.tag}</span>
            </div>
          </div>
        </div>

        {/* invite creator */}
        <div
          className="glass-dark"
          style={{
            borderRadius: 34,
            padding: 24,
            animation: "up 1.6s cubic-bezier(.22,1,.36,1) .2s both",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <span style={kickD}>Dein Einladungscode</span>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              animation: "fade 1s ease both",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: "clamp(28px,6vw,36px)",
                fontWeight: 300,
                letterSpacing: ".24em",
                opacity: free > 0 ? 1 : 0.45,
              }}
            >
              {code || "······"}
            </span>
            <span
              style={{
                fontSize: 13,
                color: "rgba(244,247,250,.7)",
                lineHeight: 1.6,
                textWrap: "pretty",
              }}
            >
              {free > 0
                ? `Bis zu ${LIMIT} Leute können damit beitreten. Name und alles Weitere erfassen sie selbst.`
                : `Alle ${LIMIT} Plätze vergeben – dein Code ist ausgeschöpft.`}
            </span>
            {free > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={share}
                  style={{
                    height: 44,
                    border: 0,
                    borderRadius: 999,
                    background: "#F4F7FA",
                    color: "#0E141C",
                    padding: "0 22px",
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  Einladung teilen
                </button>
                <button onClick={() => copy("link")} style={ghostBtn}>
                  {done === "link" ? "Link kopiert ✓" : "Link kopieren"}
                </button>
                <button onClick={() => copy("code")} style={ghostBtn}>
                  {done === "code" ? "Code kopiert ✓" : "Code kopieren"}
                </button>
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12,
              color: "rgba(244,247,250,.65)",
            }}
          >
            <span style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: LIMIT }, (_, k) => (
                <span
                  key={k}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 9,
                    background: k < used ? "#F4F7FA" : "transparent",
                    border: `1px solid ${k < used ? "#F4F7FA" : "rgba(255,255,255,.45)"}`,
                  }}
                />
              ))}
            </span>
            {Math.min(used, LIMIT)} von {LIMIT} genutzt
          </div>
        </div>
      </div>
    </div>
  );
}

const kick: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono)",
  fontSize: 9,
  letterSpacing: ".22em",
  textTransform: "uppercase",
  color: "var(--ink-62)",
};
const ghostBtn: React.CSSProperties = {
  height: 44,
  border: "1px solid rgba(255,255,255,.18)",
  background: "transparent",
  color: "#F4F7FA",
  borderRadius: 999,
  padding: "0 18px",
  fontSize: 12,
};
const kickD: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono)",
  fontSize: 9,
  letterSpacing: ".22em",
  textTransform: "uppercase",
  color: "rgba(244,247,250,.62)",
};
