"use client";

import { useEffect, useRef } from "react";
import { useSalon } from "../store";
import { useOverlayActions } from "./overlay-actions";
import { bgImg, usePortrait } from "../use-portrait";
import { gallery } from "@/lib/data";

const STRP =
  "repeating-linear-gradient(135deg,rgba(255,255,255,.045) 0 1px,transparent 1px 13px)";
const MODES: [string, string][] = [
  ["compare", "Vergleich"],
  ["detail", "Detail"],
  ["index", "Index"],
];

export function CutsOverlay() {
  const { state, set } = useSalon();
  const ov = useOverlayActions();
  const portrait = usePortrait();
  const stageRef = useRef<HTMLDivElement>(null);
  const cutsRef = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const rafId = useRef(0);
  const swT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cmp = useRef(50);

  const setCmp = (x: number) => {
    cmp.current = x;
    stageRef.current?.style.setProperty("--cmp", x + "%");
  };
  const sweep = (from = 94, to = 50, delay = 650, dur = 1600) => {
    cancelAnimationFrame(rafId.current);
    if (swT.current) clearTimeout(swT.current);
    setCmp(from);
    swT.current = setTimeout(() => {
      const t0 = performance.now();
      const stepFn = (t: number) => {
        const k = Math.min(1, (t - t0) / dur);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        setCmp(from + (to - from) * e);
        if (k < 1) rafId.current = requestAnimationFrame(stepFn);
      };
      rafId.current = requestAnimationFrame(stepFn);
    }, delay);
  };

  const pickCut = (i: number) => {
    const n = gallery.length;
    i = Math.max(0, Math.min(n - 1, i));
    if (i === state.cIdx) return;
    set({ cIdx: i, dHov: 1 });
    if (state.cMode === "compare") sweep(94, 50, 700, 1500);
  };
  const setMode = (m: "compare" | "detail" | "index") => {
    if (m === state.cMode) return;
    set({ cMode: m, iHov: -1 });
    if (m === "compare") sweep(94, 50, 300, 1400);
    cutsRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openFromIndex = (i: number) => {
    set({ cIdx: i, cMode: "compare", iHov: -1, dHov: 1 });
    sweep(94, 50, 500, 1500);
    if (cutsRef.current) cutsRef.current.scrollTop = 0;
  };

  const stageAt = (clientX: number) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCmp(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)));
  };

  useEffect(() => {
    if (state.cOn && state.cMode === "compare") sweep(94, 50, 900, 1700);
    return () => {
      cancelAnimationFrame(rafId.current);
      if (swT.current) clearTimeout(swT.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.cOn]);

  useEffect(() => {
    if (!state.cOn) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        pickCut(state.cIdx + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        pickCut(state.cIdx - 1);
      } else if (e.key === "Escape") ov.closeCuts();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.cOn, state.cIdx, state.cMode]);

  if (!state.cOn) return null;
  const img = bgImg(portrait);
  const ci = state.cIdx;
  const n = gallery.length;
  const ik = ["compare", "detail", "index"].indexOf(state.cMode);

  const gal = gallery.map((g, i) => {
    const k = i === ci ? 0 : i < ci ? -1 : 1;
    const h = g.hue;
    const no = String(i + 1).padStart(2, "0");
    const before = `oklch(0.64 0.022 ${h + 40})`;
    const after = `oklch(0.36 0.05 ${h})`;
    return {
      name: g.name,
      sub: g.sub,
      note: g.note,
      no,
      before,
      after,
      bgB: `${STRP},${before}`,
      bgA: `${STRP},${after}`,
      glow: `oklch(0.55 0.09 ${h} / .55)`,
      glowO: k === 0 ? 0.9 : 0,
      clip:
        k === 0
          ? "inset(0% 0% 0% 0%)"
          : k < 0
            ? "inset(0% 100% 0% 0%)"
            : "inset(0% 0% 0% 100%)",
      sc: k === 0 ? "scale(1)" : "scale(1.12)",
      shots: ["Profil", "Nacken", "Front"].map((l, j) => ({
        l,
        code: no + String.fromCharCode(67 + j),
        bg: `${STRP},oklch(${0.3 + j * 0.07} 0.05 ${h + j * 10})`,
        flex: state.dHov === j ? 2.6 : 1,
        lo: state.dHov === j ? 1 : 0.55,
        hov: () => set({ dHov: j }),
      })),
      tw: k === 0 ? "78px" : "44px",
      to: k === 0 ? 1 : 0.5,
      tsh:
        k === 0
          ? "inset 0 0 0 1.5px #F4F7FA"
          : "inset 0 0 0 1px rgba(255,255,255,.12)",
      io: k === 0 ? 1 : 0,
      itf: k === 0 ? "none" : `translateY(${k * 18}px)`,
      ifl: k === 0 ? "blur(0px)" : "blur(8px)",
      ipe: k === 0 ? ("auto" as const) : ("none" as const),
      id: k === 0 ? ".35s" : "0s",
      specRows: g.specs.map((s, j) => ({
        k: s[0],
        v: s[1],
        d: k === 0 ? 0.5 + j * 0.08 + "s" : "0s",
        o: k === 0 ? 1 : 0,
        tf: k === 0 ? "none" : "translateY(8px)",
      })),
      hclip: state.iHov === i ? "inset(0% 0% 0% 0%)" : "inset(100% 0% 0% 0%)",
      hlabel: state.iHov === i ? "Nachher" : "Vorher",
      hin: () => set({ iHov: i }),
      delay: 0.15 + 0.08 * i + "s",
      pick: () => pickCut(i),
      open: () => openFromIndex(i),
    };
  });

  const cutCols = String(ci + 1)
    .padStart(2, "0")
    .split("")
    .map((d, j) => ({ ty: -Number(d) * 1.1 + "em", d: j * 0.09 + "s" }));
  const galPct = ((ci + 1) / n) * 100 + "%";
  const mono9: React.CSSProperties = {
    fontFamily: "var(--font-geist-mono)",
    fontSize: 9,
    letterSpacing: ".22em",
    textTransform: "uppercase",
    color: "rgba(244,247,250,.62)",
  };

  return (
    <div
      ref={cutsRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        overflowY: "auto",
        overflowX: "hidden",
        background: "#0f151d",
        color: "#F4F7FA",
        opacity: state.cVis ? 1 : 0,
        pointerEvents: state.cVis ? "auto" : "none",
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
          filter: "blur(44px) brightness(.4) saturate(.8)",
          transform: "scale(1.2)",
          pointerEvents: "none",
        }}
      />
      {gal.map((g, i) => (
        <div
          key={"glow" + i}
          data-loop
          style={{
            position: "fixed",
            left: "-25vw",
            top: "-35vh",
            width: "110vw",
            height: "110vh",
            borderRadius: "50%",
            background: `radial-gradient(closest-side,${g.glow},transparent)`,
            opacity: g.glowO,
            transition: "opacity 2.2s ease",
            pointerEvents: "none",
            animation: "drift 26s ease-in-out infinite",
          }}
        />
      ))}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(120% 90% at 50% 40%,transparent 35%,rgba(6,9,14,.6))",
          pointerEvents: "none",
        }}
      />

      {/* header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 4,
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)",
          alignItems: "center",
          gap: 8,
          gridAutoRows: "44px",
          padding:
            "calc(14px + env(safe-area-inset-top)) clamp(20px,4vw,48px) 12px",
        }}
      >
        <span
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            fontFamily: "var(--font-geist-mono)",
            fontSize: 9,
            letterSpacing: ".26em",
            textTransform: "uppercase",
          }}
        >
          Cuts
        </span>
        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "repeat(3,minmax(0,1fr))",
            padding: 4,
            borderRadius: 999,
            background: "rgba(255,255,255,.07)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,.1)",
            backdropFilter: "blur(20px) saturate(160%)",
            WebkitBackdropFilter: "blur(20px) saturate(160%)",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 4,
              bottom: 4,
              left: 4,
              width: "calc((100% - 8px) / 3)",
              borderRadius: 999,
              background: "#F4F7FA",
              transform: `translateX(${ik * 100}%)`,
              transition: "transform .9s cubic-bezier(.22,1,.36,1)",
            }}
          />
          {MODES.map(([k, l]) => (
            <button
              key={k}
              onClick={() => setMode(k as "compare" | "detail" | "index")}
              style={{
                position: "relative",
                height: 34,
                padding: "0 10px",
                border: 0,
                background: "transparent",
                fontSize: 11,
                whiteSpace: "nowrap",
                color: state.cMode === k ? "#0E141C" : "rgba(244,247,250,.75)",
                transition: "color .7s",
              }}
            >
              {l}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={ov.closeCuts}
            aria-label="Schliessen"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: 0,
              background: "rgba(255,255,255,.08)",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,.14)",
              color: "#F4F7FA",
              fontSize: 12,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {state.cMode !== "index" ? (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 1380,
            margin: "0 auto",
            padding:
              "6px clamp(16px,4vw,48px) calc(36px + env(safe-area-inset-bottom))",
            display: "flex",
            flexWrap: "wrap",
            gap: "clamp(24px,3.4vw,56px)",
            animation: "fade 1s ease both",
          }}
        >
          <div
            style={{
              flex: "1 1 540px",
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div
              ref={stageRef}
              onPointerDown={(e) => {
                if (state.cMode !== "compare") return;
                cancelAnimationFrame(rafId.current);
                if (swT.current) clearTimeout(swT.current);
                drag.current = true;
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {}
                stageAt(e.clientX);
                set({ cDrag: true, dragged: true });
              }}
              onPointerMove={(e) => {
                if (drag.current) stageAt(e.clientX);
              }}
              onPointerUp={() => {
                if (!drag.current) return;
                drag.current = false;
                set({ cDrag: false });
              }}
              onPointerCancel={() => {
                if (!drag.current) return;
                drag.current = false;
                set({ cDrag: false });
              }}
              style={{
                position: "relative",
                height: "clamp(380px,calc(100dvh - 200px),880px)",
                borderRadius: 30,
                overflow: "hidden",
                background: "#0b1017",
                boxShadow: "0 60px 120px -50px rgba(0,0,0,.75)",
                cursor:
                  state.cMode === "compare"
                    ? state.cDrag
                      ? "grabbing"
                      : "ew-resize"
                    : "default",
                touchAction: "pan-y",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              {gal.map((g, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    inset: 0,
                    clipPath: g.clip,
                    transition: "clip-path 1.5s cubic-bezier(.65,0,.2,1)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      transform: g.sc,
                      transition: "transform 2.2s cubic-bezier(.22,1,.36,1)",
                    }}
                  >
                    {state.cMode === "compare" ? (
                      <>
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: g.bgB,
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              left: 22,
                              bottom: 20,
                              fontFamily: "var(--font-geist-mono)",
                              fontSize: 9,
                              letterSpacing: ".22em",
                              textTransform: "uppercase",
                              color: "rgba(255,255,255,.6)",
                            }}
                          >
                            Vorher · Bild {g.no}A
                          </span>
                        </div>
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background: g.bgA,
                            clipPath: "inset(0 0 0 var(--cmp,50%))",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              right: 22,
                              bottom: 20,
                              fontFamily: "var(--font-geist-mono)",
                              fontSize: 9,
                              letterSpacing: ".22em",
                              textTransform: "uppercase",
                              color: "rgba(255,255,255,.6)",
                            }}
                          >
                            Nachher · Bild {g.no}B
                          </span>
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          gap: 3,
                        }}
                      >
                        {g.shots.map((s, j) => (
                          <div
                            key={j}
                            onMouseEnter={s.hov}
                            onClick={s.hov}
                            style={{
                              position: "relative",
                              flex: s.flex,
                              minWidth: 0,
                              overflow: "hidden",
                              background: s.bg,
                              transition: "flex 1.2s cubic-bezier(.65,0,.2,1)",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: 20,
                                top: 20,
                                fontFamily: "var(--font-geist-mono)",
                                fontSize: 9,
                                letterSpacing: ".24em",
                                textTransform: "uppercase",
                                color: "#fff",
                                writingMode: "vertical-rl",
                                opacity: s.lo,
                                transition: "opacity .8s",
                              }}
                            >
                              {s.l}
                            </span>
                            <span
                              style={{
                                position: "absolute",
                                left: 20,
                                bottom: 20,
                                whiteSpace: "nowrap",
                                fontFamily: "var(--font-geist-mono)",
                                fontSize: 9,
                                letterSpacing: ".2em",
                                textTransform: "uppercase",
                                color: "rgba(255,255,255,.6)",
                                opacity: s.lo,
                                transition: "opacity .8s",
                              }}
                            >
                              Bild {s.code}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {state.cMode === "compare" && (
                <>
                  <div
                    style={{
                      position: "absolute",
                      zIndex: 2,
                      top: 0,
                      bottom: 0,
                      left: "var(--cmp,50%)",
                      width: 0,
                      pointerEvents: "none",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: -0.5,
                        width: 1,
                        background: "rgba(255,255,255,.92)",
                        boxShadow: "0 0 24px rgba(255,255,255,.55)",
                      }}
                    />
                    <span
                      data-loop
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: 0,
                        width: 58,
                        height: 58,
                        margin: "-29px 0 0 -29px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        fontSize: 13,
                        color: "#fff",
                        background: "rgba(255,255,255,.12)",
                        backdropFilter: "blur(14px) saturate(170%)",
                        WebkitBackdropFilter: "blur(14px) saturate(170%)",
                        transform: state.cDrag ? "scale(1.14)" : "scale(1)",
                        transition: "transform .6s cubic-bezier(.22,1,.36,1)",
                        animation: "knob 2.6s ease-out infinite",
                      }}
                    >
                      <span>‹</span>
                      <span>›</span>
                    </span>
                    <span
                      style={{
                        position: "absolute",
                        top: "calc(50% + 44px)",
                        left: 0,
                        transform: "translateX(-50%)",
                        whiteSpace: "nowrap",
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: 8.5,
                        letterSpacing: ".24em",
                        textTransform: "uppercase",
                        color: "#fff",
                        opacity: state.dragged ? 0 : 1,
                        transition: "opacity 1.2s ease",
                      }}
                    >
                      Ziehen
                    </span>
                  </div>
                  <span
                    style={{
                      position: "absolute",
                      zIndex: 2,
                      left: 18,
                      top: 18,
                      padding: "8px 13px",
                      borderRadius: 999,
                      background: "rgba(10,14,20,.32)",
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,.14)",
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 9,
                      letterSpacing: ".22em",
                      textTransform: "uppercase",
                      pointerEvents: "none",
                    }}
                  >
                    Vorher
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      zIndex: 2,
                      right: 18,
                      top: 18,
                      padding: "8px 13px",
                      borderRadius: 999,
                      background: "rgba(244,247,250,.9)",
                      color: "#0E141C",
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 9,
                      letterSpacing: ".22em",
                      textTransform: "uppercase",
                      pointerEvents: "none",
                    }}
                  >
                    Nachher
                  </span>
                </>
              )}
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 3,
                  borderRadius: 30,
                  boxShadow:
                    "inset 0 0 0 1px rgba(255,255,255,.1),inset 1.5px 1.5px 0 -.5px rgba(255,255,255,.22)",
                  pointerEvents: "none",
                }}
              />
            </div>
            {/* thumbnails */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                overflowX: "auto",
                padding: "4px 2px 6px",
              }}
            >
              {gal.map((g, i) => (
                <button
                  key={i}
                  onClick={g.pick}
                  style={{
                    flex: "none",
                    position: "relative",
                    width: g.tw,
                    height: 54,
                    borderRadius: 16,
                    border: 0,
                    padding: 0,
                    overflow: "hidden",
                    background: `linear-gradient(110deg,${g.before} 0 50%,${g.after} 50% 100%)`,
                    opacity: g.to,
                    boxShadow: g.tsh,
                    transition:
                      "width 1s cubic-bezier(.22,1,.36,1),opacity .6s ease,transform .6s cubic-bezier(.22,1,.36,1),box-shadow .6s",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: 9,
                      bottom: 7,
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 8.5,
                      letterSpacing: ".14em",
                      color: "#fff",
                    }}
                  >
                    {g.no}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* detail panel */}
          <div
            style={{
              flex: "1 1 300px",
              maxWidth: 440,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 30,
              padding: "4px 0 10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-end", gap: 14 }}>
              <div
                style={{
                  display: "flex",
                  fontFamily: "var(--font-geist-mono)",
                  fontWeight: 300,
                  fontSize: "clamp(64px,7vw,108px)",
                  lineHeight: 1,
                }}
              >
                {cutCols.map((c, j) => (
                  <div
                    key={j}
                    style={{
                      width: ".62em",
                      height: "1.1em",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        transform: `translateY(${c.ty})`,
                        transition: `transform 1.6s cubic-bezier(.65,0,.2,1) ${c.d}`,
                      }}
                    >
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((nn) => (
                        <span
                          key={nn}
                          style={{
                            height: "1.1em",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {nn}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <span
                style={{
                  paddingBottom: "1.2em",
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: 9,
                  letterSpacing: ".22em",
                  color: "rgba(244,247,250,.55)",
                }}
              >
                / {String(n).padStart(2, "0")}
              </span>
            </div>
            <div style={{ display: "grid" }}>
              {gal.map((g, i) => (
                <div
                  key={i}
                  style={{
                    gridArea: "1/1",
                    display: "flex",
                    flexDirection: "column",
                    gap: 24,
                    opacity: g.io,
                    transform: g.itf,
                    filter: g.ifl,
                    pointerEvents: g.ipe,
                    transition: `opacity .9s ease ${g.id},transform 1.3s cubic-bezier(.22,1,.36,1) ${g.id},filter 1s ease ${g.id}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <span style={mono9}>{g.sub}</span>
                    <span
                      style={{
                        fontSize: "clamp(38px,4.2vw,56px)",
                        fontWeight: 200,
                        letterSpacing: "-.04em",
                        lineHeight: 0.95,
                      }}
                    >
                      {g.name}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        flex: "none",
                        width: 22,
                        height: 1,
                        marginTop: 11,
                        background: "#F4A69E",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 300,
                        lineHeight: 1.55,
                        color: "rgba(244,247,250,.88)",
                        textWrap: "pretty",
                      }}
                    >
                      „{g.note}“
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {g.specRows.map((r, j) => (
                      <div
                        key={j}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          gap: 16,
                          padding: "13px 0",
                          borderTop: "1px solid rgba(255,255,255,.09)",
                          opacity: r.o,
                          transform: r.tf,
                          transition: `opacity .8s ease ${r.d},transform 1s cubic-bezier(.22,1,.36,1) ${r.d}`,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-geist-mono)",
                            fontSize: 9,
                            letterSpacing: ".2em",
                            textTransform: "uppercase",
                            color: "rgba(244,247,250,.55)",
                          }}
                        >
                          {r.k}
                        </span>
                        <span style={{ fontSize: 13.5, textAlign: "right" }}>
                          {r.v}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginTop: "auto",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(244,247,250,.2)",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: 1,
                    width: galPct,
                    background: "#F4F7FA",
                    transition: "width 1.5s cubic-bezier(.65,0,.2,1)",
                  }}
                />
              </div>
              <button
                onClick={() => pickCut(ci - 1)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,.22)",
                  background: "transparent",
                  color: "#F4F7FA",
                  fontSize: 13,
                  opacity: ci > 0 ? 1 : 0.3,
                }}
              >
                ←
              </button>
              <button
                onClick={() => pickCut(ci + 1)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  border: 0,
                  background: "#F4F7FA",
                  color: "#0E141C",
                  fontSize: 13,
                  opacity: ci < n - 1 ? 1 : 0.3,
                }}
              >
                →
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 1380,
            margin: "0 auto",
            padding:
              "10px clamp(16px,4vw,48px) calc(48px + env(safe-area-inset-bottom))",
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 16,
              flexWrap: "wrap",
              animation: "up 1.2s cubic-bezier(.22,1,.36,1) both",
            }}
          >
            <span
              style={{
                fontSize: "clamp(48px,8vw,112px)",
                fontWeight: 200,
                letterSpacing: "-.05em",
                lineHeight: 0.88,
              }}
            >
              Archiv<span style={{ color: "#F4A69E" }}>.</span>
            </span>
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 9,
                letterSpacing: ".22em",
                textTransform: "uppercase",
                color: "rgba(244,247,250,.6)",
                paddingBottom: 8,
              }}
            >
              Hover zeigt Nachher · Tippen öffnet
            </span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill,minmax(min(240px,calc(50% - 6px)),1fr))",
              gap: 12,
            }}
          >
            {gal.map((g, i) => (
              <div
                key={i}
                style={{
                  animation: `tileIn 1.3s cubic-bezier(.22,1,.36,1) ${g.delay} both`,
                }}
              >
                <button
                  onClick={g.open}
                  onMouseEnter={g.hin}
                  onMouseLeave={() => set({ iHov: -1 })}
                  style={{
                    position: "relative",
                    display: "block",
                    width: "100%",
                    aspectRatio: "4/5",
                    border: 0,
                    padding: 0,
                    borderRadius: 26,
                    overflow: "hidden",
                    background: g.bgB,
                    color: "#F4F7FA",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: g.bgA,
                      clipPath: g.hclip,
                      transition: "clip-path 1.1s cubic-bezier(.65,0,.2,1)",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(180deg,transparent 45%,rgba(6,9,14,.55))",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      left: 16,
                      right: 16,
                      top: 16,
                      display: "flex",
                      justifyContent: "space-between",
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 9,
                      letterSpacing: ".2em",
                      textTransform: "uppercase",
                    }}
                  >
                    <span>{g.no}</span>
                    <span style={{ opacity: 0.8 }}>{g.hlabel}</span>
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      left: 16,
                      right: 16,
                      bottom: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 5,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 300,
                        letterSpacing: "-.02em",
                      }}
                    >
                      {g.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: 8.5,
                        letterSpacing: ".18em",
                        textTransform: "uppercase",
                        opacity: 0.75,
                      }}
                    >
                      {g.sub}
                    </span>
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 26,
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,.1)",
                      pointerEvents: "none",
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
