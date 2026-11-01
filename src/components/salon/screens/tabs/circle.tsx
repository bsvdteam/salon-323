"use client";

import { useEffect, useRef, useState } from "react";
import { useSalon } from "../../store";
import { tiers, mon, type Invite } from "@/lib/data";
import { copyText, inviteMessage, inviteUrl, shareText } from "@/lib/share";

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

/** Everyone below a node (direct invites and theirs, all the way down). */
const countAll = (list: Invite[]): number =>
  list.reduce((s, n) => s + 1 + countAll(n.kids), 0);
const depthOf = (list: Invite[]): number =>
  list.length ? 1 + Math.max(...list.map((n) => depthOf(n.kids))) : 0;
const findNode = (list: Invite[], id: string | null): Invite | null => {
  if (!id) return null;
  for (const n of list) {
    if (n.id === id) return n;
    const k = findNode(n.kids, id);
    if (k) return k;
  }
  return null;
};

// Node size per ring: the first generation largest, smaller outward.
const SIZES = [38, 24, 18, 14, 11];

type OrbitNode = {
  x: number;
  y: number;
  size: number;
  label: string;
  on: boolean;
  free: boolean;
  pick: () => void;
};

/**
 * One circle as concentric rings: the person in the middle, everyone they
 * invited on ring 1, the people those invited on ring 2 … The rings grow
 * outward with the tree. Angles follow the tree (radial layout): every branch
 * gets a slice sized by how many leaves it has, so a growing branch spreads.
 */
function Orbit({
  center,
  kids,
  selId,
  onPick,
  onCenter,
  freeSlots = 0,
}: {
  center: string;
  kids: Invite[];
  selId: string | null;
  onPick: (id: string) => void;
  onCenter: () => void;
  freeSlots?: number; // dashed "free place" dots on ring 1 (own circle only)
}) {
  const D = Math.max(1, Math.min(5, depthOf(kids)));
  // Ring radii (% of the box): far enough apart that a chain of circles
  // never overlaps (gap from the node sizes, box ≈ 340 px), then stretched
  // so the outermost ring sits near the edge.
  const radii = [D === 1 ? 31 : 18];
  for (let l = 1; l < D; l++)
    radii.push(
      radii[l - 1] + (((SIZES[l - 1] + SIZES[l]) / 2 + 6) / 340) * 100,
    );
  const last = radii[D - 1];
  if (D > 1 && last < 46)
    for (let l = 1; l < D; l++)
      radii[l] = 18 + ((radii[l] - 18) * (46 - 18)) / (last - 18);
  const radius = (level: number) => radii[level - 1];

  const nodes: OrbitNode[] = [];
  const lines: { x1: number; y1: number; x2: number; y2: number; o: number }[] =
    [];
  const weight = (n: Invite): number =>
    n.kids.length ? n.kids.reduce((s, k) => s + weight(k), 0) : 1;

  const place = (
    list: Invite[],
    level: number,
    from: number,
    span: number,
    px: number,
    py: number,
  ) => {
    const total = list.reduce((s, n) => s + weight(n), 0) || 1;
    let a = from;
    for (const n of list) {
      const w = (weight(n) / total) * span;
      const ang = a + w / 2;
      a += w;
      const r = radius(level);
      const x = 50 + r * Math.cos(rad(ang));
      const y = 50 + r * Math.sin(rad(ang));
      lines.push({
        x1: px,
        y1: py,
        x2: x,
        y2: y,
        o: level === 1 ? 0.22 : 0.13,
      });
      nodes.push({
        x,
        y,
        size: SIZES[level - 1] ?? 12,
        label: n.name,
        on: selId === n.id,
        free: false,
        pick: () => onPick(n.id),
      });
      if (level < 5) place(n.kids, level + 1, ang - w / 2, w, x, y);
    }
  };

  // ring 1 shares the full turn between the real people and the free dots
  const real = kids.reduce((s, n) => s + weight(n), 0);
  const slots = real + freeSlots;
  place(kids, 1, -90, slots ? (360 * real) / slots : 360, 50, 50);
  for (let k = 0; k < freeSlots; k++) {
    const ang = -90 + (360 * (real + k + 0.5)) / slots;
    nodes.push({
      x: 50 + radius(1) * Math.cos(rad(ang)),
      y: 50 + radius(1) * Math.sin(rad(ang)),
      size: 16,
      label: "",
      on: false,
      free: true,
      pick: () => {},
    });
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 340,
        aspectRatio: "1/1",
      }}
    >
      {/* one ring per generation, growing outward */}
      {Array.from({ length: D }, (_, i) => {
        const r = radius(i + 1);
        return (
          <div
            key={"r" + i}
            style={{
              position: "absolute",
              inset: P(50 - r),
              borderRadius: "50%",
              border: `1px ${i ? "dashed" : "solid"} rgba(14,20,28,${i ? 0.09 : 0.12})`,
            }}
          />
        );
      })}
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
        {lines.map((l, i) => (
          <span
            key={"l" + i}
            style={{
              position: "absolute",
              left: P(l.x1),
              top: P(l.y1),
              width: P(Math.hypot(l.x2 - l.x1, l.y2 - l.y1)),
              height: 1,
              transformOrigin: "0 50%",
              transform: `rotate(${(Math.atan2(l.y2 - l.y1, l.x2 - l.x1) * 180) / Math.PI}deg)`,
              background: `linear-gradient(90deg,rgba(14,20,28,${l.o}),rgba(14,20,28,${l.o / 3}))`,
            }}
          />
        ))}
        {nodes.map((n, i) => (
          <button
            key={"n" + i}
            onClick={n.pick}
            aria-label={n.label || "Freier Platz"}
            style={{
              position: "absolute",
              left: P(n.x),
              top: P(n.y),
              width: n.size,
              height: n.size,
              margin: `${-n.size / 2}px 0 0 ${-n.size / 2}px`,
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
                fontSize: n.size >= 38 ? 11 : n.size >= 24 ? 9 : 7,
                fontWeight: 600,
                background: n.free
                  ? "transparent"
                  : n.size >= 38
                    ? LGN
                    : "rgba(255,255,255,.5)",
                border: n.free
                  ? "1px dashed rgba(14,20,28,.4)"
                  : `1px solid ${n.on ? "#0E141C" : "rgba(255,255,255,.9)"}`,
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                boxShadow: n.on
                  ? "0 10px 30px -10px rgba(14,20,28,.5)"
                  : n.free
                    ? "none"
                    : "0 10px 24px -16px rgba(14,20,28,.4)",
                transform: n.on ? "scale(1.12)" : "none",
                transition: "all .9s cubic-bezier(.22,1,.36,1)",
                animation: "spinr 180s linear infinite",
              }}
            >
              {n.size >= 18 ? ini(n.label) : ""}
            </span>
          </button>
        ))}
      </div>
      <button
        onClick={onCenter}
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
        {center}
      </button>
    </div>
  );
}

export function CircleTab() {
  const { state, set, say } = useSalon();
  const st = state;
  const U = st.user ?? {
    first: "Luca",
    last: "Meier",
    cuts: 41,
    since: [2, 2024] as [number, number],
  };
  const INV = st.invites ?? [];
  const direct = INV.length;
  const total = countAll(INV);
  const ti = tiers.reduce((acc, t, k) => (U.cuts >= t.min ? k : acc), 0);
  const T = tiers[ti];
  const initials = (U.first[0] + (U.last?.[0] || "")).toUpperCase();

  // the tapped person — their circle opens next to mine
  const sel = findNode(INV, st.circleSel);
  const pick = (id: string) =>
    set({ circleSel: st.circleSel === id ? null : id });
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // on a phone the panel sits below — bring it into view
    if (sel && window.innerWidth < 760)
      window.scrollTo({
        // vertical only — scrollIntoView could also pan the page sideways
        top:
          (panelRef.current?.getBoundingClientRect().top ?? 0) +
          window.scrollY -
          80,
        behavior: "smooth",
      });
  }, [sel]);

  const cap = sel
    ? {
        name: sel.name,
        meta: sel.meta,
        tag:
          "Tier " +
          sel.tag +
          (sel.kids.length
            ? ` · ${countAll(sel.kids)} im Circle`
            : " · noch niemand eingeladen"),
      }
    : {
        name: total
          ? total + (total === 1 ? " Person" : " Personen") + " durch dich"
          : "Dein Circle ist noch leer",
        meta: total
          ? `${direct} direkt eingeladen · tippe auf einen Kreis`
          : "Teil deinen Code – jeder Kreis ist jemand, den du mitbringst.",
        tag: "Tier " + T.r + " · " + T.n,
      };

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

  const inviteCard = (
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
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: "clamp(28px,6vw,36px)",
            fontWeight: 300,
            letterSpacing: ".24em",
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
          Ohne Limit – teil ihn mit Leuten, denen du vertraust. Name und alles
          Weitere erfassen sie selbst.
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
      </div>
      <span style={{ fontSize: 12, color: "rgba(244,247,250,.65)" }}>
        {direct
          ? `${direct} direkt eingeladen · ${total} insgesamt`
          : "Noch niemand eingeladen"}
      </span>
    </div>
  );

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
        <span style={kick}>Circle</span>
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

      {/* who brought me in: their circle → me */}
      <div
        className="glass-light"
        style={{
          alignSelf: "flex-start",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 18px 10px 10px",
          borderRadius: 999,
          color: "#0E141C",
          animation: "up 1.5s cubic-bezier(.22,1,.36,1) .1s both",
        }}
      >
        {st.myInviter ? (
          <>
            <span style={{ display: "flex", alignItems: "center" }}>
              <span style={avatar(false)}>{ini(st.myInviter)}</span>
              <span
                style={{
                  width: 18,
                  height: 1,
                  background:
                    "linear-gradient(90deg,rgba(14,20,28,.35),rgba(14,20,28,.12))",
                }}
              />
              <span className="glass-dark" style={avatar(true)}>
                {initials}
              </span>
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ ...kick, fontSize: 8.5 }}>Eingeladen von</span>
              <span style={{ fontSize: 14.5, fontWeight: 500 }}>
                {st.myInviter}
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: 12,
                    color: "var(--ink-60)",
                  }}
                >
                  {" "}
                  · seit {mon[U.since[0]].slice(0, 3)} {U.since[1]}
                </span>
              </span>
            </span>
          </>
        ) : (
          <>
            <span className="glass-dark" style={avatar(true)}>
              {initials}
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ ...kick, fontSize: 8.5 }}>Gründungsmitglied</span>
              <span style={{ fontSize: 14.5, fontWeight: 500 }}>
                Von Anfang an dabei
              </span>
            </span>
          </>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(330px,100%),1fr))",
          gap: 20,
          alignItems: "start",
        }}
      >
        {/* my circle */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Orbit
            center={initials}
            kids={INV}
            selId={st.circleSel}
            onPick={pick}
            onCenter={() => set({ circleSel: null })}
            freeSlots={Math.max(0, 3 - direct)}
          />
          <div
            style={{
              minHeight: 72,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
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

        {/* their circle, side by side with mine — or my invite code */}
        {sel ? (
          <div
            ref={panelRef}
            key={sel.id}
            className="glass-light"
            style={{
              borderRadius: 34,
              padding: "18px 18px 22px",
              color: "#0E141C",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              animation: "up 1.1s cubic-bezier(.22,1,.36,1) both",
            }}
          >
            <div
              style={{
                alignSelf: "stretch",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={kick}>Circle von {sel.name.split(" ")[0]}</span>
              <button
                onClick={() => set({ circleSel: null })}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "var(--ink-62)",
                  fontSize: 12,
                  padding: "6px 2px",
                }}
              >
                Schliessen
              </button>
            </div>
            <Orbit
              center={ini(sel.name)}
              kids={sel.kids}
              selId={null}
              onPick={pick}
              onCenter={() => {}}
            />
            <span
              style={{
                fontSize: 12.5,
                color: "var(--ink-62)",
                textAlign: "center",
              }}
            >
              {sel.kids.length
                ? `${sel.name.split(" ")[0]} hat ${countAll(sel.kids)} ${countAll(sel.kids) === 1 ? "Person" : "Personen"} mitgebracht · tippe weiter`
                : `${sel.name.split(" ")[0]} hat noch niemanden eingeladen.`}
            </span>
          </div>
        ) : (
          inviteCard
        )}
      </div>
      {sel && inviteCard}
    </div>
  );
}

const avatar = (dark: boolean): React.CSSProperties => ({
  flex: "none",
  width: 36,
  height: 36,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  fontSize: 11,
  fontWeight: 600,
  ...(dark
    ? { border: 0 }
    : {
        background: LGN,
        border: "1px solid rgba(255,255,255,.9)",
        color: "#0E141C",
      }),
});

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
