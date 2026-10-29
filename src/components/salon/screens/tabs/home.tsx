"use client";

import { useRef } from "react";
import { useSalon } from "../../store";
import { useSalonActions } from "../../actions";
import {
  dateOf,
  labelOf,
  svcName,
  tiers,
  wdL,
  mon,
  monS,
  type ServiceKey,
} from "@/lib/data";
import { cancelUpcomingAction } from "@/lib/actions";

const HR = 13; // demo "now" hour → greeting

export function HomeTab() {
  const { state, set, say } = useSalon();
  const a = useSalonActions();
  const st = state;
  const U = st.user ?? {
    first: "Luca",
    last: "Meier",
    cuts: 41,
    since: [2, 2024] as [number, number],
    no: "0047",
    phone: "",
    isNew: false,
  };
  const cuts = U.cuts;
  const ti = tiers.reduce((acc, t, k) => (cuts >= t.min ? k : acc), 0);
  const T = tiers[ti];
  const TN = tiers[ti + 1];
  const INV = st.invites ?? [];
  const used = INV.length;
  const free = 3 - used;
  const now = dateOf(0);

  // hold-to-release refs
  const fillRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const raf = useRef<number>(0);
  const holdDone = useRef(false);
  const holdT = useRef<ReturnType<typeof setTimeout> | null>(null);

  const holdStart = () => {
    cancelAnimationFrame(raf.current);
    const el = fillRef.current;
    if (!el) return;
    el.style.transition = "none";
    const t0 = performance.now();
    const loop = (t: number) => {
      const p = Math.min(1, (t - t0) / 1300);
      const e = 1 - Math.pow(1 - p, 2);
      el.style.width = e * 100 + "%";
      const rg = ringRef.current;
      if (rg) {
        rg.style.transition = "none";
        rg.style.strokeDashoffset = (119.4 * (1 - e)).toFixed(1);
      }
      if (p >= 1) {
        holdDone.current = true;
        if (labelRef.current) labelRef.current.textContent = "Freigegeben";
        if (holdT.current) clearTimeout(holdT.current);
        holdT.current = setTimeout(() => {
          holdDone.current = false;
          // Termin serverseitig absagen: Supabase-Status + Google-Event in einem.
          cancelUpcomingAction().catch(() => {});
          set({ appt: null, cancelling: false });
          say("Termin freigegeben");
        }, 700);
        return;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  };
  const holdEnd = () => {
    cancelAnimationFrame(raf.current);
    const el = fillRef.current;
    if (!el || holdDone.current) return;
    el.style.transition = "width .8s cubic-bezier(.22,1,.36,1)";
    el.style.width = "0%";
    const rg = ringRef.current;
    if (rg) {
      rg.style.transition = "stroke-dashoffset .8s cubic-bezier(.22,1,.36,1)";
      rg.style.strokeDashoffset = "119.4";
    }
  };

  // appt display
  const appt = st.appt
    ? (() => {
        const d = dateOf(st.appt.off);
        return {
          price: st.appt.price ?? 20,
          payL: "Bezahlung vor Ort",
          time: st.appt.time,
          dateLong: `${wdL[d.getDay()]}, ${d.getDate()}. ${mon[d.getMonth()]}`,
          rel:
            st.appt.off === 1
              ? "Morgen"
              : st.appt.off === 0
                ? "Heute"
                : `In ${st.appt.off} Tagen`,
          services: st.appt.services.map((k) => svcName(k)),
          dur: st.appt.services.length ? 30 : 0,
        };
      })()
    : null;

  // rhythm
  const hist = st.history ?? [];
  const hasRhythm = hist.length >= 2;
  let rhythm: {
    meta: string;
    title: string;
    sub: string;
    dots: {
      x: string;
      s: string;
      m: string;
      bg: string;
      bs: string;
      border: string;
      anim: string;
    }[];
    axis: string[];
  };
  if (hasRhythm) {
    const offs = hist.map((x) => x.off).sort((p, q) => p - q);
    const gaps = offs.slice(1).map((v, i) => v - offs[i]);
    const avg = gaps.reduce((p, q) => p + q, 0) / gaps.length;
    const due = offs[offs.length - 1] + Math.round(avg);
    const dueD = dateOf(due);
    const lo = -112,
      hi = 28;
    const X = (o: number) => (((o - lo) / (hi - lo)) * 100).toFixed(2) + "%";
    const dots = offs.map((o) => ({
      x: X(o),
      s: "8px",
      m: "-4px 0 0 -4px",
      bg: "#0E141C",
      bs: "solid",
      border: "#0E141C",
      anim: "none",
    }));
    dots.push({
      x: X(0),
      s: "2px",
      m: "-9px 0 0 -1px",
      bg: "rgba(14,20,28,.35)",
      bs: "solid",
      border: "transparent",
      anim: "none",
    });
    if (st.appt)
      dots.push({
        x: X(st.appt.off),
        s: "10px",
        m: "-5px 0 0 -5px",
        bg: "#F4A69E",
        bs: "solid",
        border: "#F4A69E",
        anim: "ping 2.8s ease-out infinite",
      });
    else
      dots.push({
        x: X(due),
        s: "10px",
        m: "-5px 0 0 -5px",
        bg: "transparent",
        bs: "dashed",
        border: "rgba(14,20,28,.5)",
        anim: "none",
      });
    const wk = avg / 7;
    rhythm = {
      meta: hist.length + " Besuche",
      title: `Alle ${wk < 3.25 ? "3" : wk.toFixed(1).replace(".", ",")} Wochen`,
      sub: st.appt
        ? "Dein Termin passt in den Takt."
        : `Nächster Schnitt fällig um den ${dueD.getDate()}. ${monS[dueD.getMonth()]}.`,
      axis: [
        monS[dateOf(-105).getMonth()],
        monS[dateOf(-60).getMonth()],
        monS[dateOf(-20).getMonth()],
        "Heute",
        monS[dateOf(25).getMonth()],
      ],
      dots,
    };
  } else {
    rhythm = {
      meta: "Neu",
      title: "Noch kein Takt.",
      sub: "Nach dem dritten Besuch erkennen wir deinen Rhythmus und erinnern dich rechtzeitig.",
      dots: [],
      axis: [],
    };
  }

  const history = hist
    .slice()
    .sort((p, q) => q.off - p.off)
    .slice(0, 3)
    .map((x) => {
      const d = dateOf(x.off);
      return {
        date: `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.`,
        what: labelOf(x.s as ServiceKey[]),
        ago: `vor ${Math.round(-x.off / 7)} Wo.`,
      };
    });

  const span = TN ? TN.min - T.min : 10;
  const filled = cuts - T.min;
  const tierDots = Array.from({ length: span }, (_, k) => ({
    bg: k < filled ? "#0E141C" : "transparent",
    border:
      k < filled ? "#0E141C" : k === filled ? "#E5776C" : "rgba(14,20,28,.2)",
    anim: k === filled ? "breathe 3s ease-in-out infinite" : "none",
  }));

  const sinceShort =
    String(U.since[0] + 1).padStart(2, "0") + "·" + String(U.since[1]).slice(2);
  const sinceLong = mon[U.since[0]] + " " + U.since[1];
  const greeting =
    HR < 11 ? "Guten Morgen" : HR < 18 ? "Guten Tag" : "Guten Abend";
  const todayLabel = `${wdL[now.getDay()]}, ${now.getDate()}. ${mon[now.getMonth()]}`;

  const reschedule = () => {
    set({
      rescheduling: true,
      sel: [...(st.appt?.services ?? [])],
      time: null,
      tab: "book",
      cancelling: false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        <span style={kick}>{todayLabel}</span>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(28px,4.4vw,40px)",
            fontWeight: 300,
            letterSpacing: "-.025em",
            lineHeight: 1.1,
          }}
        >
          {greeting}, {U.first}.
        </h1>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(330px,100%),1fr))",
          gap: 12,
          alignItems: "start",
        }}
      >
        {/* left column: appt + rhythm */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minWidth: 0,
          }}
        >
          <div
            className="glass-dark"
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: 34,
              padding: 24,
              animation: "up 1.6s cubic-bezier(.22,1,.36,1) .1s both",
              minHeight: 340,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              data-loop
              style={{
                position: "absolute",
                right: -70,
                top: -70,
                width: 240,
                height: 240,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle,rgba(244,166,158,.32),transparent 65%)",
                animation: "breathe 9s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />
            {appt ? (
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: 22,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={kickD}>Nächster Termin</span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 11.5,
                      color: "rgba(244,247,250,.75)",
                    }}
                  >
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
                    Bestätigt
                  </span>
                </div>
                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: "clamp(66px,10vw,88px)",
                      fontWeight: 200,
                      letterSpacing: "-.045em",
                      lineHeight: 0.88,
                    }}
                  >
                    {appt.time}
                  </span>
                  <span style={{ fontSize: 15.5, fontWeight: 400 }}>
                    {appt.dateLong}
                  </span>
                  <span style={kickD}>
                    {appt.rel} · {appt.dur} min
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {appt.services.map((s, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "7px 13px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,.08)",
                        border: "1px solid rgba(255,255,255,.12)",
                        fontSize: 11.5,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <div
                  style={{ height: 1, background: "rgba(255,255,255,.1)" }}
                />
                {!st.cancelling ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                      animation: "fade .8s ease both",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                      }}
                    >
                      <span style={{ fontSize: 13 }}>
                        <span style={{ color: "rgba(244,247,250,.55)" }}>
                          CHF{" "}
                        </span>
                        {appt.price}.–
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          color: "rgba(244,247,250,.55)",
                        }}
                      >
                        {appt.payL}
                      </span>
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => a.goTab("card")}
                        style={{
                          height: 40,
                          border: 0,
                          background: "#F4F7FA",
                          color: "#0E141C",
                          borderRadius: 999,
                          padding: "0 16px",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        Karte
                      </button>
                      <button
                        onClick={reschedule}
                        style={{
                          height: 40,
                          border: "1px solid rgba(255,255,255,.18)",
                          background: "transparent",
                          color: "#F4F7FA",
                          borderRadius: 999,
                          padding: "0 16px",
                          fontSize: 12,
                        }}
                      >
                        Verschieben
                      </button>
                      <button
                        onClick={() => set({ cancelling: true })}
                        style={{
                          height: 40,
                          border: 0,
                          background: "transparent",
                          color: "rgba(244,247,250,.6)",
                          borderRadius: 999,
                          padding: "0 12px",
                          fontSize: 12,
                        }}
                      >
                        Absagen
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                      animation: "up 1s cubic-bezier(.22,1,.36,1) both",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 14,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: 300,
                            letterSpacing: "-.01em",
                          }}
                        >
                          Termin freigeben?
                        </span>
                        <span
                          style={{
                            fontSize: 11.5,
                            lineHeight: 1.45,
                            color: "rgba(244,247,250,.62)",
                            textWrap: "pretty",
                          }}
                        >
                          Bis 24 h vorher kostenlos. Der Slot geht sofort zurück
                          in den Kalender.
                        </span>
                      </div>
                      <button
                        onClick={() => set({ cancelling: false })}
                        style={{
                          flex: "none",
                          height: 36,
                          border: "1px solid rgba(255,255,255,.18)",
                          borderRadius: 999,
                          background: "transparent",
                          color: "#F4F7FA",
                          padding: "0 14px",
                          fontSize: 12,
                        }}
                      >
                        Behalten
                      </button>
                    </div>
                    <button
                      onPointerDown={holdStart}
                      onPointerUp={holdEnd}
                      onPointerLeave={holdEnd}
                      onPointerCancel={holdEnd}
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        height: 56,
                        borderRadius: 999,
                        border: 0,
                        background: "rgba(255,255,255,.05)",
                        boxShadow:
                          "inset 0 0 0 1px rgba(255,255,255,.12),inset 0 1px 2px rgba(0,0,0,.25)",
                        color: "#F4F7FA",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 6px",
                        touchAction: "none",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        cursor: "pointer",
                      }}
                    >
                      <span
                        ref={fillRef}
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: "0%",
                          borderRadius: 999,
                          background:
                            "linear-gradient(90deg,rgba(255,255,255,.03),rgba(255,255,255,.18))",
                        }}
                      />
                      <span
                        style={{
                          position: "relative",
                          flex: "none",
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          background: "#F4F7FA",
                          color: "#0E141C",
                          display: "grid",
                          placeItems: "center",
                          boxShadow: "0 8px 20px -8px rgba(0,0,0,.55)",
                        }}
                      >
                        <svg
                          width="44"
                          height="44"
                          viewBox="0 0 44 44"
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 0,
                            transform: "rotate(-90deg)",
                          }}
                        >
                          <circle
                            cx="22"
                            cy="22"
                            r="19"
                            fill="none"
                            stroke="rgba(14,20,28,.08)"
                            strokeWidth="1.5"
                          />
                          <circle
                            ref={ringRef}
                            cx="22"
                            cy="22"
                            r="19"
                            fill="none"
                            stroke="#0E141C"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeDasharray="119.4"
                            strokeDashoffset="119.4"
                          />
                        </svg>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        >
                          <path d="M3 3l6 6M9 3l-6 6" />
                        </svg>
                      </span>
                      <span
                        style={{
                          position: "relative",
                          flex: 1,
                          display: "flex",
                          justifyContent: "center",
                          paddingRight: 44,
                        }}
                      >
                        <span
                          ref={labelRef}
                          data-loop
                          style={{
                            fontSize: 13,
                            fontWeight: 500,
                            letterSpacing: ".02em",
                            color: "transparent",
                            background:
                              "linear-gradient(90deg,rgba(244,247,250,.42) 0%,rgba(244,247,250,.42) 35%,#fff 50%,rgba(244,247,250,.42) 65%,rgba(244,247,250,.42) 100%)",
                            backgroundSize: "200% 100%",
                            WebkitBackgroundClip: "text",
                            backgroundClip: "text",
                            animation: "shimmer 3.2s linear infinite",
                          }}
                        >
                          Gedrückt halten
                        </span>
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  flex: 1,
                  animation: "fade 1s ease both",
                }}
              >
                <span style={kickD}>Kein Termin</span>
                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 32,
                      fontWeight: 300,
                      letterSpacing: "-.02em",
                      lineHeight: 1.1,
                    }}
                  >
                    Dein Stuhl wartet.
                  </span>
                  <span
                    style={{ fontSize: 13, color: "rgba(244,247,250,.65)" }}
                  >
                    Buch deinen nächsten Schnitt.
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => a.goTab("book")}
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
                    Termin buchen <span style={{ fontWeight: 300 }}>→</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* rhythm */}
          <div
            className="glass-light"
            style={{
              borderRadius: 30,
              padding: 22,
              color: "#0E141C",
              animation: "up 1.6s cubic-bezier(.22,1,.36,1) .25s both",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={kick}>Dein Rhythmus</span>
              <span style={{ fontSize: 11.5, color: "var(--ink-60)" }}>
                {rhythm.meta}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 300,
                  letterSpacing: "-.01em",
                }}
              >
                {rhythm.title}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  color: "var(--ink-62)",
                  textWrap: "pretty",
                }}
              >
                {rhythm.sub}
              </span>
            </div>
            <div style={{ position: "relative", height: 26 }}>
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: "50%",
                  borderTop: "1px dashed rgba(14,20,28,.18)",
                }}
              />
              {rhythm.dots.map((d, i) => (
                <span
                  key={i}
                  data-loop
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: d.x,
                    width: d.s,
                    height: d.s,
                    margin: d.m,
                    borderRadius: "50%",
                    background: d.bg,
                    border: `1px ${d.bs} ${d.border}`,
                    animation: d.anim,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "var(--font-geist-mono)",
                fontSize: 8.5,
                letterSpacing: ".16em",
                color: "rgba(14,20,28,.55)",
              }}
            >
              {rhythm.axis.map((ax, i) => (
                <span key={i}>{ax}</span>
              ))}
            </div>
          </div>
        </div>

        {/* right column: stats + tier + history */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            minWidth: 0,
          }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div
              className="glass-light"
              style={{
                aspectRatio: "1/1",
                borderRadius: 30,
                padding: 20,
                color: "#0E141C",
                animation: "up 1.6s cubic-bezier(.22,1,.36,1) .2s both",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 12, color: "rgba(14,20,28,.7)" }}>
                Mitglied seit
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span
                  style={{
                    fontSize: 32,
                    fontWeight: 200,
                    letterSpacing: "-.03em",
                    lineHeight: 1,
                  }}
                >
                  {sinceShort}
                </span>
                <span style={kick}>{sinceLong}</span>
              </div>
            </div>
            <div
              className="glass-dark"
              style={{
                aspectRatio: "1/1",
                borderRadius: 30,
                padding: 20,
                animation: "up 1.6s cubic-bezier(.22,1,.36,1) .3s both",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 12, color: "rgba(244,247,250,.75)" }}>
                Cuts
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span
                  style={{
                    fontSize: 48,
                    fontWeight: 200,
                    letterSpacing: "-.04em",
                    lineHeight: 1,
                  }}
                >
                  {cuts}
                </span>
                <span style={{ fontSize: 12, color: "rgba(244,247,250,.55)" }}>
                  total
                </span>
              </div>
            </div>
          </div>

          <div
            className="glass-light"
            style={{
              borderRadius: 30,
              padding: 22,
              color: "#0E141C",
              animation: "up 1.6s cubic-bezier(.22,1,.36,1) .35s both",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 500 }}>
                Tier {T.r} · {T.n}
              </span>
              <span style={{ fontSize: 11.5, color: "var(--ink-60)" }}>
                {TN ? `noch ${TN.min - cuts} bis ${TN.n}` : "Höchstes Tier"}
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {tierDots.map((d, i) => (
                <span
                  key={i}
                  data-loop
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: d.bg,
                    border: `1px solid ${d.border}`,
                    animation: d.anim,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "var(--font-geist-mono)",
                fontSize: 8.5,
                letterSpacing: ".18em",
                color: "rgba(14,20,28,.55)",
              }}
            >
              <span>{T.r}</span>
              <span>{TN ? TN.n : "—"}</span>
            </div>
          </div>

          <div
            className="glass-light"
            style={{
              borderRadius: 30,
              padding: "20px 22px 8px",
              color: "#0E141C",
              animation: "up 1.6s cubic-bezier(.22,1,.36,1) .45s both",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span style={{ ...kick, paddingBottom: 6 }}>Verlauf</span>
            {history.length ? (
              history.map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "62px 1fr auto",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 0",
                    borderTop: "1px solid rgba(14,20,28,.07)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 10,
                      color: "var(--ink-60)",
                    }}
                  >
                    {h.date}
                  </span>
                  <span style={{ fontSize: 13 }}>{h.what}</span>
                  <span style={{ fontSize: 11.5, color: "rgba(14,20,28,.55)" }}>
                    {h.ago}
                  </span>
                </div>
              ))
            ) : (
              <span
                style={{
                  fontSize: 12.5,
                  color: "var(--ink-60)",
                  padding: "10px 0 14px",
                }}
              >
                Dein erster Schnitt steht noch aus.
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => a.goTab("circle")}
        style={{
          alignSelf: "flex-start",
          display: "flex",
          alignItems: "center",
          gap: 12,
          border: 0,
          background: "transparent",
          color: "rgba(14,20,28,.72)",
          padding: "14px 0",
          margin: "-8px 0",
          fontSize: 12.5,
          animation: "fade 1.6s ease .7s both",
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
                background: k < used ? "#0E141C" : "transparent",
                border: `1px solid ${k < used ? "#0E141C" : "rgba(14,20,28,.4)"}`,
              }}
            />
          ))}
        </span>
        {free <= 0
          ? "Alle Einladungen vergeben"
          : free === 1
            ? "Eine Einladung frei"
            : free + " Einladungen frei"}{" "}
        →
      </button>
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
