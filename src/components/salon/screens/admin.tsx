"use client";

import { useSalon, type AdminTab } from "../store";
import { useSalonActions } from "../actions";
import { Icon } from "../icons";
import { CalendarTab } from "../admin-calendar";
import { AvailTab } from "../admin-avail";
import { InviteGenerator, MemberCount } from "../invite-generator";
import { EmptyState } from "../empty-state";
import { useEffect, useRef, useState } from "react";
import { stateToAvail } from "@/lib/avail-view";
import {
  saveAvailabilityAction,
  listMembersAction,
  listTodayAppointmentsAction,
  listRevenueAction,
  markApptDoneAction,
  type AdminMember,
  type AdminTodayAppt,
  type RevenueData,
} from "@/lib/actions";
import { labelOf, durOf, priceOf, dateOf, wdL, mon, fmtTime } from "@/lib/data";

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
const ini2 = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const A_NAV: { k: AdminTab; label: string; icon: string }[] = [
  { k: "today", label: "Heute", icon: "today" },
  { k: "termine", label: "Termine", icon: "cal" },
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
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    listTodayAppointmentsAction()
      .then((r) => setToday({ nowMin, appts: r ?? [] }))
      .catch(() => setToday({ nowMin, appts: [] }));
  }, []);
  // Revenue, aggregated over months (the Umsatz tab).
  const [rev, setRev] = useState<RevenueData | null>(null);
  useEffect(() => {
    listRevenueAction()
      .then((r) => setRev(r))
      .catch(() => {});
  }, []);

  // Zeiten: every change in the Zeiten tab is saved to the DB (debounced), so
  // a reload shows it again and member booking uses the same hours. Lives
  // here, not in the tab, so switching tabs never drops a pending save.
  const availJson = JSON.stringify(
    stateToAvail({
      week: st.week,
      pause: st.pause,
      bufferMin: st.bufferMin,
      leadHours: st.leadHours,
      ovr: st.ovr,
      abs: st.abs,
    }),
  );
  const savedAvail = useRef<string | null>(null);
  useEffect(() => {
    if (!st.availLoaded) return;
    if (savedAvail.current === null) {
      savedAvail.current = availJson; // what came from the DB
      return;
    }
    if (availJson === savedAvail.current) return;
    const t = setTimeout(() => {
      saveAvailabilityAction(JSON.parse(availJson))
        .then((r) => {
          if (!r.ok) throw new Error("save");
          savedAvail.current = availJson;
          say("Gespeichert");
        })
        .catch(() => say("Nicht gespeichert – bitte nochmal"));
    }, 700);
    return () => clearTimeout(t);
  }, [availJson, st.availLoaded, say]);

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
  const openClient = (m: AdminMember) => set({ sheet: { type: "client", m } });
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
        say(`${cur.n.split(" ")[0]} · CHF ${priceOf(cur.sv)} belastet`);
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
  // Timeline spans today's real opening hours (and any appointment outside).
  const todayRule = st.ovr[0] ?? st.week[dateOf(0).getDay()];
  const tlS =
    Math.floor(Math.min(todayRule.s, ...appts.map((ap) => ap.start)) / 60) * 60;
  const tlE =
    Math.ceil(
      Math.max(todayRule.e, ...appts.map((ap) => ap.start + ap.dur)) / 60,
    ) * 60;
  const tlH = Math.max(1, (tlE - tlS) / 60);
  const showNow = nowMin >= tlS && nowMin <= tlE;
  const showPause = todayRule.on && st.pause.s >= tlS && st.pause.e <= tlE;
  const HP = 76,
    top = (m: number) => ((m - tlS) / 60) * HP;
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
  const todayChf = appts
    .filter(isDone)
    .reduce((s, ap) => s + priceOf(ap.sv), 0);
  const dayStats = [
    { l: "Erledigt", v: doneN },
    { l: "Offen", v: appts.length - doneN },
    { l: "Heute CHF", v: todayChf },
  ];
  const hh = (m: number) => String(Math.floor(m / 60)).padStart(2, "0");
  const hours = Array.from({ length: tlH + 1 }, (_, k) => ({
    l: hh(tlS + k * 60),
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

  // ── Revenue (real, aggregated over months via listRevenueAction) ──
  const revMonths = rev?.months ?? [];
  const revMax = Math.max(1, ...revMonths.map((m) => m.total));
  const rev6Total = revMonths.reduce((s, m) => s + m.total, 0);
  const revAvg =
    rev && rev.monthCount ? Math.round(rev.month / rev.monthCount) : null;
  const chf = (n: number) => n.toLocaleString("de-CH");

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
          ) : appts.length === 0 ? (
            <div
              className="glass-dark"
              style={{
                borderRadius: 34,
                animation: "up 1.4s cubic-bezier(.22,1,.36,1) both",
              }}
            >
              <EmptyState
                title="Heute noch frei"
                sub="Keine Termine für heute. Gebuchte Termine erscheinen hier, sobald ein Mitglied bucht."
                glyph="✂"
                tone="dark"
              />
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
                {hh(tlS)} – {hh(tlE)} Uhr
              </span>
            </div>
            <div style={{ position: "relative", height: tlH * HP + 8 + "px" }}>
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
              {showNow && (
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
              )}
              {showPause && (
                <div
                  style={{
                    position: "absolute",
                    zIndex: 1,
                    left: 48,
                    right: 0,
                    top: top(st.pause.s) + 2 + "px",
                    height: ((st.pause.e - st.pause.s) / 60) * HP - 4 + "px",
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
              )}
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
          {realMem.length === 0 ? (
            <div
              className="glass-light"
              style={{
                borderRadius: 30,
                color: "#0E141C",
                animation: "up 1.6s cubic-bezier(.22,1,.36,1) .2s both",
              }}
            >
              <EmptyState
                title="Noch keine Mitglieder"
                sub="Erzeuge oben einen Einladungscode – deine ersten Member erscheinen hier, sobald sie beitreten."
                glyph="✦"
                tone="light"
              />
            </div>
          ) : memberList.length === 0 ? (
            <div
              className="glass-light"
              style={{ borderRadius: 30, color: "#0E141C" }}
            >
              <EmptyState
                title="Keine Treffer"
                sub="Andere Suche oder ein anderer Tier-Filter?"
                glyph="⌕"
                tone="light"
                compact
              />
            </div>
          ) : (
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
                      <span style={{ fontSize: 14, fontWeight: 500 }}>
                        {m.n}
                      </span>
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
          )}
        </div>
      )}

      {st.aTab === "termine" && <CalendarTab />}

      {st.aTab === "avail" && <AvailTab />}

      {/* ── REVENUE (real, über Monate skalierbar: CHF 15 / 20 pro Termin) ── */}
      {st.aTab === "revenue" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* hero: this month */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              animation: "up 1.4s cubic-bezier(.22,1,.36,1) both",
            }}
          >
            <span style={kick}>Umsatz · {rev?.monthLabel ?? "Monat"}</span>
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
                {chf(rev?.month ?? 0)}
              </span>
            </div>
            <span style={{ fontSize: 12.5, color: "rgba(14,20,28,.65)" }}>
              {rev?.monthCount ?? 0}{" "}
              {rev?.monthCount === 1 ? "Schnitt" : "Schnitte"} diesen Monat ·
              CHF 15 pro Schnitt, 20 mit Bart
            </span>
          </div>

          {/* 6-month trend (real) or an empty state until there's revenue */}
          {rev6Total > 0 ? (
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
                <span style={kickD}>Letzte 6 Monate</span>
                <span
                  style={{ fontSize: 11.5, color: "rgba(244,247,250,.65)" }}
                >
                  CHF {chf(rev6Total)}
                </span>
              </div>
              <div
                style={{
                  height: 150,
                  display: "grid",
                  gridTemplateColumns: "repeat(6,minmax(0,1fr))",
                  gap: 10,
                  alignItems: "end",
                }}
              >
                {revMonths.map((m, i) => (
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
                      {m.total ? chf(m.total) : "—"}
                    </span>
                    <div
                      style={{
                        width: "100%",
                        maxWidth: 26,
                        height: Math.max(3, (m.total / revMax) * 100) + "px",
                        borderRadius: 999,
                        background:
                          i === revMonths.length - 1
                            ? "#F4A69E"
                            : "rgba(244,247,250,.85)",
                        transformOrigin: "bottom",
                        animation: "grow 1.6s cubic-bezier(.22,1,.36,1) both",
                        animationDelay: 0.3 + i * 0.09 + "s",
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
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="glass-dark"
              style={{
                borderRadius: 32,
                animation: "up 1.6s cubic-bezier(.22,1,.36,1) .15s both",
              }}
            >
              <EmptyState
                title="Noch kein Umsatz"
                sub='Jeder erledigte Termin zählt mit CHF 15 (20 mit Bart). Buch den ersten im „Heute"-Tab ab – Monate und Trend bauen sich hier automatisch auf.'
                glyph="CHF"
                tone="dark"
              />
            </div>
          )}

          {/* today / week / avg tiles */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,minmax(0,1fr))",
              gap: 10,
            }}
          >
            {[
              { l: "Heute", v: "CHF " + chf(rev?.today ?? 0) },
              { l: "Diese Woche", v: "CHF " + chf(rev?.week ?? 0) },
              { l: "Ø / Schnitt", v: revAvg != null ? "CHF " + revAvg : "—" },
            ].map((t, i) => (
              <div
                key={i}
                className="glass-light"
                style={{
                  padding: "16px 14px",
                  borderRadius: 24,
                  color: "#0E141C",
                  animation: `up 1.6s cubic-bezier(.22,1,.36,1) ${0.25 + i * 0.05}s both`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 11, color: "var(--ink-62)" }}>
                  {t.l}
                </span>
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 300,
                    letterSpacing: "-.02em",
                  }}
                >
                  {t.v}
                </span>
              </div>
            ))}
          </div>

          <span
            style={{ padding: "0 4px", fontSize: 11.5, color: "var(--ink-60)" }}
          >
            Verdient = erledigte Termine · bezahlt vor Ort (bar oder TWINT).
          </span>
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
                  // shrinks on very narrow phones (320px) so the bar never overflows
                  minWidth: "clamp(42px, 12vw, 50px)",
                  padding: "0 clamp(10px, 3.6vw, 16px)",
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
