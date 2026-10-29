"use client";

import { useEffect, useRef } from "react";
import { useSalon } from "../store";
import { useOverlayActions } from "./overlay-actions";
import { bgImg, usePortrait } from "../use-portrait";
import { milestones } from "@/lib/data";

export function StoryOverlay() {
  const { state, set } = useSalon();
  const ov = useOverlayActions();
  const portrait = usePortrait();
  const lock = useRef(0);
  const touch = useRef({ x: 0, y: 0 });

  const step = (d: number) => {
    const t = Date.now();
    if (lock.current && t - lock.current < 1500) return;
    lock.current = t;
    ov.storyGo(state.sIdx + d, milestones.length);
  };

  useEffect(() => {
    if (!state.story) return;
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "ArrowRight", " ", "PageDown"].includes(e.key)) {
        e.preventDefault();
        step(1);
      } else if (["ArrowUp", "ArrowLeft", "PageUp"].includes(e.key)) {
        e.preventDefault();
        step(-1);
      } else if (e.key === "Escape") ov.closeStory();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.story, state.sIdx]);

  if (!state.story) return null;
  const img = bgImg(portrait);
  const BI = img;

  // window geometry
  const W = typeof window !== "undefined" ? window.innerWidth : 390;
  const H = typeof window !== "undefined" ? window.innerHeight : 800;
  const sc = Math.max(W / BI.w, H / BI.h);
  const dw = BI.w * sc,
    dh = BI.h * sc;
  const ox = (W - dw) * BI.px,
    oy = (H - dh) * BI.py;
  const i = state.sIdx;
  const m = milestones[i];
  const last = i === milestones.length - 1;
  let x: number, y: number, w: number, h: number;
  if (last) {
    x = 0;
    y = 0;
    w = W;
    h = H;
  } else {
    const fr = portrait ? m.frm : m.fr;
    x = ox + fr[0] * dw;
    y = oy + fr[1] * dh;
    w = fr[2] * dw;
    h = fr[3] * dh;
    const minW = Math.min(150, W * 0.42),
      minH = portrait ? 140 : 180;
    if (w < minW) {
      x -= (minW - w) / 2;
      w = minW;
    }
    if (h < minH) {
      y -= (minH - h) / 2;
      h = minH;
    }
    w = Math.min(w, W - 32);
    h = Math.min(h, portrait ? H * 0.4 : H * 0.56);
    x = Math.max(16, Math.min(W - 16 - w, x));
    y = Math.max(72, Math.min((portrait ? H * 0.5 : H * 0.62) - h, y));
  }
  if (!state.sReady) {
    x = x + w / 2;
    y = y + h / 2;
    w = 0;
    h = 0;
  }
  const PC = (v: number, b: number) => ((v / b) * 100).toFixed(3) + "%";
  const R = last ? 0 : 28;
  const clip = `inset(${PC(y, H)} ${PC(W - x - w, W)} ${PC(H - y - h, H)} ${PC(x, W)} round ${R}px)`;
  const cap = "Fig. " + String(i + 1).padStart(2, "0") + " — " + m.tag;
  const dim = Math.round(w) + " × " + Math.round(h);
  const capO = state.sReady && !last ? 1 : 0;

  const yearIsNum = typeof m.year === "number";
  const yearCols = yearIsNum
    ? String(m.year)
        .split("")
        .map((d, k) => ({
          ty: -Number(d) * 1.1 + "em",
          d: (k * 0.08).toFixed(2) + "s",
        }))
    : [];
  const storyNo =
    String(i + 1).padStart(2, "0") +
    " / " +
    String(milestones.length).padStart(2, "0");
  const storyPct = ((i + 1) / milestones.length) * 100 + "%";

  return (
    <div
      onWheel={(e) => {
        if (Math.abs(e.deltaY) > 18) step(e.deltaY > 0 ? 1 : -1);
      }}
      onTouchStart={(e) => {
        touch.current = { y: e.touches[0].clientY, x: e.touches[0].clientX };
      }}
      onTouchEnd={(e) => {
        const t = e.changedTouches[0];
        const dy = touch.current.y - t.clientY,
          dx = touch.current.x - t.clientX;
        const d = Math.abs(dy) > Math.abs(dx) ? dy : dx;
        if (Math.abs(d) > 40) step(d > 0 ? 1 : -1);
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        overflow: "hidden",
        background: "#1b222c",
        color: "#F4F7FA",
        touchAction: "none",
        opacity: state.sVis ? 1 : 0,
        pointerEvents: state.sVis ? "auto" : "none",
        transition: "opacity 1.2s cubic-bezier(.4,0,.2,1)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${img.url})`,
          backgroundSize: "cover",
          backgroundPosition: img.pos,
          filter: "blur(26px) brightness(.78) saturate(.9)",
          transform: "scale(1.08)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 90% at 50% 45%,transparent 40%,rgba(8,12,20,.45))",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${img.url})`,
          backgroundSize: "cover",
          backgroundPosition: img.pos,
          clipPath: clip,
          transition: "clip-path 1.9s cubic-bezier(.65,0,.2,1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: PC(y, H),
          left: PC(x, W),
          width: PC(w, W),
          height: PC(h, H),
          borderRadius: R,
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,.22),inset 1.5px 1.5px 0 -.5px rgba(255,255,255,.5),inset 0 0 40px rgba(255,255,255,.08),0 40px 90px -30px rgba(0,0,0,.6)",
          transition:
            "top 1.9s cubic-bezier(.65,0,.2,1),left 1.9s cubic-bezier(.65,0,.2,1),width 1.9s cubic-bezier(.65,0,.2,1),height 1.9s cubic-bezier(.65,0,.2,1),border-radius 1.9s cubic-bezier(.65,0,.2,1)",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 0,
            top: -26,
            whiteSpace: "nowrap",
            fontFamily: "var(--font-geist-mono)",
            fontSize: 9,
            letterSpacing: ".22em",
            textTransform: "uppercase",
            color: "rgba(244,247,250,.85)",
            opacity: capO,
            transition: "opacity .8s ease",
          }}
        >
          {cap}
        </span>
        <span
          style={{
            position: "absolute",
            right: 0,
            bottom: -24,
            whiteSpace: "nowrap",
            fontFamily: "var(--font-geist-mono)",
            fontSize: 9,
            letterSpacing: ".18em",
            color: "rgba(244,247,250,.6)",
            opacity: capO,
            transition: "opacity .8s ease",
          }}
        >
          {dim}
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: "46vh",
          background: "linear-gradient(180deg,transparent,rgba(8,12,20,.62))",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "22vh",
          background: "linear-gradient(180deg,rgba(8,12,20,.45),transparent)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "calc(14px + env(safe-area-inset-top))",
          height: 44,
          left: "clamp(20px,4vw,48px)",
          right: "clamp(20px,4vw,48px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "var(--font-geist-mono)",
          fontSize: 9,
          letterSpacing: ".26em",
          textTransform: "uppercase",
          color: "#F4F7FA",
        }}
      >
        <span>salon 15 — Story</span>
        <button
          onClick={() => ov.closeStory()}
          style={{
            border: 0,
            background: "transparent",
            color: "inherit",
            font: "inherit",
            letterSpacing: "inherit",
            textTransform: "inherit",
            padding: "12px 0",
          }}
        >
          Schliessen ✕
        </button>
      </div>

      <div
        style={{
          position: "absolute",
          left: "clamp(18px,5vw,64px)",
          bottom: "calc(clamp(22px,5vh,48px) + env(safe-area-inset-bottom))",
          width: "min(400px,calc(100vw - 36px))",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
          <div
            style={{
              display: "flex",
              fontFamily: "var(--font-geist-mono)",
              fontWeight: 300,
              fontSize: "clamp(40px,5vw,56px)",
              lineHeight: 1,
              color: "#F4F7FA",
            }}
          >
            {!yearIsNum && (
              <span
                style={{
                  animation: "wordIn 1.2s cubic-bezier(.22,1,.36,1) both",
                }}
              >
                {m.year}
              </span>
            )}
            {yearCols.map((c, k) => (
              <div
                key={k}
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
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                    <span
                      key={n}
                      style={{
                        height: "1.1em",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <span
            style={{
              paddingBottom: ".9em",
              fontFamily: "var(--font-geist-mono)",
              fontSize: 9,
              letterSpacing: ".22em",
              textTransform: "uppercase",
              color: "rgba(244,247,250,.7)",
            }}
          >
            {storyNo}
          </span>
        </div>

        <div style={{ display: "grid" }}>
          {milestones.map((it, idx) => {
            const k = idx === i ? 0 : idx < i ? -1 : 1;
            return (
              <div
                key={idx}
                style={{
                  gridArea: "1/1",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  opacity: k === 0 ? 1 : 0,
                  transform:
                    k === 0
                      ? "none"
                      : k < 0
                        ? "translateY(-10px)"
                        : "translateY(12px)",
                  transition: `opacity 1s ease ${k === 0 ? ".7s" : "0s"},transform 1.4s cubic-bezier(.22,1,.36,1) ${k === 0 ? ".7s" : "0s"}`,
                  pointerEvents: k === 0 ? "auto" : "none",
                }}
              >
                <span
                  style={{
                    fontSize: "clamp(22px,2.6vw,28px)",
                    fontWeight: 300,
                    letterSpacing: "-.02em",
                    lineHeight: 1.15,
                    textWrap: "balance",
                  }}
                >
                  {it.title}
                </span>
                <span
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.65,
                    color: "rgba(244,247,250,.78)",
                    textWrap: "pretty",
                  }}
                >
                  {it.text}
                </span>
                {idx === milestones.length - 1 && (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() =>
                        ov.closeStory(() => set({ mode: "invite" }))
                      }
                      style={{
                        height: 44,
                        border: 0,
                        borderRadius: 999,
                        background: "#F4F7FA",
                        color: "#0E141C",
                        padding: "0 20px",
                        fontSize: 12.5,
                        fontWeight: 600,
                      }}
                    >
                      Code einlösen
                    </button>
                    <button
                      onClick={() => ov.storyGo(0, milestones.length)}
                      style={{
                        height: 44,
                        border: "1px solid rgba(255,255,255,.24)",
                        background: "transparent",
                        color: "#F4F7FA",
                        borderRadius: 999,
                        padding: "0 18px",
                        fontSize: 12.5,
                      }}
                    >
                      Von vorn
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            paddingTop: 6,
          }}
        >
          <div
            style={{
              flex: 1,
              maxWidth: 220,
              height: 1,
              background: "rgba(244,247,250,.22)",
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                height: 1,
                width: storyPct,
                background: "#F4F7FA",
                transition: "width 1.6s cubic-bezier(.65,0,.2,1)",
              }}
            />
          </div>
          <button
            onClick={() => step(-1)}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,.22)",
              background: "transparent",
              color: "#F4F7FA",
              fontSize: 13,
              opacity: i === 0 ? 0.3 : 1,
              pointerEvents: i === 0 ? "none" : "auto",
              transition: "opacity .6s",
            }}
          >
            ↑
          </button>
          <button
            onClick={() => step(1)}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: 0,
              background: "#F4F7FA",
              color: "#0E141C",
              fontSize: 13,
              opacity: last ? 0.3 : 1,
              pointerEvents: last ? "none" : "auto",
              transition: "opacity .6s",
            }}
          >
            ↓
          </button>
        </div>
      </div>
    </div>
  );
}
