"use client";

import { useState } from "react";
import { useSalon, type DayHours } from "./store";
import { EmptyState } from "./empty-state";
import { dateOf, wdL, wdS, monS, mon, fmtTime } from "@/lib/data";

/**
 * Barber availability — rebuilt to be compact instead of one long scroll.
 * A segmented switch shows one of three views at a time:
 *   • Woche    — the standard week as day-chips + a single inline editor
 *   • 2 Wochen — the next 14 days as a grid + an inline per-day editor
 *   • Frei     — absences list + calendar picker (with an empty state)
 * Google Calendar status sits on top; Calendly is gone.
 */
export function AvailTab() {
  const { state, set, say } = useSalon();
  const st = state;
  const fmt = fmtTime;

  const [view, setView] = useState<"week" | "soon" | "away">("week");
  const [selWd, setSelWd] = useState(() => 2);
  const [selDay, setSelDay] = useState(1);

  // ── slot math ──
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
  const isTaken = (off: number, m: number) => ((m / 30) * 7 + off * 13) % 5 < 2;

  const sync = (msg: string) => say(msg);
  const dl = (o: number) => {
    const d = dateOf(o);
    return `${wdS[d.getDay()]} ${d.getDate()}. ${monS[d.getMonth()]}`;
  };

  const setW = (wd: number, patch: Partial<DayHours>) =>
    set((p) => ({
      week: { ...p.week, [wd]: { ...p.week[wd], ...patch } },
      syncAgo: "gerade eben",
    }));
  const setO = (o: number, patch: Partial<DayHours>) =>
    set((p) => {
      const base = p.ovr[o] ?? p.week[dateOf(o).getDay()];
      return {
        ovr: { ...p.ovr, [o]: { ...base, ...patch } },
        syncAgo: "gerade eben",
      };
    });
  const shiftP = (d: number) =>
    set((p) => ({
      pause: {
        s: Math.min(900, Math.max(600, p.pause.s + d)),
        e: Math.min(960, Math.max(660, p.pause.e + d)),
      },
    }));

  let mins = 0;
  for (const wd of [1, 2, 3, 4, 5, 6, 0])
    mins += slotsW(st.week[wd]).length * 30;
  const weekHours = `${Math.round(mins / 60)} h buchbar / Woche`;
  const horizonL = dl(14);

  // ── absences ──
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

  const nav: { k: "week" | "soon" | "away"; l: string }[] = [
    { k: "week", l: "Woche" },
    { k: "soon", l: "2 Wochen" },
    { k: "away", l: "Frei" },
  ];

  // ── week editor (selected weekday) ──
  const ww = st.week[selWd];
  const weekEditor = {
    sMinus: () => setW(selWd, { s: Math.max(420, ww.s - 30) }),
    sPlus: () => setW(selWd, { s: Math.min(ww.e - 60, ww.s + 30) }),
    eMinus: () => setW(selWd, { e: Math.max(ww.s + 60, ww.e - 30) }),
    ePlus: () => setW(selWd, { e: Math.min(1440, ww.e + 30) }),
  };

  // ── day editor (selected override day) ──
  const dw = dayW(selDay);
  const dOvr = !!st.ovr[selDay];
  const dAbs = st.abs.find((x) => selDay >= x.a && selDay <= x.b);
  const dayEditor = {
    sMinus: () => setO(selDay, { s: Math.max(420, dw.s - 30) }),
    sPlus: () => setO(selDay, { s: Math.min(dw.e - 30, dw.s + 30) }),
    eMinus: () => setO(selDay, { e: Math.max(dw.s + 30, dw.e - 30) }),
    ePlus: () => setO(selDay, { e: Math.min(1440, dw.e + 30) }),
    reset: () => {
      set((p) => {
        const x = { ...p.ovr };
        delete x[selDay];
        return { ovr: x };
      });
      sync(`${dl(selDay)} zurück auf Standard`);
    },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {/* header */}
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

      {/* Google Calendar status */}
      <div
        className="glass-dark"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          borderRadius: 26,
          padding: "16px 18px",
          animation: "up 1.4s cubic-bezier(.22,1,.36,1) .05s both",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            minWidth: 0,
          }}
        >
          <span
            data-loop
            style={{
              flex: "none",
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "#7FD4A6",
              boxShadow: "0 0 0 0 rgba(127,212,166,.5)",
              animation: "ping 3s ease-out infinite",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              minWidth: 0,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 500 }}>
              Google Kalender
            </span>
            <span style={{ fontSize: 11.5, color: "rgba(244,247,250,.62)" }}>
              Verbunden · Buchungen landen automatisch hier
            </span>
          </div>
        </div>
        <span
          style={{
            flex: "none",
            fontFamily: "var(--font-geist-mono)",
            fontSize: 8.5,
            letterSpacing: ".18em",
            padding: "6px 11px",
            borderRadius: 999,
            background: "rgba(127,212,166,.16)",
            color: "#9BE4C0",
          }}
        >
          AKTIV
        </span>
      </div>

      {/* segmented sub-nav */}
      <div
        className="glass-light"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 4,
          padding: 5,
          borderRadius: 999,
          color: "#0E141C",
          animation: "up 1.4s cubic-bezier(.22,1,.36,1) .1s both",
        }}
      >
        {nav.map((n) => {
          const on = view === n.k;
          return (
            <button
              key={n.k}
              onClick={() => setView(n.k)}
              style={{
                height: 40,
                borderRadius: 999,
                border: 0,
                fontSize: 12.5,
                fontWeight: on ? 600 : 500,
                background: on
                  ? "linear-gradient(115deg,#151c28,#2a3444)"
                  : "transparent",
                color: on ? "#F4F7FA" : "rgba(14,20,28,.6)",
                transition: "all .7s cubic-bezier(.22,1,.36,1)",
              }}
            >
              {n.l}
            </button>
          );
        })}
      </div>

      {/* ── WOCHE ── */}
      {view === "week" && (
        <div
          key="week"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            animation: "tabIn .6s cubic-bezier(.22,1,.36,1) both",
          }}
        >
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
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              gap: 6,
            }}
          >
            {[1, 2, 3, 4, 5, 6, 0].map((wd) => {
              const w = st.week[wd];
              const on = selWd === wd;
              return (
                <button
                  key={wd}
                  onClick={() => setSelWd(wd)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    padding: "13px 0 11px",
                    borderRadius: 18,
                    border: `1px solid ${on ? "transparent" : "rgba(255,255,255,.35)"}`,
                    background: on
                      ? "linear-gradient(115deg,#151c28,#2a3444)"
                      : "rgba(255,255,255,.42)",
                    color: on ? "#F4F7FA" : "#0E141C",
                    transition: "all .6s cubic-bezier(.22,1,.36,1)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 10,
                      letterSpacing: ".06em",
                    }}
                  >
                    {wdS[wd]}
                  </span>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: w.on
                        ? "#F4A69E"
                        : on
                          ? "rgba(255,255,255,.3)"
                          : "rgba(14,20,28,.2)",
                      transition: "background .5s",
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* editor for the selected weekday */}
          <div
            className="glass-light"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: "18px",
              borderRadius: 26,
              color: "#0E141C",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 17, fontWeight: 500 }}>
                {wdL[selWd]}
              </span>
              <button
                onClick={() => {
                  setW(selWd, { on: !ww.on });
                  sync(`${wdL[selWd]} ${ww.on ? "geschlossen" : "geöffnet"}`);
                }}
                style={{
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
                    background: ww.on ? "#0E141C" : "rgba(14,20,28,.18)",
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
                      transform: ww.on ? "translateX(18px)" : "translateX(0)",
                      transition: "transform .8s cubic-bezier(.22,1,.36,1)",
                    }}
                  />
                </span>
              </button>
            </div>
            {ww.on ? (
              <>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <TimeBox
                    label="Erster Termin"
                    val={fmt(ww.s)}
                    minus={weekEditor.sMinus}
                    plus={weekEditor.sPlus}
                  />
                  <TimeBox
                    label="Feierabend"
                    val={fmt(ww.e)}
                    minus={weekEditor.eMinus}
                    plus={weekEditor.ePlus}
                  />
                </div>
                <span style={{ fontSize: 11.5, color: "var(--ink-60)" }}>
                  {slotsW(ww).length} buchbare Slots à 30 Min · Mitglieder sehen
                  es sofort
                </span>
              </>
            ) : (
              <span style={{ fontSize: 12.5, color: "var(--ink-60)" }}>
                Geschlossen – an {wdL[selWd]}en keine Termine buchbar.
              </span>
            )}
          </div>

          {/* pause / buffer / lead */}
          <div
            className="glass-light"
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "2px 18px",
              borderRadius: 26,
              color: "#0E141C",
            }}
          >
            <SettingRow
              title="Mittagspause"
              sub="Gilt für alle Tage"
              value={`${fmt(PZ.s)} – ${fmt(PZ.e)}`}
              minus={() => shiftP(-30)}
              plus={() => shiftP(30)}
            />
            <SettingRow
              title="Puffer"
              sub="Pause zwischen Terminen"
              value={`${st.bufferMin} min`}
              minus={() =>
                set((p) => ({ bufferMin: Math.max(0, p.bufferMin - 5) }))
              }
              plus={() =>
                set((p) => ({ bufferMin: Math.min(60, p.bufferMin + 5) }))
              }
            />
            <SettingRow
              title="Vorlaufzeit"
              sub="Frühestens buchbar in"
              value={`${st.leadHours} h`}
              minus={() =>
                set((p) => ({ leadHours: Math.max(0, p.leadHours - 1) }))
              }
              plus={() =>
                set((p) => ({ leadHours: Math.min(72, p.leadHours + 1) }))
              }
              last
            />
          </div>
        </div>
      )}

      {/* ── 2 WOCHEN ── */}
      {view === "soon" && (
        <div
          key="soon"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            animation: "tabIn .6s cubic-bezier(.22,1,.36,1) both",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={kick}>Nächste 2 Wochen</span>
            <span style={{ fontSize: 11.5, color: "var(--ink-60)" }}>
              Buchbar bis {horizonL}
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              gap: 6,
            }}
          >
            {Array.from({ length: 14 }, (_, k) => k + 1).map((o) => {
              const d = dateOf(o);
              const w = dayW(o);
              const ab = st.abs.find((x) => o >= x.a && o <= x.b);
              const on = selDay === o;
              const closed = !w.on || !!ab;
              return (
                <button
                  key={o}
                  onClick={() => setSelDay(o)}
                  style={{
                    position: "relative",
                    height: 60,
                    borderRadius: 16,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    border: `1px solid ${on ? "transparent" : ab ? "rgba(229,119,108,.25)" : "rgba(255,255,255,.35)"}`,
                    background: on
                      ? "linear-gradient(115deg,#151c28,#2a3444)"
                      : ab
                        ? "rgba(229,119,108,.1)"
                        : "rgba(255,255,255,.42)",
                    color: on ? "#F4F7FA" : "#0E141C",
                    opacity: closed && !on ? 0.6 : 1,
                    transition: "all .6s cubic-bezier(.22,1,.36,1)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 8,
                      letterSpacing: ".1em",
                      opacity: 0.7,
                    }}
                  >
                    {wdS[d.getDay()]}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: 400 }}>
                    {d.getDate()}
                  </span>
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: ab
                        ? "#E5776C"
                        : !w.on
                          ? "transparent"
                          : on
                            ? "#F4A69E"
                            : "rgba(14,20,28,.3)",
                    }}
                  />
                  {st.ovr[o] && !ab && (
                    <span
                      style={{
                        position: "absolute",
                        top: 5,
                        right: 6,
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: on ? "#F4A69E" : "#0E141C",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* editor for the selected day */}
          <div
            className="glass-light"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              padding: "18px",
              borderRadius: 26,
              color: "#0E141C",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 16, fontWeight: 500 }}>
                {dl(selDay)}
              </span>
              {dOvr && !dAbs && (
                <button
                  onClick={dayEditor.reset}
                  style={{
                    height: 34,
                    padding: "0 13px",
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
            {dAbs ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 12.5,
                  color: "var(--ink-60)",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#E5776C",
                  }}
                />
                {dAbs.why} · unter „Frei&quot; verwaltet
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    setO(selDay, { on: !dw.on });
                    sync(`${dl(selDay)} ${dw.on ? "geschlossen" : "geöffnet"}`);
                  }}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: 0,
                    background: "transparent",
                    color: "#0E141C",
                    padding: 0,
                  }}
                >
                  <span style={{ fontSize: 12.5, color: "rgba(14,20,28,.7)" }}>
                    An diesem Tag offen
                  </span>
                  <span
                    style={{
                      width: 46,
                      height: 28,
                      borderRadius: 999,
                      padding: 3,
                      background: dw.on ? "#0E141C" : "rgba(14,20,28,.18)",
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
                        transform: dw.on ? "translateX(18px)" : "translateX(0)",
                        transition: "transform .8s cubic-bezier(.22,1,.36,1)",
                      }}
                    />
                  </span>
                </button>
                {dw.on && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <TimeBox
                      label="Von"
                      val={fmt(dw.s)}
                      minus={dayEditor.sMinus}
                      plus={dayEditor.sPlus}
                    />
                    <TimeBox
                      label="Bis"
                      val={fmt(dw.e)}
                      minus={dayEditor.eMinus}
                      plus={dayEditor.ePlus}
                    />
                  </div>
                )}
                <span style={{ fontSize: 11.5, color: "var(--ink-60)" }}>
                  {dw.on
                    ? `${slotsFor(selDay).filter((m) => !isTaken(selDay, m)).length} von ${slotsFor(selDay).length} Slots frei`
                    : "Nicht buchbar"}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── FREI (absences) ── */}
      {view === "away" && (
        <div
          key="away"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            animation: "tabIn .6s cubic-bezier(.22,1,.36,1) both",
          }}
        >
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

          {absList.length > 0 ? (
            <div
              className="glass-light"
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "2px 18px",
                borderRadius: 26,
                color: "#0E141C",
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
                    borderBottom:
                      i < absList.length - 1
                        ? "1px solid rgba(14,20,28,.07)"
                        : "none",
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
                  <button
                    onClick={ab.remove}
                    style={{
                      width: 40,
                      height: 40,
                      border: 0,
                      background: "transparent",
                      color: "rgba(14,20,28,.5)",
                      fontSize: 18,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            !st.absForm && (
              <div
                className="glass-light"
                style={{ borderRadius: 26, color: "#0E141C" }}
              >
                <EmptyState
                  title="Keine Abwesenheiten"
                  sub="Trag Ferien, einen freien Tag oder eine Weiterbildung ein – die betroffenen Mitglieder werden automatisch informiert."
                  glyph="☀"
                  tone="light"
                  compact
                />
              </div>
            )
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
                borderRadius: 26,
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
      )}
    </div>
  );
}

function SettingRow({
  title,
  sub,
  value,
  minus,
  plus,
  last,
}: {
  title: string;
  sub: string;
  value: string;
  minus: () => void;
  plus: () => void;
  last?: boolean;
}) {
  return (
    // wraps: the stepper sits right when there's room, below on narrow phones
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "8px 10px",
        minHeight: 62,
        padding: "10px 0",
        borderBottom: last ? "none" : "1px solid rgba(14,20,28,.07)",
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
        <span style={{ fontSize: 14, fontWeight: 500 }}>{title}</span>
        <span style={{ fontSize: 11, color: "var(--ink-60)" }}>{sub}</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginLeft: "auto",
        }}
      >
        <button onClick={minus} style={stepBtnSm} aria-label="weniger">
          −
        </button>
        <span
          style={{
            minWidth: 92,
            textAlign: "center",
            whiteSpace: "nowrap",
            fontFamily: "var(--font-geist-mono)",
            fontSize: 11.5,
          }}
        >
          {value}
        </span>
        <button onClick={plus} style={stepBtnSm} aria-label="mehr">
          +
        </button>
      </div>
    </div>
  );
}

// Time stepper (−/value/+). A plain value, not a native time input, so the
// browser's clock icon can't overflow the narrow column on mobile.
function TimeBox({
  label,
  val,
  minus,
  plus,
}: {
  label: string;
  val: string;
  minus: () => void;
  plus: () => void;
}) {
  // full-width row (label left, stepper right) — never squeezed into a narrow
  // column; wraps below the label only on the very narrowest phones
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "6px 8px",
        padding: "8px 8px 8px 16px",
        borderRadius: 18,
        background: "rgba(255,255,255,.45)",
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: 12.5, color: "var(--ink-62)" }}>{label}</span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginLeft: "auto",
        }}
      >
        <button onClick={minus} style={stepBtnSm} aria-label="früher">
          −
        </button>
        <span
          style={{
            width: 58,
            textAlign: "center",
            fontFamily: "var(--font-geist-mono)",
            fontSize: 15,
          }}
        >
          {val}
        </span>
        <button onClick={plus} style={stepBtnSm} aria-label="später">
          +
        </button>
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
const stepBtnSm: React.CSSProperties = {
  flex: "none",
  width: 38,
  height: 38,
  borderRadius: "50%",
  border: "1px solid rgba(14,20,28,.1)",
  background: "rgba(255,255,255,.6)",
  color: "#0E141C",
  fontSize: 16,
};
