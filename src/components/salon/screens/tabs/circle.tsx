"use client";

import { useSalon } from "../../store";
import { tiers, type Invite } from "@/lib/data";
import { generateInviteAction } from "@/lib/actions";

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
  const free = 3 - used;
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

  [0, 1, 2].forEach((k) => {
    const ang = -90 + k * 120;
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
        bg: n.pending ? "rgba(255,255,255,.2)" : LGN,
        bs: n.pending ? "dashed" : "solid",
        border: on
          ? "#0E141C"
          : n.pending
            ? "rgba(14,20,28,.35)"
            : "rgba(255,255,255,.9)",
        shadow: on
          ? "0 10px 30px -10px rgba(14,20,28,.5)"
          : "0 10px 24px -16px rgba(14,20,28,.4)",
        pick: () => set({ circleSel: on ? null : key }),
      });
      (n.kids || []).forEach((c, ci, arr) => {
        const b = ang + (ci - (arr.length - 1) / 2) * 26;
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
          tag: n.pending ? "Code " + n.code : "Tier " + n.tag,
        }
      : {
          name: "Freier Platz",
          meta: "Lade jemanden ein, dem du vertraust.",
          tag: "Open",
        };
  }
  if (!cap) {
    const total = INV.filter((n) => !n.pending).reduce(
      (acc, n) => acc + 1 + (n.kids || []).length,
      0,
    );
    cap = {
      name: total
        ? total + (total === 1 ? " Person" : " Personen") + " durch dich"
        : "Dein Circle ist noch leer",
      meta: used + " von 3 Plätzen · tippe auf einen Punkt",
      tag: "Tier " + T.r + " · " + T.n,
    };
  }

  const credit = Math.max(
    0,
    INV.filter((i) => !i.pending).length * 5 - (st.creditUsed || 0),
  );

  const createInvite = () => {
    const name = st.newInv.trim();
    if (!name || INV.length >= 3 || st.busy) return;
    set({ busy: true });
    // The server creates the invite (inviter = the logged-in member, 3-limit).
    generateInviteAction(name).then((res) => {
      set({ busy: false });
      if (res.ok) {
        set((p) => ({
          invites: [
            ...(p.invites || []),
            {
              name,
              meta: "Einladung offen · noch 7 Tage",
              tag: "OFFEN",
              pending: true,
              code: res.code,
            },
          ],
          lastCode: { code: res.code, name },
          newInv: "",
        }));
      } else {
        say(
          res.error === "limit"
            ? "Einladungs-Limit erreicht (max. 3)"
            : "Konnte keinen Code erstellen",
        );
      }
    });
  };
  const copyCode = () => {
    try {
      navigator.clipboard?.writeText(st.lastCode?.code || "");
    } catch {}
    set({ copied: true });
    setTimeout(() => set({ copied: false }), 2000);
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
          <span style={kickD}>Neue Einladung</span>
          {!st.lastCode && free > 0 && (
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
                  fontSize: 13,
                  color: "rgba(244,247,250,.7)",
                  lineHeight: 1.6,
                  textWrap: "pretty",
                }}
              >
                Nur der Vorname. Den Rest erfasst dein Gast selbst – der Code
                gilt einmal, nur für ihn, 7 Tage.
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  height: 54,
                  padding: "0 6px 0 20px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.07)",
                  border: "1px solid rgba(255,255,255,.12)",
                }}
              >
                <input
                  value={st.newInv}
                  onChange={(e) => set({ newInv: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createInvite();
                  }}
                  placeholder="Vorname"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: "transparent",
                    border: 0,
                    color: "#F4F7FA",
                    fontFamily: "var(--font-urbanist)",
                    fontSize: 16,
                  }}
                />
                <button
                  onClick={createInvite}
                  style={{
                    flex: "none",
                    height: 42,
                    padding: "0 18px",
                    borderRadius: 999,
                    border: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    transition: "all .8s cubic-bezier(.22,1,.36,1)",
                    background: st.newInv.trim()
                      ? "#F4F7FA"
                      : "rgba(255,255,255,.1)",
                    color: st.newInv.trim()
                      ? "#0E141C"
                      : "rgba(244,247,250,.45)",
                    pointerEvents: st.newInv.trim() ? "auto" : "none",
                  }}
                >
                  Erstellen
                </button>
              </div>
            </div>
          )}
          {st.lastCode && (
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
                }}
              >
                {st.lastCode.code}
              </span>
              <span style={{ fontSize: 12, color: "rgba(244,247,250,.65)" }}>
                Für {st.lastCode.name} · einmalig · 7 Tage gültig
              </span>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={copyCode}
                  style={{
                    height: 42,
                    border: 0,
                    borderRadius: 999,
                    background: "#F4F7FA",
                    color: "#0E141C",
                    padding: "0 20px",
                    fontSize: 12,
                    fontWeight: 600,
                    minWidth: 110,
                  }}
                >
                  {st.copied ? "Kopiert ✓" : "Kopieren"}
                </button>
                <button
                  onClick={() => say("Link kopiert")}
                  style={{
                    height: 42,
                    border: "1px solid rgba(255,255,255,.18)",
                    background: "transparent",
                    color: "#F4F7FA",
                    borderRadius: 999,
                    padding: "0 18px",
                    fontSize: 12,
                  }}
                >
                  Link teilen
                </button>
                <button
                  onClick={() => set({ lastCode: null })}
                  style={{
                    height: 42,
                    border: 0,
                    background: "transparent",
                    color: "rgba(244,247,250,.6)",
                    padding: "0 8px",
                    fontSize: 12,
                  }}
                >
                  Fertig
                </button>
              </div>
            </div>
          )}
          {!st.lastCode && free <= 0 && (
            <span style={{ fontSize: 13, color: "rgba(244,247,250,.7)" }}>
              Alle Plätze vergeben. Neue gibt es mit dem nächsten Tier.
            </span>
          )}
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
              {[0, 1, 2].map((k) => (
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
            {used} von 3 vergeben
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              paddingTop: 16,
              borderTop: "1px solid rgba(255,255,255,.1)",
            }}
          >
            <span
              style={{
                fontSize: 12,
                lineHeight: 1.55,
                color: "rgba(244,247,250,.68)",
                textWrap: "pretty",
              }}
            >
              CHF 5 pro Einladung – gutgeschrieben, sobald dein Gast zum ersten
              Mal im Stuhl war.
            </span>
            <span style={{ flex: "none", fontSize: 18, fontWeight: 300 }}>
              CHF {credit}
            </span>
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
const kickD: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono)",
  fontSize: 9,
  letterSpacing: ".22em",
  textTransform: "uppercase",
  color: "rgba(244,247,250,.62)",
};
