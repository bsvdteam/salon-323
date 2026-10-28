"use client";

import { useSalon, type AdminTab, type DayHours } from "../store";
import { useSalonActions } from "../actions";
import { Icon } from "../icons";
import { AdminAppointments } from "../admin-appointments";
import { InviteGenerator, MemberCount } from "../invite-generator";
import { useEffect, useState } from "react";
import {
  listMembersAction,
  listTodayAppointmentsAction,
  markApptDoneAction,
  type AdminMember,
  type AdminTodayAppt,
} from "@/lib/actions";
import {
  labelOf,
  durOf,
  dateOf,
  wdL,
  wdS,
  monS,
  mon,
  fmtTime,
} from "@/lib/data";

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
const stepBtn: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: "50%",
  border: "1px solid rgba(14,20,28,.1)",
  background: "rgba(255,255,255,.6)",
  color: "#0E141C",
  fontSize: 17,
};
const timeInput: React.CSSProperties = {
  width: 84,
  minWidth: 0,
  border: 0,
  background: "transparent",
  color: "#0E141C",
  textAlign: "center",
  fontFamily: "var(--font-geist-mono)",
  fontSize: 16,
  padding: 0,
};
const ini2 = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const A_NAV: { k: AdminTab; label: string; icon: string }[] = [
  { k: "today", label: "Heute", icon: "today" },
  { k: "avail", label: "Zeiten", icon: "avail" },
  { k: "members", label: "Members", icon: "members" },
  { k: "revenue", label: "Umsatz", icon: "revenue" },
];

export function AdminScreen() {
  const { state, set, say } = useSalon();
  const a = useSalonActions();
  const st = state;
  const fmt = fmtTime;

  // Real member roster from the DB (the Members tab).
  const [realMem, setRealMem] = useState<AdminMember[]>([]);
  useEffect(() => {
    listMembersAction()
      .then((r) => {
        if (r) setRealMem(r);
      })
      .catch(() => {});
  }, []);
  // Today's real appointments + the current time (captured in the effect, never
  // during render — Date.now() in render is an impure call).
  const [today, setToday] = useState<{
    nowMin: number;
    appts: AdminTodayAppt[];
  } | null>(null);
  useEffect(() => {
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    listTodayAppointmentsAction()
      .then((r) => setToday({ nowMin, appts: r ?? [] }))
      .catch(() => setToday({ nowMin, appts: [] }));
  }, []);

  // ── shared slot math ──
  const isTaken = (off: number, m: number) => ((m / 30) * 7 + off * 13) % 5 < 2;
  const PZ = st.pause;
  const slotsW = (w: DayHours | undefined) => {
    const r: number[] = [];
    if (!w || !w.on) return r;
    for (let m = w.s; m + 30 <= w.e; m += 30)
      if (m < PZ.s || m >= PZ.e) r.push(m);
    return r;
  };
  const dayW = (o: number) => st.ovr[o] ?? st.week[dateOf(o).getDay()];
  const slotsFor = (o: number) => slotsW(dayW(o));
  const isAbs = (o: number) => st.abs.some((ab) => o >= ab.a && o <= ab.b);
  const todayLabel = `${wdL[dateOf(0).getDay()]}, ${dateOf(0).getDate()}. ${mon[dateOf(0).getMonth()]}`;

  // ── Today (real appointments from Supabase) ──
  const nowMin = today?.nowMin ?? 0;
  const appts = (today?.appts ?? []).map((a) => ({
    id: a.id,
    n: a.m.n,
    start: a.start,
    dur: durOf(a.sv),
    sv: a.sv,
    tier: a.m.tier,
    m: a.m,
    serverDone: a.done,
  }));
  const isDone = (ap: (typeof appts)[number]) =>
    ap.serverDone ||
    !!st.done[ap.id] ||
    (ap.start + ap.dur <= nowMin && !st.started[ap.id]);
  const cur = appts.find(
    (ap) => !isDone(ap) && (ap.start <= nowMin || st.started[ap.id]),
  );
  const nxt = appts.find((ap) => !isDone(ap));
  const openClient = (m: AdminMember) =>
    set({ sheet: { type: "client", m } });
  let curV: Record<string, unknown> = {};
  if (cur) {
    const el = Math.max(0, nowMin - cur.start),
      p = Math.min(1, el / cur.dur);
    curV = {
      kicker: `Im Stuhl · ${fmt(cur.start)}–${fmt(cur.start + cur.dur)}`,
      n: cur.n,
      s: labelOf(cur.sv),
      tier: cur.tier,
      rem: Math.max(0, cur.dur - el),
      dash: (188.5 * (1 - p)).toFixed(1),
      note: "Vorlage · " + cur.m.note,
      btn: "Fertig · abbuchen",
      btnIcon: "✓",
      act: () => {
        markApptDoneAction(cur.id).catch(() => {}); // Status + Cuts in der DB
        set((p2) => ({ done: { ...p2.done, [cur.id]: true } }));
        say(`${cur.n.split(" ")[0]} · CHF 20 belastet`);
      },
      open: () => openClient(cur.m),
    };
  } else if (nxt) {
    const inMin = nxt.start - nowMin;
    curV = {
      kicker: `Als Nächstes · ${inMin > 0 ? "in " + inMin + " min" : fmt(nxt.start)}`,
      n: nxt.n,
      s: labelOf(nxt.sv),
      tier: nxt.tier,
      rem: nxt.dur,
      dash: "188.5",
      note:
        nxt.m.cuts === 0
          ? "Erster Besuch · eingeladen von " + nxt.m.via
          : "Vorlage · " + nxt.m.note,
      btn: "In den Stuhl",
      btnIcon: "→",
      act: () => set((p2) => ({ started: { ...p2.started, [nxt.id]: true } })),
      open: () => openClient(nxt.m),
    };
  }
  const HP = 76,
    top = (m: number) => ((m - 540) / 60) * HP;
  const blocks = appts.map((ap) => {
    const dn = isDone(ap),
      isCur = cur && cur.id === ap.id,
      h = Math.max((ap.dur / 60) * HP - 4, 32);
    return {
      n: ap.n,
      sub: `${fmt(ap.start)} · ${labelOf(ap.sv)}`,
      tag: dn ? "✓" : "TIER " + ap.tier,
      top: top(ap.start) + 2 + "px",
      h: h + "px",
      open: () => openClient(ap.m),
      bg: isCur ? "#121925" : dn ? "#E3E9EF" : "#F6F8FA",
      fg: isCur ? "#F4F7FA" : dn ? "rgba(14,20,28,.5)" : "#0E141C",
      shadow: isCur
        ? "0 18px 36px -18px rgba(10,20,40,.6)"
        : "0 8px 20px -14px rgba(20,32,52,.35)",
      dir: (h < 46 ? "row" : "column") as "row" | "column",
      align: h < 46 ? "baseline" : "flex-start",
      gap: h < 46 ? 8 : 2,
    };
  });
  const doneN = appts.filter(isDone).length;
  const dayStats = [
    { l: "Erledigt", v: doneN },
    { l: "Offen", v: appts.length - doneN },
    { l: "Heute CHF", v: doneN * 20 },
  ];
  const hours = Array.from({ length: 10 }, (_, k) => ({
    l: String(9 + k).padStart(2, "0"),
    top: k * HP - 6 + "px",
  }));

  // ── Members ──
  const qq = st.q.trim().toLowerCase();
  const memberList = realMem
    .filter(
      (m) =>
        (!qq || m.n.toLowerCase().includes(qq)) &&
        (st.tierF === "Alle" || m.tier === st.tierF),
    )
    .sort((x, y) => y.cuts - x.cuts)
    .map((m) => ({ ...m, ini: ini2(m.n), open: () => openClient(m) }));
  const tierFilters = ["Alle", "IV", "III", "II", "I"].map((t) => {
    const on = st.tierF === t;
    return {
      bf: on ? "none" : "blur(20px)",
      sh: on ? "inset 0 0 0 1px rgba(255,255,255,.08)" : "none",
      l: t === "Alle" ? "Alle" : "Tier " + t,
      pick: () => set({ tierF: t }),
      bg: on
        ? "linear-gradient(115deg,#151c28,#2a3444)"
        : "rgba(255,255,255,.42)",
      fg: on ? "#F4F7FA" : "#0E141C",
      border: on ? "transparent" : "rgba(255,255,255,.35)",
    };
  });

  // ── Revenue ──
  const bars = (
    [
      ["MI", 160],
      ["DO", 200],
      ["FR", 240],
      ["SA", 280],
      ["SO", 0],
      ["MO", 0],
      ["DI", doneN * 20],
    ] as [string, number][]
  ).map((b, i) => ({
    d: b[0],
    v: b[1] ? b[1] : "—",
    h: Math.max(3, (b[1] / 280) * 100) + "px",
    bg: i === 6 ? "#F4A69E" : "rgba(244,247,250,.85)",
    delay: 0.3 + i * 0.09 + "s",
  }));
  const months = (
    [
      ["Okt.", 1960],
      ["Sept.", 4180],
      ["Aug.", 3620],
      ["Juli", 3980],
      ["Juni", 3740],
    ] as [string, number][]
  ).map((m) => ({
    m: m[0],
    v: "CHF " + m[1].toLocaleString("de-CH"),
    w: (m[1] / 4180) * 100 + "%",
  }));

  // ── Availability ──
  const setW = (wd: number, patch: Partial<DayHours>) =>
    set((p) => ({
      week: { ...p.week, [wd]: { ...p.week[wd], ...patch } },
      syncAgo: "gerade eben",
    }));
  const sync = (msg: string) =>
    say(st.calOn ? msg + " · Calendly aktualisiert" : msg);
  const pt = (v: string) => {
    const [hh, mm] = String(v || "")
      .split(":")
      .map(Number);
    return isNaN(hh) || isNaN(mm) ? null : hh * 60 + mm;
  };
  const dl = (o: number) => {
    const d = dateOf(o);
    return `${wdS[d.getDay()]} ${d.getDate()}. ${monS[d.getMonth()]}`;
  };
  let mins = 0;
  const week = [1, 2, 3, 4, 5, 6, 0].map((wd) => {
    const w = st.week[wd],
      open = st.wOpen === wd && w.on,
      n = slotsW(w).length;
    mins += n * 30;
    return {
      n: wdL[wd],
      sum: w.on ? `${fmt(w.s)} – ${fmt(w.e)}` : "Geschlossen",
      sumC: w.on ? "rgba(14,20,28,.7)" : "rgba(14,20,28,.4)",
      open,
      chev: open ? "rotate(180deg)" : "rotate(0deg)",
      chevO: w.on ? 0.6 : 0,
      on: w.on,
      expand: () => w.on && set((p) => ({ wOpen: p.wOpen === wd ? null : wd })),
      toggle: () => {
        setW(wd, { on: !w.on });
        set({ wOpen: w.on ? null : wd });
        sync(`${wdL[wd]} ${w.on ? "geschlossen" : "geöffnet"}`);
      },
      track: w.on ? "#0E141C" : "rgba(14,20,28,.18)",
      knob: w.on ? "translateX(18px)" : "translateX(0)",
      sL: fmt(w.s),
      eL: fmt(w.e),
      slotsL: `${n} buchbare Slots à 30 Min · Mitglieder sehen die Änderung sofort`,
      sMinus: () => setW(wd, { s: Math.max(420, w.s - 30) }),
      sPlus: () => setW(wd, { s: Math.min(w.e - 60, w.s + 30) }),
      eMinus: () => setW(wd, { e: Math.max(w.s + 60, w.e - 30) }),
      ePlus: () => setW(wd, { e: Math.min(1320, w.e + 30) }),
      sSet: (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = pt(e.target.value);
        if (t != null) setW(wd, { s: Math.min(t, w.e - 30) });
      },
      eSet: (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = pt(e.target.value);
        if (t != null) setW(wd, { e: Math.max(t, w.s + 30) });
      },
    };
  });
  const setO = (o: number, patch: Partial<DayHours>) =>
    set((p) => {
      const base = p.ovr[o] ?? p.week[dateOf(o).getDay()];
      return {
        ovr: { ...p.ovr, [o]: { ...base, ...patch } },
        syncAgo: "gerade eben",
      };
    });
  const days14 = Array.from({ length: 14 }, (_, i) => {
    const o = i + 1,
      w = dayW(o),
      ab = st.abs.find((x) => o >= x.a && o <= x.b),
      isOvr = !!st.ovr[o],
      open = st.dOpen === o && !ab;
    const free = slotsFor(o).filter((m) => !isTaken(o, m)).length,
      n = slotsFor(o).length;
    const tag = ab ? ab.why.toUpperCase() : isOvr ? "ANGEPASST" : "";
    return {
      n: dl(o),
      tag,
      tagO: tag ? 1 : 0,
      tagBg: ab ? "rgba(229,119,108,.14)" : "rgba(14,20,28,.08)",
      tagFg: ab ? "#B5483F" : "rgba(14,20,28,.7)",
      sum: ab ? "—" : w.on ? `${fmt(w.s)} – ${fmt(w.e)}` : "Zu",
      sumC: w.on && !ab ? "rgba(14,20,28,.75)" : "rgba(14,20,28,.4)",
      open,
      on: w.on,
      chev: open ? "rotate(180deg)" : "rotate(0deg)",
      chevO: ab ? 0 : 0.6,
      isOvr,
      expand: () => !ab && set((p) => ({ dOpen: p.dOpen === o ? null : o })),
      toggle: () => {
        setO(o, { on: !w.on });
        sync(`${dl(o)} ${w.on ? "geschlossen" : "geöffnet"}`);
      },
      track: w.on ? "#0E141C" : "rgba(14,20,28,.18)",
      knob: w.on ? "translateX(18px)" : "translateX(0)",
      sL: fmt(w.s),
      eL: fmt(w.e),
      sMinus: () => setO(o, { s: Math.max(420, w.s - 30) }),
      sPlus: () => setO(o, { s: Math.min(w.e - 30, w.s + 30) }),
      eMinus: () => setO(o, { e: Math.max(w.s + 30, w.e - 30) }),
      ePlus: () => setO(o, { e: Math.min(1320, w.e + 30) }),
      sSet: (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = pt(e.target.value);
        if (t != null) setO(o, { s: Math.min(t, w.e - 30) });
      },
      eSet: (e: React.ChangeEvent<HTMLInputElement>) => {
        const t = pt(e.target.value);
        if (t != null) setO(o, { e: Math.max(t, w.s + 30) });
      },
      slotsL: w.on ? `${free} von ${n} Slots frei` : "Nicht buchbar",
      reset: () => {
        set((p) => {
          const x = { ...p.ovr };
          delete x[o];
          return { ovr: x };
        });
        sync(`${dl(o)} zurück auf Standard`);
      },
    };
  });
  const shiftP = (d: number) =>
    set((p) => ({
      pause: {
        s: Math.min(900, Math.max(600, p.pause.s + d)),
        e: Math.min(960, Math.max(660, p.pause.e + d)),
      },
    }));
  const absList = st.abs
    .slice()
    .sort((x, y) => x.a - y.a)
    .map((ab) => ({
      why: ab.why,
      src: ab.src,
      range: ab.a === ab.b ? dl(ab.a) : `${dl(ab.a)} – ${dl(ab.b)}`,
      len: ab.a === ab.b ? "1 Tag" : `${ab.b - ab.a + 1} Tage`,
      remove: () => {
        set((p) => ({ abs: p.abs.filter((x) => x.id !== ab.id) }));
        sync(ab.why + " entfernt");
      },
    }));
  const t0 = dateOf(0).getDay(),
    mon0 = -((t0 + 6) % 7);
  const A = st.absA,
    B = st.absB ?? st.absA;
  const calCells = Array.from({ length: 35 }, (_, i) => {
    const o = mon0 + i,
      d = dateOf(o),
      past = o < 0,
      closed = !st.week[d.getDay()].on;
    const inR = A != null && o >= A && B != null && o <= B,
      edge = A != null && (o === A || o === B);
    return {
      d: d.getDate(),
      bg: edge
        ? "linear-gradient(115deg,#151c28,#2a3444)"
        : inR
          ? "rgba(14,20,28,.1)"
          : "transparent",
      fg: edge ? "#F4F7FA" : "#0E141C",
      o: past ? 0.22 : closed && !inR ? 0.42 : 1,
      pe: past ? ("none" as const) : ("auto" as const),
      dot: isAbs(o) && !edge ? 1 : 0,
      pick: () =>
        set((p) =>
          p.absA == null || p.absB != null
            ? { absA: o, absB: null }
            : o < p.absA
              ? { absA: o }
              : { absB: o },
        ),
    };
  });
  const m1 = mon[dateOf(mon0).getMonth()],
    m2 = mon[dateOf(mon0 + 34).getMonth()];
  let hit = 0;
  if (A != null && B != null)
    for (let o = Math.max(1, A); o <= B; o++)
      if (!isAbs(o)) hit += slotsFor(o).filter((m) => isTaken(o, m)).length;
  const absHint =
    A == null
      ? "Ersten Tag wählen"
      : st.absB == null
        ? "Letzten Tag wählen"
        : A === B
          ? dl(A)
          : `${(B ?? A) - A + 1} Tage`;
  const whyChips = ["Ferien", "Krank", "Privat", "Weiterbildung"].map((l) => {
    const on = st.absWhy === l;
    return {
      l,
      pick: () => set({ absWhy: l }),
      bg: on ? "#0E141C" : "rgba(255,255,255,.45)",
      fg: on ? "#F4F7FA" : "#0E141C",
      border: on ? "transparent" : "rgba(255,255,255,.6)",
    };
  });
  const horizonL = dl(14);
  const weekHours = `${Math.round(mins / 60)} h buchbar / Woche`;

  return (
    <div
      style={{
        position: "relative",
        maxWidth: 640,
        margin: "0 auto",
        padding:
          "calc(16px + env(safe-area-inset-top)) clamp(16px,4vw,32px) calc(130px + env(safe-area-inset-bottom))",
      }}
    >
      {/* header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: "clamp(26px,5vh,48px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 9.5,
              letterSpacing: ".32em",
              textTransform: "uppercase",
            }}
          >
            salon 323
          </span>
          <span
            className="glass-dark"
            style={{
              padding: "5px 10px",
              borderRadius: 999,
              fontFamily: "var(--font-geist-mono)",
              fontSize: 8,
              letterSpacing: ".2em",
              textTransform: "uppercase",
              border: 0,
            }}
          >
            Barber
          </span>
        </div>
        <button
          onClick={() => a.logout()}
          style={{
            border: 0,
            background: "transparent",
            color: "var(--ink-62)",
            fontFamily: "var(--font-geist-mono)",
            fontSize: 9,
            letterSpacing: ".22em",
            textTransform: "uppercase",
            padding: "12px 0",
          }}
        >
          Abmelden
        </button>
      </div>

      {/* ── TODAY ── */}
      {st.aTab === "today" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              animation: "up 1.4s cubic-bezier(.22,1,.36,1) both",
            }}
          >
            <span style={kick}>
              {todayLabel}
              {today ? ` · ${fmt(nowMin)}` : ""}
            </span>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(28px,6vw,38px)",
                fontWeight: 300,
                letterSpacing: "-.025em",
              }}
            >
              {appts.length} Termine heute.
            </h1>
          </div>
          <AdminAppointments />
          {cur || nxt ? (
            <div
              className="glass-dark"
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: 34,
                padding: 22,
                animation: "up 1.6s cubic-bezier(.22,1,.36,1) .1s both",
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <div
                data-loop
                style={{
                  position: "absolute",
                  right: -60,
                  top: -60,
                  width: 200,
                  height: 200,
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle,rgba(244,166,158,.3),transparent 65%)",
                  animation: "breathe 9s ease-in-out infinite",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={kickD}>{curV.kicker as string}</span>
                <span
                  data-loop
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 9,
                    background: "#F4A69E",
                    animation: "ping 2.8s ease-out infinite",
                  }}
                />
              </div>
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 14,
                }}
              >
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
                      fontSize: 26,
                      fontWeight: 300,
                      letterSpacing: "-.01em",
                    }}
                  >
                    {curV.n as string}
                  </span>
                  <span
                    style={{ fontSize: 12.5, color: "rgba(244,247,250,.65)" }}
                  >
                    {curV.s as string} · Tier {curV.tier as string}
                  </span>
                </div>
                <div
                  style={{
                    position: "relative",
                    flex: "none",
                    width: 68,
                    height: 68,
                  }}
                >
                  <svg width="68" height="68" viewBox="0 0 68 68">
                    <circle
                      cx="34"
                      cy="34"
                      r="30"
                      fill="none"
                      stroke="rgba(255,255,255,.14)"
                      strokeWidth="2"
                    />
                    <circle
                      cx="34"
                      cy="34"
                      r="30"
                      fill="none"
                      stroke="#F4F7FA"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="188.5"
                      strokeDashoffset={curV.dash as string}
                      transform="rotate(-90 34 34)"
                      style={{
                        transition:
                          "stroke-dashoffset 1.6s cubic-bezier(.22,1,.36,1)",
                      }}
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                    }}
                  >
                    <span
                      style={{ fontSize: 16, fontWeight: 300, lineHeight: 1 }}
                    >
                      {curV.rem as number}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: 7.5,
                        letterSpacing: ".14em",
                        color: "rgba(244,247,250,.6)",
                      }}
                    >
                      MIN
                    </span>
                  </div>
                </div>
              </div>
              <div
                style={{
                  position: "relative",
                  fontSize: 12,
                  color: "rgba(244,247,250,.65)",
                  paddingTop: 14,
                  borderTop: "1px solid rgba(255,255,255,.1)",
                  textWrap: "pretty",
                }}
              >
                {curV.note as string}
              </div>
              <div style={{ position: "relative", display: "flex", gap: 8 }}>
                <button
                  onClick={curV.act as () => void}
                  style={{
                    flex: 1,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    height: 48,
                    border: 0,
                    borderRadius: 999,
                    background: "#F4F7FA",
                    color: "#0E141C",
                    padding: "0 20px",
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  {curV.btn as string}{" "}
                  <span style={{ fontWeight: 300 }}>
                    {curV.btnIcon as string}
                  </span>
                </button>
                <button
                  onClick={curV.open as () => void}
                  style={{
                    height: 48,
                    border: "1px solid rgba(255,255,255,.18)",
                    background: "transparent",
                    color: "#F4F7FA",
                    borderRadius: 999,
                    padding: "0 18px",
                    fontSize: 12.5,
                  }}
                >
                  Profil
                </button>
              </div>
            </div>
          ) : (
            <div
              className="glass-dark"
              style={{
                borderRadius: 34,
                padding: 26,
                animation: "up 1.4s cubic-bezier(.22,1,.36,1) both",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <span style={kickD}>Feierabend</span>
              <span style={{ fontSize: 24, fontWeight: 300 }}>
                Alle Gäste bedient.
              </span>
            </div>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,minmax(0,1fr))",
              gap: 8,
            }}
          >
            {dayStats.map((s, i) => (
              <div
                key={i}
                className="glass-light"
                style={{
                  padding: "14px 14px 12px",
                  borderRadius: 24,
                  color: "#0E141C",
                  animation: "up 1.4s cubic-bezier(.22,1,.36,1) .2s both",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 11, color: "var(--ink-62)" }}>
                  {s.l}
                </span>
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 300,
                    letterSpacing: "-.02em",
                  }}
                >
                  {s.v}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={kick}>Tagesverlauf</span>
              <span style={{ fontSize: 11.5, color: "var(--ink-60)" }}>
                09 – 18 Uhr
              </span>
            </div>
            <div style={{ position: "relative", height: 9 * HP + 8 + "px" }}>
              {hours.map((h, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: h.top,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      width: 38,
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 10,
                      color: "rgba(14,20,28,.55)",
                    }}
                  >
                    {h.l}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      borderTop: "1px solid rgba(14,20,28,.06)",
                    }}
                  />
                </div>
              ))}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: top(nowMin) - 6 + "px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              >
                <span
                  style={{
                    width: 38,
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 10,
                    color: "#C4554B",
                  }}
                >
                  {fmt(nowMin)}
                </span>
                <span
                  data-loop
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#E5776C",
                    animation: "ping 2.6s ease-out infinite",
                  }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  zIndex: 1,
                  left: 48,
                  right: 0,
                  top: top(720) + 2 + "px",
                  height: HP - 4 + "px",
                  borderRadius: 14,
                  background: "#E3E9EF",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 16px",
                  fontSize: 11,
                  color: "rgba(14,20,28,.55)",
                }}
              >
                Pause
              </div>
              {blocks.map((b, i) => (
                <button
                  key={i}
                  onClick={b.open}
                  style={{
                    position: "absolute",
                    left: 48,
                    right: 0,
                    top: b.top,
                    height: b.h,
                    borderRadius: 14,
                    padding: "0 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                    textAlign: "left",
                    border: 0,
                    zIndex: 1,
                    background: b.bg,
                    color: b.fg,
                    boxShadow: b.shadow,
                    transition: "all 1s cubic-bezier(.22,1,.36,1)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: b.dir,
                      alignItems: b.align,
                      gap: b.gap,
                      minWidth: 0,
                      overflow: "hidden",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {b.n}
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        opacity: 0.65,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {b.sub}
                    </span>
                  </div>
                  <span
                    style={{
                      flex: "none",
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 9,
                      letterSpacing: ".12em",
                      opacity: 0.7,
                    }}
                  >
                    {b.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MEMBERS ── */}
      {st.aTab === "members" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              animation: "up 1.4s cubic-bezier(.22,1,.36,1) both",
            }}
          >
            <span style={kick}>
              <MemberCount />
            </span>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(28px,6vw,38px)",
                fontWeight: 300,
                letterSpacing: "-.025em",
              }}
            >
              The Circle.
            </h1>
          </div>
          <InviteGenerator />
          <div
            className="glass-dark"
            style={{
              display: "flex",
              alignItems: "center",
              height: 52,
              padding: "0 20px",
              borderRadius: 999,
              animation: "up 1.4s cubic-bezier(.22,1,.36,1) .1s both",
            }}
          >
            <input
              value={st.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Suchen"
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
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
            {tierFilters.map((tf, i) => (
              <button
                key={i}
                onClick={tf.pick}
                style={{
                  flex: "none",
                  height: 36,
                  padding: "0 15px",
                  borderRadius: 999,
                  fontSize: 12,
                  backdropFilter: tf.bf,
                  WebkitBackdropFilter: tf.bf,
                  background: tf.bg,
                  boxShadow: tf.sh,
                  color: tf.fg,
                  border: `1px solid ${tf.border}`,
                  transition: "all .9s cubic-bezier(.22,1,.36,1)",
                }}
              >
                {tf.l}
              </button>
            ))}
          </div>
          <div
            className="glass-light"
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "4px 18px",
              borderRadius: 30,
              color: "#0E141C",
              animation: "up 1.6s cubic-bezier(.22,1,.36,1) .2s both",
            }}
          >
            {memberList.map((m, i) => (
              <button
                key={i}
                onClick={m.open}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "13px 0",
                  border: 0,
                  borderBottom: "1px solid rgba(14,20,28,.07)",
                  background: "transparent",
                  color: "#0E141C",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      flex: "none",
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 11,
                      fontWeight: 600,
                      background: "rgba(255,255,255,.6)",
                      border: "1px solid rgba(255,255,255,.9)",
                    }}
                  >
                    {m.ini}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      minWidth: 0,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{m.n}</span>
                    <span style={{ fontSize: 11, color: "var(--ink-60)" }}>
                      via {m.via} · zuletzt {m.last}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    flex: "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 3,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 300 }}>
                    {m.cuts}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 8.5,
                      letterSpacing: ".16em",
                      color: "rgba(14,20,28,.55)",
                    }}
                  >
                    TIER {m.tier}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── AVAILABILITY ── */}
      {st.aTab === "avail" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              animation: "up 1.4s cubic-bezier(.22,1,.36,1) both",
            }}
          >
            <span style={kick}>Verfügbarkeit</span>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(28px,6vw,38px)",
                fontWeight: 300,
                letterSpacing: "-.025em",
              }}
            >
              Deine Zeiten.
            </h1>
          </div>
          {/* calendly */}
          <div
            className="glass-dark"
            style={{
              borderRadius: 30,
              padding: "20px 22px",
              animation: "up 1.4s cubic-bezier(.22,1,.36,1) .1s both",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  minWidth: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: st.calOn
                        ? "#F4A69E"
                        : "rgba(255,255,255,.25)",
                      transition: "background .8s",
                    }}
                  />
                  <span style={{ fontSize: 16, fontWeight: 400 }}>
                    Calendly
                  </span>
                </div>
                <span
                  style={{ fontSize: 11.5, color: "rgba(244,247,250,.65)" }}
                >
                  {st.syncing
                    ? "Synchronisiere …"
                    : st.calOn
                      ? `Verbunden · synchronisiert ${st.syncAgo}`
                      : "Nicht verbunden"}
                </span>
              </div>
              <button
                onClick={() => {
                  if (st.calOn) {
                    set({ calOn: false });
                    say("Calendly getrennt");
                  } else {
                    set({ calOn: true, syncing: true });
                    setTimeout(() => {
                      set({ syncing: false, syncAgo: "gerade eben" });
                      say("Calendly verbunden");
                    }, 1400);
                  }
                }}
                style={{
                  flex: "none",
                  height: 40,
                  padding: "0 16px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,.18)",
                  background: "transparent",
                  color: "#F4F7FA",
                  fontSize: 12,
                }}
              >
                {st.calOn ? "Trennen" : "Verbinden"}
              </button>
            </div>
            <span
              style={{
                fontSize: 12,
                lineHeight: 1.55,
                color: "rgba(244,247,250,.7)",
                textWrap: "pretty",
              }}
            >
              {st.calOn
                ? "Zwei-Wege-Sync: Öffnungszeiten und Abwesenheiten, die du hier oder in Calendly einträgst, erscheinen automatisch auf beiden Seiten."
                : "Verbinde Calendly, damit Zeiten und Ferien aus beiden Orten übernommen werden."}
            </span>
            {st.calOn && (
              <button
                onClick={() => {
                  if (st.syncing) return;
                  set({ syncing: true });
                  setTimeout(() => {
                    set({ syncing: false, syncAgo: "gerade eben" });
                    say("Mit Calendly abgeglichen");
                  }, 1400);
                }}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  height: 46,
                  border: 0,
                  borderRadius: 999,
                  background: "#F4F7FA",
                  color: "#0E141C",
                  padding: "0 20px",
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                {st.syncing ? "Synchronisiere …" : "Jetzt synchronisieren"}{" "}
                <span style={{ fontWeight: 300 }}>↻</span>
              </button>
            )}
          </div>

          {/* next 2 weeks (overrides) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={kick}>Nächste 2 Wochen</span>
              <span
                style={{
                  fontSize: 11.5,
                  color: "var(--ink-60)",
                  textAlign: "right",
                }}
              >
                Buchbar bis {horizonL}
              </span>
            </div>
            <div
              className="glass-light"
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "2px 18px",
                borderRadius: 30,
                color: "#0E141C",
                animation: "up 1.6s cubic-bezier(.22,1,.36,1) .15s both",
              }}
            >
              {days14.map((w, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    borderBottom: "1px solid rgba(14,20,28,.07)",
                  }}
                >
                  <button
                    onClick={w.expand}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      minHeight: 84,
                      border: 0,
                      background: "transparent",
                      color: "#0E141C",
                      textAlign: "left",
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15.5,
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {w.n}
                      </span>
                      {w.tag && (
                        <span
                          style={{
                            fontFamily: "var(--font-geist-mono)",
                            fontSize: 8,
                            letterSpacing: ".14em",
                            padding: "3px 7px",
                            borderRadius: 999,
                            background: w.tagBg,
                            color: w.tagFg,
                            opacity: w.tagO,
                          }}
                        >
                          {w.tag}
                        </span>
                      )}
                    </span>
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: 12.5,
                        whiteSpace: "nowrap",
                        color: w.sumC,
                      }}
                    >
                      {w.sum}
                      <span
                        style={{
                          fontSize: 10,
                          opacity: w.chevO,
                          transform: w.chev,
                          transition: "transform .8s cubic-bezier(.22,1,.36,1)",
                        }}
                      >
                        ▾
                      </span>
                    </span>
                  </button>
                  {w.open && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        padding: "0 0 16px",
                        animation: "up 1s cubic-bezier(.22,1,.36,1) both",
                      }}
                    >
                      <button
                        onClick={w.toggle}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          height: 44,
                          border: 0,
                          background: "transparent",
                          color: "#0E141C",
                          padding: 0,
                        }}
                      >
                        <span
                          style={{ fontSize: 12.5, color: "rgba(14,20,28,.7)" }}
                        >
                          An diesem Tag offen
                        </span>
                        <span
                          style={{
                            width: 46,
                            height: 28,
                            borderRadius: 999,
                            padding: 3,
                            background: w.track,
                            transition: "background .8s",
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              width: 22,
                              height: 22,
                              borderRadius: "50%",
                              background: "#fff",
                              boxShadow: "0 2px 6px rgba(0,0,0,.2)",
                              transform: w.knob,
                              transition:
                                "transform .8s cubic-bezier(.22,1,.36,1)",
                            }}
                          />
                        </span>
                      </button>
                      {w.on && (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 10,
                          }}
                        >
                          <TimeBox
                            label="Von"
                            val={w.sL}
                            minus={w.sMinus}
                            plus={w.sPlus}
                            set={w.sSet}
                          />
                          <TimeBox
                            label="Bis"
                            val={w.eL}
                            minus={w.eMinus}
                            plus={w.ePlus}
                            set={w.eSet}
                          />
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{ fontSize: 11.5, color: "var(--ink-60)" }}
                        >
                          {w.slotsL}
                        </span>
                        {w.isOvr && (
                          <button
                            onClick={w.reset}
                            style={{
                              flex: "none",
                              height: 36,
                              padding: "0 14px",
                              borderRadius: 999,
                              border: "1px solid rgba(14,20,28,.14)",
                              background: "transparent",
                              color: "#0E141C",
                              fontSize: 11.5,
                            }}
                          >
                            Standard
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ height: 10 }} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={kick}>Standard-Woche</span>
              <span style={{ fontSize: 11.5, color: "var(--ink-60)" }}>
                {weekHours}
              </span>
            </div>
            <div
              className="glass-light"
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "2px 18px",
                borderRadius: 30,
                color: "#0E141C",
                animation: "up 1.6s cubic-bezier(.22,1,.36,1) .2s both",
              }}
            >
              {week.map((w, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    borderBottom: "1px solid rgba(14,20,28,.07)",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <button
                      onClick={w.expand}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        minHeight: 84,
                        border: 0,
                        background: "transparent",
                        color: "#0E141C",
                        textAlign: "left",
                        padding: 0,
                      }}
                    >
                      <span style={{ fontSize: 15.5, fontWeight: 500 }}>
                        {w.n}
                      </span>
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontFamily: "var(--font-geist-mono)",
                          fontSize: 12.5,
                          color: w.sumC,
                        }}
                      >
                        {w.sum}
                        <span
                          style={{
                            fontSize: 10,
                            opacity: w.chevO,
                            transform: w.chev,
                            transition:
                              "transform .8s cubic-bezier(.22,1,.36,1)",
                          }}
                        >
                          ▾
                        </span>
                      </span>
                    </button>
                    <button
                      onClick={w.toggle}
                      style={{
                        flex: "none",
                        width: 46,
                        height: 44,
                        border: 0,
                        background: "transparent",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          width: 46,
                          height: 28,
                          borderRadius: 999,
                          padding: 3,
                          background: w.track,
                          transition: "background .8s",
                        }}
                      >
                        <span
                          style={{
                            display: "block",
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: "#fff",
                            boxShadow: "0 2px 6px rgba(0,0,0,.2)",
                            transform: w.knob,
                            transition:
                              "transform .8s cubic-bezier(.22,1,.36,1)",
                          }}
                        />
                      </span>
                    </button>
                  </div>
                  {w.open && (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                        padding: "0 0 16px",
                        animation: "up 1s cubic-bezier(.22,1,.36,1) both",
                      }}
                    >
                      <TimeBox
                        label="Erster Termin"
                        val={w.sL}
                        minus={w.sMinus}
                        plus={w.sPlus}
                        set={w.sSet}
                      />
                      <TimeBox
                        label="Feierabend"
                        val={w.eL}
                        minus={w.eMinus}
                        plus={w.ePlus}
                        set={w.eSet}
                      />
                      <span
                        style={{
                          gridColumn: "1 / -1",
                          fontSize: 11.5,
                          color: "var(--ink-60)",
                        }}
                      >
                        {w.slotsL}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  minHeight: 62,
                }}
              >
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 3 }}
                >
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    Mittagspause
                  </span>
                  <span style={{ fontSize: 11, color: "var(--ink-60)" }}>
                    Gilt für alle Tage
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button onClick={() => shiftP(-30)} style={stepBtn}>
                    −
                  </button>
                  <span
                    style={{
                      minWidth: 96,
                      textAlign: "center",
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 11.5,
                    }}
                  >
                    {fmt(PZ.s)} – {fmt(PZ.e)}
                  </span>
                  <button onClick={() => shiftP(30)} style={stepBtn}>
                    +
                  </button>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  minHeight: 62,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Puffer</span>
                  <span style={{ fontSize: 11, color: "var(--ink-60)" }}>
                    Pause zwischen Terminen
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={() =>
                      set((p) => ({ bufferMin: Math.max(0, p.bufferMin - 5) }))
                    }
                    style={stepBtn}
                  >
                    −
                  </button>
                  <span
                    style={{
                      minWidth: 96,
                      textAlign: "center",
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 11.5,
                    }}
                  >
                    {st.bufferMin} min
                  </span>
                  <button
                    onClick={() =>
                      set((p) => ({ bufferMin: Math.min(60, p.bufferMin + 5) }))
                    }
                    style={stepBtn}
                  >
                    +
                  </button>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  minHeight: 62,
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    Vorlaufzeit
                  </span>
                  <span style={{ fontSize: 11, color: "var(--ink-60)" }}>
                    Frühestens buchbar in
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    onClick={() =>
                      set((p) => ({ leadHours: Math.max(0, p.leadHours - 1) }))
                    }
                    style={stepBtn}
                  >
                    −
                  </button>
                  <span
                    style={{
                      minWidth: 96,
                      textAlign: "center",
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 11.5,
                    }}
                  >
                    {st.leadHours} h
                  </span>
                  <button
                    onClick={() =>
                      set((p) => ({ leadHours: Math.min(72, p.leadHours + 1) }))
                    }
                    style={stepBtn}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* absences */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={kick}>Abwesenheiten</span>
              <span style={{ fontSize: 11.5, color: "var(--ink-60)" }}>
                {absList.length ? `${absList.length} geplant` : "Keine geplant"}
              </span>
            </div>
            {absList.length > 0 && (
              <div
                className="glass-light"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "2px 18px",
                  borderRadius: 30,
                  color: "#0E141C",
                  animation: "up 1.6s cubic-bezier(.22,1,.36,1) .3s both",
                }}
              >
                {absList.map((ab, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "12px 0",
                      borderBottom: "1px solid rgba(14,20,28,.07)",
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
                      <span style={{ fontSize: 14, fontWeight: 500 }}>
                        {ab.why}
                      </span>
                      <span style={{ fontSize: 11.5, color: "var(--ink-62)" }}>
                        {ab.range} · {ab.len}
                      </span>
                    </div>
                    <div
                      style={{
                        flex: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-geist-mono)",
                          fontSize: 8.5,
                          letterSpacing: ".16em",
                          color: "rgba(14,20,28,.55)",
                        }}
                      >
                        {ab.src}
                      </span>
                      <button
                        onClick={ab.remove}
                        style={{
                          width: 44,
                          height: 44,
                          border: 0,
                          background: "transparent",
                          color: "rgba(14,20,28,.5)",
                          fontSize: 18,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!st.absForm ? (
              <button
                onClick={() =>
                  set({
                    absForm: true,
                    absA: null,
                    absB: null,
                    absWhy: "Ferien",
                  })
                }
                className="glass-dark"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  height: 52,
                  borderRadius: 999,
                  padding: "0 22px",
                  fontSize: 13,
                  fontWeight: 600,
                  border: 0,
                }}
              >
                Abwesenheit eintragen <span style={{ fontWeight: 300 }}>+</span>
              </button>
            ) : (
              <div
                className="glass-light"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  padding: "20px 18px",
                  borderRadius: 30,
                  color: "#0E141C",
                  animation: "up 1.2s cubic-bezier(.22,1,.36,1) both",
                }}
              >
                <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
                  {whyChips.map((c, i) => (
                    <button
                      key={i}
                      onClick={c.pick}
                      style={{
                        flex: "none",
                        height: 38,
                        padding: "0 15px",
                        borderRadius: 999,
                        fontSize: 12,
                        border: `1px solid ${c.border}`,
                        background: c.bg,
                        color: c.fg,
                        transition: "all .9s cubic-bezier(.22,1,.36,1)",
                      }}
                    >
                      {c.l}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 400 }}>
                    {m1 === m2 ? m1 : `${m1} – ${m2}`}
                  </span>
                  <span
                    style={{
                      fontSize: 11.5,
                      color: "var(--ink-60)",
                      textAlign: "right",
                    }}
                  >
                    {absHint}
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(7,minmax(0,1fr))",
                    gap: 4,
                  }}
                >
                  {["MO", "DI", "MI", "DO", "FR", "SA", "SO"].map((hd) => (
                    <span
                      key={hd}
                      style={{
                        textAlign: "center",
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: 9,
                        letterSpacing: ".1em",
                        color: "rgba(14,20,28,.5)",
                        paddingBottom: 4,
                      }}
                    >
                      {hd}
                    </span>
                  ))}
                  {calCells.map((cc, i) => (
                    <button
                      key={i}
                      onClick={cc.pick}
                      style={{
                        position: "relative",
                        height: 42,
                        borderRadius: 14,
                        border: 0,
                        fontSize: 13,
                        background: cc.bg,
                        color: cc.fg,
                        opacity: cc.o,
                        pointerEvents: cc.pe,
                        transition: "background .5s,color .5s",
                      }}
                    >
                      {cc.d}
                      <span
                        style={{
                          position: "absolute",
                          left: "50%",
                          bottom: 5,
                          width: 4,
                          height: 4,
                          marginLeft: -2,
                          borderRadius: "50%",
                          background: "#E5776C",
                          opacity: cc.dot,
                        }}
                      />
                    </button>
                  ))}
                </div>
                <span
                  style={{
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: "rgba(14,20,28,.68)",
                    textWrap: "pretty",
                  }}
                >
                  {A == null
                    ? "Tippe auf einen Tag – für mehrere Tage danach auf den letzten."
                    : hit
                      ? `${hit} gebuchte Termine betroffen. Die Mitglieder bekommen eine Nachricht mit Link zum Umbuchen.`
                      : "Keine gebuchten Termine betroffen."}
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      if (A == null) return;
                      set((p) => ({
                        abs: [
                          ...p.abs,
                          {
                            id: Date.now(),
                            a: A,
                            b: B ?? A,
                            why: p.absWhy,
                            src: "HIER",
                          },
                        ],
                        absForm: false,
                        syncAgo: "gerade eben",
                      }));
                      sync(st.absWhy + " eingetragen");
                    }}
                    style={{
                      flex: 1,
                      height: 50,
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 600,
                      background:
                        "linear-gradient(115deg,rgba(9,13,22,.82),rgba(22,30,44,.66) 52%,rgba(30,40,58,.52))",
                      border: 0,
                      color: "#F4F7FA",
                      opacity: A == null ? 0.35 : 1,
                      pointerEvents: A == null ? "none" : "auto",
                      transition: "opacity .6s",
                    }}
                  >
                    Eintragen
                  </button>
                  <button
                    onClick={() => set({ absForm: false })}
                    style={{
                      height: 50,
                      borderRadius: 999,
                      padding: "0 22px",
                      fontSize: 13,
                      border: "1px solid rgba(14,20,28,.14)",
                      background: "transparent",
                      color: "#0E141C",
                    }}
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REVENUE ── */}
      {st.aTab === "revenue" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              animation: "up 1.4s cubic-bezier(.22,1,.36,1) both",
            }}
          >
            <span style={kick}>Umsatz · Oktober</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontSize: 14, color: "var(--ink-60)" }}>CHF</span>
              <span
                style={{
                  fontSize: "clamp(56px,13vw,78px)",
                  fontWeight: 200,
                  letterSpacing: "-.045em",
                  lineHeight: 1,
                }}
              >
                1&apos;960
              </span>
            </div>
            <span style={{ fontSize: 12.5, color: "rgba(14,20,28,.65)" }}>
              98 Schnitte · +12 % zum gleichen Zeitpunkt im September
            </span>
          </div>
          <div
            className="glass-dark"
            style={{
              borderRadius: 32,
              padding: 22,
              animation: "up 1.6s cubic-bezier(.22,1,.36,1) .15s both",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={kickD}>Letzte 7 Tage</span>
              <span style={{ fontSize: 11.5, color: "rgba(244,247,250,.65)" }}>
                CHF 1&apos;200
              </span>
            </div>
            <div
              style={{
                height: 150,
                display: "grid",
                gridTemplateColumns: "repeat(7,minmax(0,1fr))",
                gap: 10,
                alignItems: "end",
              }}
            >
              {bars.map((b, i) => (
                <div
                  key={i}
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 8.5,
                      color: "rgba(244,247,250,.6)",
                    }}
                  >
                    {b.v}
                  </span>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 24,
                      height: b.h,
                      borderRadius: 999,
                      background: b.bg,
                      transformOrigin: "bottom",
                      animation: `grow 1.8s cubic-bezier(.22,1,.36,1) both`,
                      animationDelay: b.delay,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 8.5,
                      letterSpacing: ".1em",
                      color: "rgba(244,247,250,.6)",
                    }}
                  >
                    {b.d}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <div
              className="glass-light"
              style={{
                padding: 18,
                borderRadius: 26,
                color: "#0E141C",
                animation: "up 1.6s cubic-bezier(.22,1,.36,1) .25s both",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <span style={{ fontSize: 11.5, color: "var(--ink-62)" }}>
                Ø pro Öffnungstag
              </span>
              <span style={{ fontSize: 26, fontWeight: 300 }}>CHF 196</span>
            </div>
            <div
              className="glass-light"
              style={{
                padding: 18,
                borderRadius: 26,
                color: "#0E141C",
                animation: "up 1.6s cubic-bezier(.22,1,.36,1) .3s both",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <span style={{ fontSize: 11.5, color: "var(--ink-62)" }}>
                Auslastung
              </span>
              <span style={{ fontSize: 26, fontWeight: 300 }}>86 %</span>
            </div>
          </div>
          <div
            className="glass-light"
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "4px 18px",
              borderRadius: 28,
              color: "#0E141C",
              animation: "up 1.6s cubic-bezier(.22,1,.36,1) .4s both",
            }}
          >
            {months.map((mo, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1fr 80px",
                  alignItems: "center",
                  gap: 12,
                  padding: "13px 0",
                  borderBottom: "1px solid rgba(14,20,28,.07)",
                }}
              >
                <span style={{ fontSize: 12.5, color: "rgba(14,20,28,.7)" }}>
                  {mo.m}
                </span>
                <span
                  style={{
                    height: 2,
                    borderRadius: 2,
                    background: "#0E141C",
                    width: mo.w,
                    transformOrigin: "left",
                    animation: "line 2s cubic-bezier(.22,1,.36,1) .5s both",
                  }}
                />
                <span style={{ textAlign: "right", fontSize: 13 }}>{mo.v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* admin nav */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: "calc(16px + env(safe-area-inset-bottom))",
          zIndex: 20,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <nav
          className="glass-dark"
          style={{
            pointerEvents: "auto",
            display: "flex",
            gap: 4,
            padding: 6,
            borderRadius: 999,
            animation: "up 1.8s cubic-bezier(.22,1,.36,1) .4s both",
          }}
        >
          {A_NAV.map((n) => {
            const active = st.aTab === n.k;
            return (
              <button
                key={n.k}
                onClick={() => {
                  set({ aTab: n.k });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                style={{
                  height: 50,
                  minWidth: 50,
                  padding: "0 16px",
                  borderRadius: 999,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: active ? 9 : 0,
                  border: 0,
                  background: active ? "#F4F7FA" : "transparent",
                  color: active ? "#0E141C" : "rgba(244,247,250,.78)",
                  transition: "all 1s cubic-bezier(.22,1,.36,1)",
                }}
              >
                <Icon k={n.icon} />
                <span
                  style={{
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    fontSize: 12,
                    fontWeight: 600,
                    maxWidth: active ? 96 : 0,
                    opacity: active ? 1 : 0,
                    transition: "all 1s cubic-bezier(.22,1,.36,1)",
                  }}
                >
                  {n.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function TimeBox({
  label,
  val,
  minus,
  plus,
  set,
}: {
  label: string;
  val: string;
  minus: () => void;
  plus: () => void;
  set: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 12,
        borderRadius: 20,
        background: "rgba(255,255,255,.45)",
      }}
    >
      <span style={{ fontSize: 11, color: "var(--ink-62)" }}>{label}</span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button onClick={minus} style={stepBtn}>
          −
        </button>
        <input
          type="time"
          step={900}
          value={val}
          onChange={set}
          style={timeInput}
        />
        <button onClick={plus} style={stepBtn}>
          +
        </button>
      </div>
    </div>
  );
}
