"use client";

import { useRef } from "react";
import { useSalon } from "../store";
import { useOverlayActions } from "./overlay-actions";
import { bgImg, usePortrait } from "../use-portrait";
import { legalDocs, impRows, agbFacts, dsKeep, dsNever } from "@/lib/data";

const KEYS = ["impressum", "agb", "datenschutz"];
const mono9: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono)",
  fontSize: 9,
  letterSpacing: ".22em",
  textTransform: "uppercase",
  color: "var(--ink-62)",
};

export function LegalMenu() {
  const { state, set } = useSalon();
  const ov = useOverlayActions();
  if (!state.lmOn) return null;
  const items = KEYS.map((k, i) => {
    const d = legalDocs[k];
    const on = state.lmHov === i;
    return {
      n: "§ " + d.n,
      t: d.title,
      sub: d.sub,
      open: () => ov.openDoc(k),
      hin: () => set({ lmHov: i }),
      bg: on ? "rgba(255,255,255,.08)" : "transparent",
      abg: on ? "#F4F7FA" : "rgba(255,255,255,.08)",
      afg: on ? "#0E141C" : "#F4F7FA",
      atf: on ? "rotate(-45deg)" : "none",
      o: state.lmVis ? 1 : 0,
      tf: state.lmVis ? "none" : "translateY(12px)",
      d: state.lmVis ? `${0.12 + i * 0.07}s` : "0s",
    };
  });
  return (
    <div
      onClick={ov.closeLm}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0 16px calc(62px + env(safe-area-inset-bottom))",
        background: "rgba(14,20,28,.2)",
        backdropFilter: "blur(12px) saturate(120%)",
        WebkitBackdropFilter: "blur(12px) saturate(120%)",
        opacity: state.lmVis ? 1 : 0,
        transition: "opacity .8s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(400px,100%)",
          borderRadius: 32,
          padding: 8,
          background:
            "linear-gradient(115deg,rgba(9,13,22,.86),rgba(22,30,44,.72) 52%,rgba(30,40,58,.6))",
          backdropFilter: "blur(22px) saturate(160%)",
          WebkitBackdropFilter: "blur(22px) saturate(160%)",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,.09),inset 0 1px 0 rgba(255,255,255,.12),0 40px 80px -30px rgba(10,20,40,.6)",
          color: "#F4F7FA",
          transformOrigin: "50% 100%",
          transform: state.lmVis ? "none" : "translateY(24px) scale(.94)",
          transition: "transform 1s cubic-bezier(.22,1,.36,1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 16px 10px",
            fontFamily: "var(--font-geist-mono)",
            fontSize: 9,
            letterSpacing: ".22em",
            textTransform: "uppercase",
            color: "rgba(244,247,250,.6)",
          }}
        >
          <span>Rechtliches</span>
          <span>Stand 10 · 2026</span>
        </div>
        {items.map((it, i) => (
          <button
            key={i}
            onClick={it.open}
            onMouseEnter={it.hin}
            onMouseLeave={() => set({ lmHov: -1 })}
            style={{
              display: "grid",
              gridTemplateColumns: "44px minmax(0,1fr) 38px",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "14px 10px 14px 16px",
              border: 0,
              borderRadius: 24,
              background: it.bg,
              color: "#F4F7FA",
              textAlign: "left",
              opacity: it.o,
              transform: it.tf,
              transition: `background .5s ease,opacity .8s ease ${it.d},transform 1s cubic-bezier(.22,1,.36,1) ${it.d}`,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 9,
                letterSpacing: ".16em",
                color: "rgba(244,247,250,.5)",
              }}
            >
              {it.n}
            </span>
            <span
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 300,
                  letterSpacing: "-.01em",
                }}
              >
                {it.t}
              </span>
              <span style={{ fontSize: 11.5, color: "rgba(244,247,250,.6)" }}>
                {it.sub}
              </span>
            </span>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontSize: 13,
                background: it.abg,
                color: it.afg,
                transform: it.atf,
                transition: "all .7s cubic-bezier(.22,1,.36,1)",
              }}
            >
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function LegalReader() {
  const { state, set } = useSalon();
  const ov = useOverlayActions();
  const portrait = usePortrait();
  const img = bgImg(portrait);
  const readerRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLSpanElement>(null);

  if (!state.lOn) return null;
  const doc = legalDocs[state.lDoc];
  const di = KEYS.indexOf(state.lDoc);
  const nk = KEYS[(di + 1) % 3];
  const words = doc.secs.reduce((acc, s) => acc + s.full.split(" ").length, 0);
  const readMin = Math.max(1, Math.round(words / 200));

  const switchDoc = (k: string) => {
    if (k === state.lDoc || state.lSwap) return;
    set({ lSwap: true });
    setTimeout(() => {
      if (readerRef.current) readerRef.current.scrollTop = 0;
      if (progRef.current) progRef.current.style.transform = "scaleX(0)";
      set({ lDoc: k, lSec: 0, lSwap: false });
    }, 460);
  };
  const setPlain = (v: boolean) => {
    if (v === state.plain) return;
    set({ tSwap: true });
    setTimeout(() => set({ plain: v, tSwap: false }), 300);
  };
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const max = el.scrollHeight - el.clientHeight;
    if (progRef.current)
      progRef.current.style.transform = `scaleX(${max > 0 ? el.scrollTop / max : 0})`;
    const top = el.getBoundingClientRect().top;
    let a = 0;
    el.querySelectorAll("[data-sec]").forEach((s, i) => {
      if (s.getBoundingClientRect().top - top < el.clientHeight * 0.4) a = i;
    });
    if (a !== state.lSec) set({ lSec: a });
  };
  const jumpSec = (i: number) => {
    const el = readerRef.current;
    const s = el?.querySelectorAll("[data-sec]")[i];
    if (!el || !s) return;
    el.scrollTo({
      top:
        el.scrollTop +
        s.getBoundingClientRect().top -
        el.getBoundingClientRect().top -
        100,
      behavior: "smooth",
    });
  };
  const copyMail = () => {
    try {
      navigator.clipboard?.writeText("hallo@salon15.ch");
    } catch {}
    set({ mailCopied: true });
    setTimeout(() => set({ mailCopied: false }), 2000);
  };

  const docX = `translateX(${di * 100}%)`;
  const wide = typeof window !== "undefined" && window.innerWidth >= 960;

  return (
    <div
      ref={readerRef}
      onScroll={onScroll}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 45,
        overflowY: "auto",
        overflowX: "hidden",
        background: "#E4EAF0",
        color: "#0E141C",
        opacity: state.lVis ? 1 : 0,
        pointerEvents: state.lVis ? "auto" : "none",
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
          filter: "blur(70px) saturate(.85)",
          opacity: 0.6,
          transform: "scale(1.25)",
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
          background: "rgba(228,234,240,.55)",
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
        }}
      >
        <span
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            fontFamily: "var(--font-geist-mono)",
            fontSize: 9,
            letterSpacing: ".26em",
            textTransform: "uppercase",
          }}
        >
          15
        </span>
        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "repeat(3,minmax(0,1fr))",
            padding: 4,
            borderRadius: 999,
            background: "rgba(255,255,255,.5)",
            boxShadow:
              "inset 0 0 0 .5px rgba(255,255,255,.7),0 18px 40px -30px rgba(20,32,52,.5)",
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
              background: "#0E141C",
              transform: docX,
              transition: "transform .9s cubic-bezier(.22,1,.36,1)",
            }}
          />
          {KEYS.map((k) => (
            <button
              key={k}
              onClick={() => switchDoc(k)}
              style={{
                position: "relative",
                height: 34,
                padding: "0 8px",
                border: 0,
                background: "transparent",
                fontSize: 11,
                whiteSpace: "nowrap",
                color: k === state.lDoc ? "#F4F7FA" : "rgba(14,20,28,.7)",
                transition: "color .7s",
              }}
            >
              {legalDocs[k].title}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={ov.closeReader}
            aria-label="Schliessen"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: 0,
              background: "rgba(14,20,28,.07)",
              color: "#0E141C",
              fontSize: 12,
            }}
          >
            ✕
          </button>
        </div>
        <span
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 1,
            background: "rgba(14,20,28,.08)",
          }}
        />
        <span
          ref={progRef}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 1,
            background: "#0E141C",
            transformOrigin: "0 50%",
            transform: "scaleX(0)",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1180,
          margin: "0 auto",
          padding:
            "clamp(40px,8vh,96px) clamp(18px,4vw,48px) calc(60px + env(safe-area-inset-bottom))",
          opacity: state.lSwap ? 0 : 1,
          filter: state.lSwap ? "blur(10px)" : "blur(0px)",
          transform: state.lSwap ? "translateY(16px)" : "none",
          transition:
            "opacity .45s ease,filter .45s ease,transform .7s cubic-bezier(.22,1,.36,1)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            paddingBottom: "clamp(40px,7vh,72px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              fontFamily: "var(--font-geist-mono)",
              fontSize: 9,
              letterSpacing: ".24em",
              textTransform: "uppercase",
              color: "var(--ink-62)",
            }}
          >
            <span>§ {doc.n} — Rechtliches</span>
            <span>Stand 17.10.2026 · {readMin} min Lesezeit</span>
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(60px,12.5vw,176px)",
              fontWeight: 200,
              letterSpacing: "-.06em",
              lineHeight: 0.86,
              overflowWrap: "anywhere",
            }}
          >
            {doc.title}
            <span style={{ color: "#E5776C" }}>.</span>
          </h1>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                maxWidth: 520,
                fontSize: "clamp(18px,2vw,23px)",
                fontWeight: 300,
                lineHeight: 1.4,
                textWrap: "pretty",
              }}
            >
              {doc.lead}
            </span>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 8,
              }}
            >
              <div
                style={{
                  position: "relative",
                  display: "grid",
                  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                  padding: 4,
                  borderRadius: 999,
                  background: "rgba(255,255,255,.5)",
                  boxShadow:
                    "inset 0 0 0 .5px rgba(255,255,255,.7),0 18px 40px -30px rgba(20,32,52,.5)",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 4,
                    bottom: 4,
                    left: 4,
                    width: "calc((100% - 8px) / 2)",
                    borderRadius: 999,
                    background: "#0E141C",
                    transform: state.plain
                      ? "translateX(0%)"
                      : "translateX(100%)",
                    transition: "transform .9s cubic-bezier(.22,1,.36,1)",
                  }}
                />
                <button
                  onClick={() => setPlain(true)}
                  style={{
                    position: "relative",
                    height: 38,
                    padding: "0 18px",
                    border: 0,
                    background: "transparent",
                    fontSize: 12.5,
                    color: state.plain ? "#F4F7FA" : "rgba(14,20,28,.7)",
                    transition: "color .7s",
                  }}
                >
                  Klartext
                </button>
                <button
                  onClick={() => setPlain(false)}
                  style={{
                    position: "relative",
                    height: 38,
                    padding: "0 18px",
                    border: 0,
                    background: "transparent",
                    fontSize: 12.5,
                    color: state.plain ? "rgba(14,20,28,.7)" : "#F4F7FA",
                    transition: "color .7s",
                  }}
                >
                  Volltext
                </button>
              </div>
              <span
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  fontSize: 8.5,
                  letterSpacing: ".2em",
                  textTransform: "uppercase",
                  color: "rgba(14,20,28,.5)",
                }}
              >
                {state.plain
                  ? "Dasselbe, in einem Satz"
                  : "Der rechtliche Wortlaut"}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "clamp(32px,5vw,72px)",
            alignItems: "flex-start",
          }}
        >
          {wide && (
            <div
              style={{
                flex: "0 0 200px",
                position: "sticky",
                top: 100,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <span
                style={{
                  ...mono9,
                  paddingBottom: 12,
                  color: "rgba(14,20,28,.55)",
                }}
              >
                Inhalt
              </span>
              {doc.secs.map((s, i) => {
                const on = i === state.lSec;
                return (
                  <button
                    key={i}
                    onClick={() => jumpSec(i)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      border: 0,
                      background: "transparent",
                      padding: "8px 0",
                      textAlign: "left",
                      fontSize: 13,
                      color: on ? "#0E141C" : "rgba(14,20,28,.5)",
                      transition: "color .6s",
                    }}
                  >
                    <span
                      style={{
                        flex: "none",
                        height: 1,
                        width: on ? 26 : 10,
                        background: on ? "#E5776C" : "rgba(14,20,28,.25)",
                        transition:
                          "width .8s cubic-bezier(.22,1,.36,1),background .6s",
                      }}
                    />
                    <span>{s.t}</span>
                  </button>
                );
              })}
            </div>
          )}
          <div style={{ flex: "1 1 0", minWidth: 0 }}>
            {state.lDoc === "impressum" && (
              <div
                className="glass-dark"
                style={{
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: 32,
                  padding: "clamp(22px,3vw,34px)",
                  marginBottom: 44,
                  animation: "up 1.4s cubic-bezier(.22,1,.36,1) both",
                }}
              >
                <div
                  data-loop
                  style={{
                    position: "absolute",
                    right: -80,
                    top: -80,
                    width: 260,
                    height: 260,
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
                    paddingBottom: 18,
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 9,
                    letterSpacing: ".22em",
                    textTransform: "uppercase",
                    color: "rgba(244,247,250,.62)",
                  }}
                >
                  <span>Visitenkarte</span>
                  <span>N° 15</span>
                </div>
                {impRows.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      position: "relative",
                      display: "grid",
                      gridTemplateColumns: "minmax(0,96px) minmax(0,1fr) auto",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 0",
                      borderTop: "1px solid rgba(255,255,255,.09)",
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
                    <span
                      style={{
                        fontSize: "clamp(15px,1.6vw,18px)",
                        fontWeight: 300,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {r.v}
                    </span>
                    {(r as { copy?: boolean }).copy && (
                      <button
                        onClick={copyMail}
                        style={{
                          height: 32,
                          padding: "0 14px",
                          borderRadius: 999,
                          border: "1px solid rgba(255,255,255,.18)",
                          background: "transparent",
                          color: "#F4F7FA",
                          fontSize: 11.5,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {state.mailCopied ? "Kopiert ✓" : "Kopieren"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {state.lDoc === "agb" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(min(170px,100%),1fr))",
                  gap: 10,
                  marginBottom: 44,
                }}
              >
                {agbFacts.map((f, i) => (
                  <div
                    key={i}
                    className="glass-light"
                    style={{
                      borderRadius: 28,
                      padding: 22,
                      display: "flex",
                      flexDirection: "column",
                      gap: 30,
                      animation: `up 1.3s cubic-bezier(.22,1,.36,1) ${0.1 + i * 0.08}s both`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-geist-mono)",
                        fontSize: 9,
                        letterSpacing: ".2em",
                        textTransform: "uppercase",
                        color: "var(--ink-60)",
                      }}
                    >
                      {f[1]}
                    </span>
                    <span
                      style={{
                        fontSize: 46,
                        fontWeight: 200,
                        letterSpacing: "-.045em",
                        lineHeight: 1,
                      }}
                    >
                      {f[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {state.lDoc === "datenschutz" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(min(280px,100%),1fr))",
                  gap: 10,
                  marginBottom: 44,
                }}
              >
                <div
                  className="glass-light"
                  style={{
                    borderRadius: 30,
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                    animation: "up 1.3s cubic-bezier(.22,1,.36,1) both",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      ...mono9,
                    }}
                  >
                    <span>Was wir speichern</span>
                    <span>{String(dsKeep.length).padStart(2, "0")}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {dsKeep.map((l, i) => (
                      <span
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "9px 14px",
                          borderRadius: 999,
                          background: "rgba(255,255,255,.75)",
                          fontSize: 12.5,
                          animation: `pop .9s cubic-bezier(.22,1,.36,1) ${0.2 + i * 0.05}s both`,
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
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  className="glass-solid"
                  style={{
                    borderRadius: 30,
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                    animation: "up 1.3s cubic-bezier(.22,1,.36,1) .12s both",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 9,
                      letterSpacing: ".22em",
                      textTransform: "uppercase",
                      color: "rgba(244,247,250,.62)",
                    }}
                  >
                    Was wir nie speichern
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {dsNever.map((l, i) => (
                      <span
                        key={i}
                        style={{
                          padding: "8px 14px",
                          borderRadius: 999,
                          border: "1px dashed rgba(255,255,255,.26)",
                          fontSize: 12.5,
                          color: "rgba(244,247,250,.75)",
                          textDecoration: "line-through",
                          textDecorationColor: "#F4A69E",
                          animation: `pop .9s cubic-bezier(.22,1,.36,1) ${0.35 + i * 0.05}s both`,
                        }}
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                  <a
                    href="mailto:hallo@salon15.ch?subject=L%C3%B6schung%20meiner%20Daten"
                    style={{
                      marginTop: "auto",
                      alignSelf: "flex-start",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      color: "#F4F7FA",
                      fontSize: 12.5,
                    }}
                  >
                    Alles löschen lassen <span>→</span>
                  </a>
                </div>
              </div>
            )}

            <div
              style={{
                opacity: state.tSwap ? 0 : 1,
                filter: state.tSwap ? "blur(6px)" : "blur(0px)",
                transition: "opacity .3s ease,filter .3s ease",
              }}
            >
              {doc.secs.map((s, i) => (
                <div
                  key={i}
                  data-sec="1"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "clamp(40px,7vw,84px) minmax(0,1fr)",
                    gap: "clamp(12px,2.5vw,32px)",
                    padding: "clamp(26px,4.5vh,44px) 0",
                    borderTop: "1px solid rgba(14,20,28,.1)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontWeight: 300,
                      fontSize: "clamp(20px,2.8vw,32px)",
                      lineHeight: 1,
                      color: "rgba(14,20,28,.3)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                      minWidth: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: ".01em",
                      }}
                    >
                      {s.t}
                    </span>
                    {state.plain ? (
                      <span
                        style={{
                          maxWidth: 660,
                          fontSize: "clamp(20px,2.4vw,29px)",
                          fontWeight: 300,
                          lineHeight: 1.32,
                          letterSpacing: "-.015em",
                          textWrap: "pretty",
                        }}
                      >
                        {s.plain}
                      </span>
                    ) : (
                      <span
                        style={{
                          maxWidth: 660,
                          fontSize: 15,
                          lineHeight: 1.75,
                          color: "rgba(14,20,28,.8)",
                          textWrap: "pretty",
                        }}
                      >
                        {s.full}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "clamp(40px,8vh,80px)",
                paddingTop: 30,
                borderTop: "1px solid rgba(14,20,28,.16)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                gap: 24,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={mono9}>Fragen</span>
                <a href="mailto:hallo@salon15.ch" style={{ fontSize: 16 }}>
                  hallo@salon15.ch
                </a>
              </div>
              <button
                onClick={() => switchDoc(nk)}
                style={{
                  border: 0,
                  background: "transparent",
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 8,
                  color: "#0E141C",
                  textAlign: "right",
                }}
              >
                <span style={mono9}>Weiter · § {legalDocs[nk].n}</span>
                <span
                  style={{
                    fontSize: "clamp(38px,5.5vw,72px)",
                    fontWeight: 200,
                    letterSpacing: "-.045em",
                    lineHeight: 1,
                  }}
                >
                  {legalDocs[nk].title} →
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
