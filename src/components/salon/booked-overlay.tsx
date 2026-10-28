"use client";

import { useSalon } from "./store";

const PAY_LONG: Record<string, string> = {
  twint: "TWINT · Push nach dem Schnitt",
  apple: "Apple Pay · belastet nach dem Schnitt",
  ort: "Bezahlung vor Ort",
};

export function BookedOverlay() {
  const { state, set } = useSalon();
  const b = state.booked;
  if (!b) return null;
  const done = () =>
    set({ booked: null, tab: "home", time: null, slideDone: false });
  const toCard = () =>
    set({
      booked: null,
      tab: "card",
      time: null,
      slideDone: false,
      flipped: false,
    });

  return (
    <>
      <div
        onClick={done}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 105,
          background: "rgba(20,28,40,.28)",
          animation: "fade 1s ease both",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 106,
          display: "grid",
          placeItems: "center",
          padding: 20,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            width: "min(340px,100%)",
            borderRadius: 40,
            padding: "34px 24px 22px",
            background: "linear-gradient(160deg,#151c28,#273141)",
            boxShadow:
              "inset 0 0 0 1px rgba(255,255,255,.08),inset 0 1px 0 rgba(255,255,255,.12),0 50px 100px -40px rgba(10,16,26,.7)",
            color: "#F4F7FA",
            animation: "up 1.2s cubic-bezier(.22,1,.36,1) both",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: 64,
              height: 64,
              display: "grid",
              placeItems: "center",
            }}
          >
            <span
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "1px solid rgba(244,166,158,.6)",
                animation: "halo 1.8s ease-out 1.1s both",
              }}
            />
            <svg
              width="64"
              height="64"
              viewBox="0 0 64 64"
              style={{
                position: "absolute",
                inset: 0,
                transform: "rotate(-90deg)",
              }}
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="rgba(255,255,255,.1)"
                strokeWidth="1.5"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="#F4F7FA"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="176"
                style={{
                  animation:
                    "ringDraw 1.1s cubic-bezier(.65,0,.35,1) .25s both",
                }}
              />
            </svg>
            <svg
              width="26"
              height="26"
              viewBox="0 0 26 26"
              fill="none"
              stroke="#F4F7FA"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M6 13.5l4.5 4.5L20 8"
                strokeDasharray="24"
                style={{
                  animation: "draw 0.7s cubic-bezier(.22,1,.36,1) 1.05s both",
                }}
              />
            </svg>
          </div>
          <span
            style={{
              marginTop: 22,
              fontFamily: "var(--font-geist-mono)",
              fontSize: 9,
              letterSpacing: ".26em",
              textTransform: "uppercase",
              color: "rgba(244,247,250,.6)",
              animation: "fade 1s ease 1.2s both",
            }}
          >
            Gebucht
          </span>
          <span
            style={{
              marginTop: 14,
              fontSize: 58,
              fontWeight: 200,
              letterSpacing: "-.045em",
              lineHeight: 0.95,
              animation: "up 1.2s cubic-bezier(.22,1,.36,1) 1.3s both",
            }}
          >
            {b.time}
          </span>
          <span
            style={{
              marginTop: 10,
              fontSize: 15,
              animation: "up 1.2s cubic-bezier(.22,1,.36,1) 1.4s both",
            }}
          >
            {b.when}
          </span>
          <span
            style={{
              marginTop: 6,
              fontSize: 12,
              color: "rgba(244,247,250,.6)",
              animation: "up 1.2s cubic-bezier(.22,1,.36,1) 1.5s both",
            }}
          >
            {b.what}
          </span>
          <span
            style={{
              marginTop: 10,
              fontSize: 11.5,
              color: "#F4A69E",
              animation: "up 1.2s cubic-bezier(.22,1,.36,1) 1.55s both",
            }}
          >
            {PAY_LONG[b.pay]}
          </span>
          <div
            style={{
              marginTop: 26,
              width: "100%",
              display: "flex",
              gap: 8,
              animation: "up 1.2s cubic-bezier(.22,1,.36,1) 1.65s both",
            }}
          >
            <button
              onClick={toCard}
              style={{
                flex: 1,
                height: 48,
                border: "1px solid rgba(255,255,255,.16)",
                background: "transparent",
                color: "#F4F7FA",
                borderRadius: 999,
                fontSize: 12.5,
              }}
            >
              Terminkarte
            </button>
            <button
              onClick={done}
              style={{
                flex: 1,
                height: 48,
                border: 0,
                borderRadius: 999,
                background: "#F4F7FA",
                color: "#0E141C",
                fontSize: 12.5,
                fontWeight: 600,
              }}
            >
              Fertig
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
