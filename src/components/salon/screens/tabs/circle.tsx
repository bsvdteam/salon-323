"use client";

import { useEffect, useState } from "react";
import { useSalon } from "../../store";
import { tierAt, mon, type Invite } from "@/lib/data";
import { copyText, inviteMessage, inviteUrl, shareText } from "@/lib/share";

const EZ = "cubic-bezier(.22,1,.36,1)";
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
/** The node with this id and the name of whoever brought it in. */
const findNode = (
  list: Invite[],
  id: string | null,
  parent: string | null = null,
): { n: Invite; parent: string | null } | null => {
  if (!id) return null;
  for (const n of list) {
    if (n.id === id) return { n, parent };
    const k = findNode(n.kids, id, n.name);
    if (k) return k;
  }
  return null;
};

// Node size per ring: the first generation largest, smaller outward.
const SIZES = [38, 24, 18, 14, 11];

type OrbitNode = {
  id: string;
  x: number;
  y: number;
  size: number;
  label: string;
  on: boolean;
  dim: boolean;
  k: number; // order, for the staggered entrance
};

/**
 * One circle as concentric rings: me in the middle, everyone I invited on
 * ring 1, the people those invited on ring 2 … the rings grow outward with
 * the tree. Angles follow the tree (radial layout): every branch gets a slice
 * sized by its leaves. With a focus, that person's branch stays lit and the
 * rest of the tree steps back.
 */
function Orbit({
  center,
  kids,
  focusId,
  centerOn,
  onPick,
  onCenter,
}: {
  center: string;
  kids: Invite[];
  focusId: string | null;
  centerOn: boolean;
  onPick: (id: string) => void;
  onCenter: () => void;
}) {
  const D = Math.max(1, Math.min(5, depthOf(kids)));
  // Ring radii (% of the box): far enough apart that a chain of circles never
  // overlaps (gap from the node sizes, box ≈ 340 px), then stretched so the
  // outermost ring sits near the edge.
  const radii = [D === 1 ? 31 : 18];
  for (let l = 1; l < D; l++)
    radii.push(
      radii[l - 1] + (((SIZES[l - 1] + SIZES[l]) / 2 + 6) / 340) * 100,
    );
  const last = radii[D - 1];
  if (D > 1 && last < 46)
    for (let l = 1; l < D; l++)
      radii[l] = 18 + ((radii[l] - 18) * (46 - 18)) / (last - 18);

  const nodes: OrbitNode[] = [];
  const lines: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    o: number;
    dim: boolean;
  }[] = [];
  const weight = (n: Invite): number =>
    n.kids.length ? n.kids.reduce((s, k) => s + weight(k), 0) : 1;

  const place = (
    list: Invite[],
    level: number,
    from: number,
    span: number,
    px: number,
    py: number,
    lit: boolean, // inside the focused branch
  ) => {
    const total = list.reduce((s, n) => s + weight(n), 0) || 1;
    let a = from;
    for (const n of list) {
      const w = (weight(n) / total) * span;
      const ang = a + w / 2;
      a += w;
      const r = radii[level - 1];
      const x = 50 + r * Math.cos(rad(ang));
      const y = 50 + r * Math.sin(rad(ang));
      const on = n.id === focusId;
      const inBranch = lit || on;
      lines.push({
        x1: px,
        y1: py,
        x2: x,
        y2: y,
        o: level === 1 ? 0.22 : 0.13,
        dim: !!focusId && !inBranch,
      });
      nodes.push({
        id: n.id,
        x,
        y,
        size: SIZES[level - 1] ?? 11,
        label: n.name,
        on,
        dim: !!focusId && !inBranch,
        k: nodes.length,
      });
      if (level < 5) place(n.kids, level + 1, ang - w / 2, w, x, y, inBranch);
    }
  };
  place(kids, 1, -90, 360, 50, 50, false);

  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "1/1" }}>
      {/* one ring per generation, growing outward */}
      {Array.from({ length: D }, (_, i) => (
        <div
          key={"r" + i}
          style={{
            position: "absolute",
            inset: P(50 - radii[i]),
            borderRadius: "50%",
            border: `1px ${i ? "dashed" : "solid"} rgba(14,20,28,${i ? 0.09 : 0.12})`,
            animation: `ringIn 1.4s ${EZ} ${0.1 + i * 0.12}s both`,
          }}
        />
      ))}
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
              opacity: l.dim ? 0.25 : 1,
              transition: `opacity .8s ${EZ}`,
            }}
          />
        ))}
        {nodes.map((n) => (
          <button
            key={n.id}
            onClick={() => onPick(n.id)}
            aria-label={n.label}
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
              animation: `nodeIn 1s ${EZ} ${0.25 + n.k * 0.04}s both`,
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
                background: n.on
                  ? "#0E141C"
                  : n.size >= 38
                    ? LGN
                    : "rgba(255,255,255,.55)",
                color: n.on ? "#F4F7FA" : "#0E141C",
                border: `1px solid ${n.on ? "#0E141C" : "rgba(255,255,255,.9)"}`,
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                boxShadow: n.on
                  ? "0 0 0 5px rgba(14,20,28,.08),0 14px 30px -10px rgba(14,20,28,.55)"
                  : "0 10px 24px -16px rgba(14,20,28,.4)",
                opacity: n.dim ? 0.28 : 1,
                transition: `all .8s ${EZ}`,
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
        aria-label="Du – einladen"
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
          boxShadow: centerOn
            ? "0 0 0 6px rgba(244,166,158,.35),0 18px 40px -14px rgba(14,20,28,.6)"
            : "0 14px 34px -16px rgba(14,20,28,.55)",
          transform: centerOn ? "scale(1.06)" : "none",
          transition: `all .8s ${EZ}`,
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
    since: [2, 2024] as [number, number],
  };
  const INV = st.invites ?? [];
  const direct = INV.length;
  const total = countAll(INV);
  const initials = (U.first[0] + (U.last?.[0] || "")).toUpperCase();

  // circleSel: null = just my circle, "me" = invite card, else a member id
  const sel = st.circleSel;
  const meOn = sel === "me";
  const hit = meOn ? null : findNode(INV, sel);
  const mode: "none" | "me" | "user" = meOn ? "me" : hit ? "user" : "none";
  const pick = (id: string) => set({ circleSel: sel === id ? null : id });
  const close = () => set({ circleSel: null });

  // side by side on wide screens; on phones the circle shrinks a little and
  // leans aside while the card glides in below
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 760px)");
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // me → circle to the left, invite card from the right;
  // someone → circle to the right, their card from the left
  const shift = mode === "me" ? -1 : mode === "user" ? 1 : 0;
  const orbitT = wide
    ? `translateX(${shift * 56}%)`
    : `translateX(${shift * 10}%) scale(${shift ? 0.78 : 1})`;

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

  const panel = (side: "left" | "right"): React.CSSProperties => ({
    width: wide ? "min(360px,46%)" : "100%",
    boxSizing: "border-box",
    borderRadius: 32,
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 18,
    ...(wide
      ? {
          position: "absolute",
          top: "50%",
          [side]: 0,
          translate: "0 -50%",
        }
      : { marginTop: 8 }),
    animation: `${side === "left" ? "panelL" : "panelR"} 1s ${EZ} both`,
  });

  const invitePanel = (
    <div key="me" className="glass-dark" style={panel("right")}>
      <div style={rowBetween}>
        <span style={kickD}>Dein Einladungscode</span>
        <button onClick={close} style={xBtnD} aria-label="Schliessen">
          ×
        </button>
      </div>
      <span
        style={{
          ...stagger(1),
          fontFamily: "var(--font-geist-mono)",
          fontSize: "clamp(30px,7vw,38px)",
          fontWeight: 300,
          letterSpacing: ".24em",
        }}
      >
        {code || "······"}
      </span>
      <div style={{ ...stagger(2), display: "flex", gap: 8, flexWrap: "wrap" }}>
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
          {done === "link" ? "Link ✓" : "Link"}
        </button>
        <button onClick={() => copy("code")} style={ghostBtn}>
          {done === "code" ? "Code ✓" : "Code"}
        </button>
      </div>
      <div
        style={{
          ...stagger(3),
          height: 1,
          background: "rgba(255,255,255,.12)",
        }}
      />
      <div style={{ ...stagger(4), ...rowBetween, alignItems: "flex-end" }}>
        <span style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <span style={kickD}>
            {st.myInviter ? "Eingeladen von" : "Gründungsmitglied"}
          </span>
          <span style={{ fontSize: 14.5, fontWeight: 500 }}>
            {st.myInviter || "Von Anfang an dabei"}
          </span>
        </span>
        <span style={{ fontSize: 11.5, color: "rgba(244,247,250,.6)" }}>
          seit {mon[U.since[0]].slice(0, 3)} {U.since[1]}
        </span>
      </div>
    </div>
  );

  let userPanel: React.ReactNode = null;
  if (hit) {
    const n = hit.n;
    const t = tierAt(n.points);
    const inCircle = countAll(n.kids);
    userPanel = (
      <div key={n.id} className="glass-light" style={panel("left")}>
        <div style={rowBetween}>
          <span style={kick}>
            Tier {t.T.r} · {t.T.n}
          </span>
          <button onClick={close} style={xBtn} aria-label="Schliessen">
            ×
          </button>
        </div>
        <div
          style={{
            ...stagger(1),
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span
            className="glass-dark"
            style={{
              flex: "none",
              width: 54,
              height: 54,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              fontSize: 15,
              fontWeight: 600,
              border: 0,
            }}
          >
            {ini(n.name)}
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span
              style={{ fontSize: 21, fontWeight: 400, letterSpacing: "-.01em" }}
            >
              {n.name}
            </span>
            <span style={{ fontSize: 12, color: "var(--ink-60)" }}>
              dabei seit {n.since}
            </span>
          </span>
        </div>
        <div
          style={{
            ...stagger(2),
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              height: 4,
              borderRadius: 999,
              background: "rgba(14,20,28,.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.max(3, t.progress * 100)}%`,
                height: "100%",
                borderRadius: 999,
                background: "#0E141C",
                transformOrigin: "left",
                animation: `line 1.4s ${EZ} .35s both`,
              }}
            />
          </div>
          <span style={{ fontSize: 11, color: "var(--ink-60)" }}>
            {n.points} Punkte
            {t.TN
              ? ` · ${t.TN.min - n.points} bis ${t.TN.n}`
              : " · höchstes Tier"}
          </span>
        </div>
        <div
          style={{
            ...stagger(3),
            display: "grid",
            gridTemplateColumns: "repeat(3,minmax(0,1fr))",
            gap: 8,
          }}
        >
          {[
            { l: "Cuts", v: n.cuts },
            { l: "Eingeladen", v: n.kids.length },
            { l: "Im Circle", v: inCircle },
          ].map((x) => (
            <div key={x.l} style={statBox}>
              <span style={{ fontSize: 22, fontWeight: 300, lineHeight: 1 }}>
                {x.v}
              </span>
              <span style={{ fontSize: 10.5, color: "var(--ink-60)" }}>
                {x.l}
              </span>
            </div>
          ))}
        </div>
        <span style={{ ...stagger(4), fontSize: 12, color: "var(--ink-62)" }}>
          Eingeladen von {hit.parent ?? "dir"}
        </span>
      </div>
    );
  }

  const caption =
    mode === "me"
      ? { a: "Du", b: "Jeder Kreis ist jemand, den du mitbringst." }
      : hit
        ? {
            a: hit.n.name.split(" ")[0] + "s Circle",
            b: hit.n.kids.length
              ? `${countAll(hit.n.kids)} durch ${hit.n.name.split(" ")[0]} · hervorgehoben`
              : "Noch niemanden eingeladen",
          }
        : {
            a: total
              ? `${total} ${total === 1 ? "Person" : "Personen"} durch dich`
              : "Dein Circle ist noch leer",
            b: total
              ? `${direct} direkt · tippe auf einen Kreis`
              : "Tippe auf dich, um jemanden einzuladen",
          };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          animation: `up 1.4s ${EZ} both`,
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

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: wide ? 440 : undefined,
        }}
      >
        {/* the circle slides aside to make room for the card */}
        <div
          style={{
            width: "100%",
            maxWidth: 340,
            transform: orbitT,
            transformOrigin: "50% 0",
            // on phones the shrunken circle gives its freed height back, so
            // the card sits right under it (percent = of the column width)
            marginBottom: !wide && shift ? "-24%" : 0,
            transition: `transform 1.1s ${EZ}, margin 1.1s ${EZ}`,
          }}
        >
          <Orbit
            center={initials}
            kids={INV}
            focusId={hit ? hit.n.id : null}
            centerOn={meOn}
            onPick={pick}
            onCenter={() => pick("me")}
          />
          <div
            key={caption.a}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 5,
              paddingTop: 12,
              textAlign: "center",
              animation: `up .9s ${EZ} both`,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 400 }}>{caption.a}</span>
            <span style={{ fontSize: 12, color: "var(--ink-62)" }}>
              {caption.b}
            </span>
          </div>
        </div>

        {mode === "me" && invitePanel}
        {mode === "user" && userPanel}
      </div>
    </div>
  );
}

/** Staggered micro-entrance for a panel's rows. */
const stagger = (i: number): React.CSSProperties => ({
  animation: `up .9s ${EZ} ${0.12 + i * 0.07}s both`,
});
const rowBetween: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};
const statBox: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  padding: "14px 12px",
  borderRadius: 18,
  background: "rgba(255,255,255,.45)",
  border: "1px solid rgba(255,255,255,.8)",
};
const kick: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono)",
  fontSize: 9,
  letterSpacing: ".22em",
  textTransform: "uppercase",
  color: "var(--ink-62)",
};
const kickD: React.CSSProperties = { ...kick, color: "rgba(244,247,250,.62)" };
const ghostBtn: React.CSSProperties = {
  height: 44,
  border: "1px solid rgba(255,255,255,.18)",
  background: "transparent",
  color: "#F4F7FA",
  borderRadius: 999,
  padding: "0 18px",
  fontSize: 12,
};
const xBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  border: "1px solid rgba(14,20,28,.12)",
  background: "rgba(255,255,255,.4)",
  color: "#0E141C",
  fontSize: 16,
  lineHeight: 1,
};
const xBtnD: React.CSSProperties = {
  ...xBtn,
  border: "1px solid rgba(255,255,255,.18)",
  background: "transparent",
  color: "#F4F7FA",
};
