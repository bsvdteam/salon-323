"use client";

import { useSalon } from "../store";
import { useSalonActions } from "../actions";
import { verses, EZ } from "@/lib/data";

export function WelcomeScreen() {
  const { state } = useSalon();
  const a = useSalonActions();
  const U = state.user ?? { first: "Luca", isNew: false };
  const v = verses[state.verse];
  const words = v.t.split(" ").length;
  const verseRefDelay = `${2.6 + words * 0.14}s`;
  const tapDelay = `${3.6 + words * 0.14}s`;

  return (
    <div
      onClick={() => a.toApp()}
      style={{
        position: "relative",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
        padding: "40px 18px",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-geist-mono)",
          fontSize: 9,
          letterSpacing: ".3em",
          textTransform: "uppercase",
          color: "#fff",
          mixBlendMode: "difference",
          animation: "wordIn 2s cubic-bezier(.22,1,.36,1) .3s both",
        }}
      >
        {U.isNew ? "Welcome to the Circle" : "Welcome back"}
      </div>
      <div
        style={{
          fontSize: "clamp(34px,5vw,46px)",
          fontWeight: 300,
          letterSpacing: "-.02em",
          lineHeight: 1,
          color: "#fff",
          mixBlendMode: "difference",
          animation: "wordIn 2.4s cubic-bezier(.22,1,.36,1) .7s both",
        }}
      >
        {U.first}.
      </div>
      <div
        className="glass-dark"
        style={{
          width: "min(500px,100%)",
          borderRadius: 38,
          padding: "34px 28px 28px",
          textAlign: "center",
          animation: "up 2.2s cubic-bezier(.22,1,.36,1) 1.4s both",
          display: "flex",
          flexDirection: "column",
          gap: 22,
          alignItems: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "clamp(17px,2.4vw,20px)",
            lineHeight: 1.65,
            fontWeight: 300,
            textWrap: "balance",
            color: "#F4F7FA",
          }}
        >
          {v.t.split(" ").map((w, i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: ".3em",
                animation: `wordIn 1.9s ${EZ} ${(2.4 + i * 0.14).toFixed(2)}s both`,
              }}
            >
              {w}
            </span>
          ))}
        </p>
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 9,
            letterSpacing: ".22em",
            textTransform: "uppercase",
            color: "rgba(244,247,250,.62)",
            animation: `fade 1.6s ease ${verseRefDelay} both`,
          }}
        >
          {v.r}
        </span>
      </div>
      <div
        style={{
          fontFamily: "var(--font-geist-mono)",
          fontSize: 8.5,
          letterSpacing: ".26em",
          textTransform: "uppercase",
          color: "#fff",
          mixBlendMode: "difference",
          animation: `fade 2s ease ${tapDelay} both`,
        }}
      >
        Tippen zum Eintreten
      </div>
    </div>
  );
}
