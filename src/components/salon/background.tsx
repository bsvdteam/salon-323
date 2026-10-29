"use client";

import { useSalon } from "./store";

const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

// per-screen [blur, scale, brightness]
const C: Record<string, [number, number, number]> = {
  login: [0, 1, 1],
  onboard: [10, 1.05, 1.02],
  welcome: [26, 1.12, 1.04],
  app: [60, 1.35, 1.06],
  admin: [60, 1.35, 1.03],
};

export function Background() {
  const { state } = useSalon();
  const c = C[state.screen] ?? C.login;
  const soft = state.screen === "app" || state.screen === "admin";

  return (
    <div
      className="bg-bleed"
      style={{ zIndex: 0, overflow: "hidden", pointerEvents: "none" }}
    >
      <div className="bg-frame">
        <div
          className="bg-photo"
          style={{
            position: "absolute",
            inset: 0,
            filter: `blur(${c[0]}px) brightness(${c[2]})`,
            transform: `scale(${c[1]})`,
            transition:
              "filter 3s cubic-bezier(.22,1,.36,1), transform 3.4s cubic-bezier(.22,1,.36,1)",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: soft ? 1 : 0,
          transition: "opacity 2.4s ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(236,241,246,.5)",
          }}
        />
        <div className="bg-frame">
          <div
            data-loop
            style={{
              position: "absolute",
              right: "-20vw",
              top: "10vh",
              width: "70vw",
              height: "70vw",
              borderRadius: "50%",
              background:
                "radial-gradient(closest-side, rgba(246,176,168,.45), transparent)",
              animation: "drift 34s ease-in-out infinite",
            }}
          />
          <div
            data-loop
            style={{
              position: "absolute",
              left: "-25vw",
              bottom: "-20vh",
              width: "80vw",
              height: "80vw",
              borderRadius: "50%",
              background:
                "radial-gradient(closest-side, rgba(120,146,178,.35), transparent)",
              animation: "drift2 40s ease-in-out infinite",
            }}
          />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.07,
          mixBlendMode: "multiply",
          backgroundImage: NOISE,
        }}
      />
    </div>
  );
}

/** Scene transition veil — the blue-grey veil over the blurred photo. Never white. */
export function Veil() {
  const { state } = useSalon();
  return (
    <div
      className="bg-bleed"
      style={{
        zIndex: 90,
        pointerEvents: state.veil ? "auto" : "none",
        opacity: state.veil ? 1 : 0,
        transition: "opacity .95s cubic-bezier(.65,0,.35,1)",
        background: "#5D6B7C",
      }}
    >
      <div className="bg-frame">
        <div
          className="bg-photo"
          style={{
            position: "absolute",
            inset: 0,
            filter: "blur(48px) brightness(.82)",
            opacity: 0.6,
          }}
        />
      </div>
    </div>
  );
}

/** Dark-glass toast pill, top, 2.6s (coral dot + text). */
export function Toast() {
  const { state } = useSalon();
  return (
    <div
      style={{
        position: "fixed",
        top: "calc(16px + env(safe-area-inset-top))",
        left: 0,
        right: 0,
        zIndex: 55,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        className="glass-dark"
        style={{
          padding: "11px 18px",
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 12,
          transition: "opacity 1s ease, transform 1s cubic-bezier(.22,1,.36,1)",
          opacity: state.toastOn ? 1 : 0,
          transform: state.toastOn ? "translateY(0px)" : "translateY(-12px)",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 9,
            background: "#F4A69E",
          }}
        />
        <span>{state.toast}</span>
      </div>
    </div>
  );
}
