"use client";

import { useEffect, useRef, useState } from "react";
import { useSalon } from "./store";
import { SheetFrame } from "./sheet-frame";
import {
  submitFeedbackAction,
  feedbackTextAction,
  snoozeFeedbackAction,
} from "@/lib/actions";

const EZ = "cubic-bezier(.22,1,.36,1)";
const CORAL = "#E5776C";

export const SCORE_WORD = [
  "",
  "Gar nicht",
  "Schwach",
  "Schwach",
  "Mässig",
  "Geht so",
  "Okay",
  "Gut",
  "Sehr gut",
  "Hervorragend",
  "Perfekt",
];

type Q = { k: "wish" | "annoy"; q: string; ph: string };

/** The follow-ups depend on the score: who's unhappy is first asked what
 *  bothers them; who's happy, what would make it 10× better — the other one
 *  comes second, lighter. */
function questionsFor(score: number): [Q, Q] {
  const wish10x: Q = {
    k: "wish",
    q: "Was ist das eine Ding, das die App 10× wertvoller machen würde?",
    ph: "Eine Funktion, eine Idee, ein Wunsch …",
  };
  if (score <= 6)
    return [
      {
        k: "annoy",
        q: "Was stört dich am meisten?",
        ph: "Was hakt, nervt oder fehlt …",
      },
      wish10x,
    ];
  return [
    score <= 8
      ? {
          k: "wish",
          q: "Was fehlt noch zur 10?",
          ph: "Eine Funktion, eine Idee, ein Wunsch …",
        }
      : wish10x,
    {
      k: "annoy",
      q: "Und stört dich trotzdem etwas – auch eine Kleinigkeit?",
      ph: "Optional – was hakt oder nervt …",
    },
  ];
}

/** 1–10 as one hairline with ten stops; drag or tap anywhere on it. */
function ScoreSlider({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState(false);
  const pick = (x: number) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const v =
      Math.round(Math.min(1, Math.max(0, (x - r.left) / r.width)) * 9) + 1;
    if (v !== value) {
      onChange(v);
      navigator.vibrate?.(4);
    }
  };
  const pos = value == null ? 0.5 : (value - 1) / 9;
  const move = drag ? "all .18s ease-out" : `all .5s ${EZ}`; // snaps from stop to stop
  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label="Note von 1 bis 10"
      aria-valuemin={1}
      aria-valuemax={10}
      aria-valuenow={value ?? undefined}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDrag(true);
        pick(e.clientX);
      }}
      onPointerMove={(e) => drag && pick(e.clientX)}
      onPointerUp={() => setDrag(false)}
      onPointerCancel={() => setDrag(false)}
      onKeyDown={(e) => {
        const d =
          e.key === "ArrowRight" || e.key === "ArrowUp"
            ? 1
            : e.key === "ArrowLeft" || e.key === "ArrowDown"
              ? -1
              : 0;
        if (!d) return;
        e.preventDefault();
        onChange(Math.min(10, Math.max(1, (value ?? 5) + d)));
      }}
      style={{
        position: "relative",
        height: 52,
        margin: "0 14px",
        touchAction: "none",
        cursor: "pointer",
        outline: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 25,
          height: 2,
          borderRadius: 999,
          background: "rgba(14,20,28,.1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 25,
          height: 2,
          borderRadius: 999,
          width: value == null ? 0 : `${pos * 100}%`,
          background: CORAL,
          transition: move,
        }}
      />
      {Array.from({ length: 10 }, (_, k) => (
        <span
          key={k}
          style={{
            position: "absolute",
            top: 24,
            left: `${(k / 9) * 100}%`,
            width: 4,
            height: 4,
            marginLeft: -2,
            borderRadius: "50%",
            background:
              value != null && k < value ? CORAL : "rgba(14,20,28,.22)",
            transition: `background .4s ease`,
          }}
        />
      ))}
      <span
        style={{
          position: "absolute",
          top: 12,
          left: `${pos * 100}%`,
          width: 28,
          height: 28,
          marginLeft: -14,
          borderRadius: "50%",
          background: "linear-gradient(160deg,#fff,#EEF2F6)",
          border: "1px solid rgba(255,255,255,.95)",
          boxShadow:
            "0 8px 20px -6px rgba(20,30,50,.35), 0 1px 2px rgba(20,30,50,.12)",
          transform: drag ? "scale(1.15)" : "scale(1)",
          transition: `${move}, transform .35s ${EZ}`,
          animation:
            value == null ? "softPulse 2.4s ease-in-out infinite" : undefined,
        }}
      />
    </div>
  );
}

const kick: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono)",
  fontSize: 9,
  letterSpacing: ".22em",
  textTransform: "uppercase",
  color: "rgba(14,20,28,.55)",
};
const primaryBtn = (on: boolean): React.CSSProperties => ({
  flex: 1,
  height: 50,
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 600,
  border: 0,
  opacity: on ? 1 : 0.4,
  transition: "opacity .4s ease",
});
const ghostBtn: React.CSSProperties = {
  height: 50,
  borderRadius: 999,
  padding: "0 22px",
  fontSize: 13,
  border: "1px solid rgba(14,20,28,.14)",
  background: "transparent",
  color: "#0E141C",
};

/**
 * Feedback on the app: a 1–10 slider, then two short questions that adapt to
 * the score. The score is saved on "Weiter" already, each answer as it comes,
 * so closing halfway still counts. Only the barber sees it (Admin → Feedback).
 */
export function FeedbackSheet({ source }: { source: "prompt" | "profile" }) {
  const { state, set, say } = useSalon();
  const first = state.user?.first ?? "";
  const [step, setStep] = useState(0); // 0 score · 1, 2 questions · 3 thanks
  const [score, setScore] = useState<number | null>(null);
  const [txt, setTxt] = useState("");
  const idP = useRef<Promise<string | null> | null>(null);
  const qs = score == null ? null : questionsFor(score);

  const close = () => {
    // the question came by itself and wasn't answered → ask again much later
    if (source === "prompt" && step === 0)
      snoozeFeedbackAction().catch(() => {});
    set({ sheet: null, fbAsk: false });
  };
  const rate = () => {
    if (score == null) return;
    idP.current = submitFeedbackAction({ score, source })
      .then((r) => (r.ok ? r.id : null))
      .catch(() => null)
      .then((id) => {
        if (!id) say("Ging nicht – bitte später nochmal");
        return id;
      });
    setTxt("");
    setStep(1);
  };
  const next = (skip: boolean) => {
    const q = qs?.[step - 1];
    const t = txt.trim();
    if (q && !skip && t && idP.current)
      idP.current
        .then((id) => {
          if (id) return feedbackTextAction(id, { [q.k]: t });
        })
        .catch(() => {});
    setTxt("");
    setStep(step + 1);
  };

  useEffect(() => {
    if (step !== 3) return;
    const t = setTimeout(() => set({ sheet: null, fbAsk: false }), 2800);
    return () => clearTimeout(t);
  }, [step, set]);

  const q = qs && step >= 1 && step <= 2 ? qs[step - 1] : null;

  return (
    <SheetFrame onClose={close}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={kick}>Feedback</span>
        {step < 3 && (
          <span style={{ display: "flex", gap: 5 }}>
            {[0, 1, 2].map((k) => (
              <span
                key={k}
                style={{
                  width: k === step ? 16 : 5,
                  height: 5,
                  borderRadius: 999,
                  background: k <= step ? "#0E141C" : "rgba(14,20,28,.15)",
                  transition: `all .6s ${EZ}`,
                }}
              />
            ))}
          </span>
        )}
      </div>

      <div
        key={step}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 18,
          animation: `up .7s ${EZ} both`,
        }}
      >
        {step === 0 && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span
                style={{
                  fontSize: 23,
                  fontWeight: 400,
                  letterSpacing: "-.02em",
                  lineHeight: 1.2,
                }}
              >
                Wie gefällt dir die App{first ? `, ${first}` : ""}?
              </span>
              <span style={{ fontSize: 13, color: "rgba(14,20,28,.58)" }}>
                Ehrlich – Laurin liest jedes Feedback selbst.
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                padding: "6px 0 0",
              }}
            >
              <span
                key={score ?? 0}
                style={{
                  fontSize: 76,
                  fontWeight: 200,
                  letterSpacing: "-.04em",
                  lineHeight: 1,
                  color: score == null ? "rgba(14,20,28,.2)" : "#0E141C",
                  animation: `fade .35s ease both`,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {score ?? "–"}
              </span>
              <span
                style={{
                  ...kick,
                  color: score == null ? "rgba(14,20,28,.4)" : CORAL,
                  transition: "color .4s ease",
                }}
              >
                {score == null ? "Zieh den Punkt" : SCORE_WORD[score]}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <ScoreSlider value={score} onChange={setScore} />
              <div
                style={{
                  ...kick,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 8.5,
                  color: "rgba(14,20,28,.4)",
                }}
              >
                <span>1 · gar nicht</span>
                <span>10 · perfekt</span>
              </div>
            </div>
          </>
        )}

        {q && score != null && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ ...kick, color: CORAL }}>
                {score} / 10 · {SCORE_WORD[score]}
              </span>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 400,
                  letterSpacing: "-.02em",
                  lineHeight: 1.25,
                }}
              >
                {q.q}
              </span>
            </div>
            <textarea
              value={txt}
              onChange={(e) => setTxt(e.target.value.slice(0, 1000))}
              placeholder={q.ph}
              rows={4}
              className="ph-ink"
              style={{
                width: "100%",
                boxSizing: "border-box",
                resize: "none",
                padding: "16px 18px",
                borderRadius: 22,
                border: "1px solid rgba(14,20,28,.1)",
                background: "rgba(255,255,255,.62)",
                boxShadow: "inset 0 1px 2px rgba(20,30,50,.05)",
                color: "#0E141C",
                fontSize: 16,
                lineHeight: 1.45,
                fontFamily: "var(--font-urbanist)",
                outline: "none",
              }}
            />
          </>
        )}

        {step === 3 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: 10,
              padding: "18px 0 8px",
            }}
          >
            <span
              className="glass-dark"
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                border: 0,
                animation: `pop .9s ${EZ} both`,
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  style={{
                    strokeDasharray: 60,
                    animation: "draw .8s ease .3s both",
                  }}
                />
              </svg>
            </span>
            <span
              style={{ fontSize: 23, fontWeight: 400, letterSpacing: "-.02em" }}
            >
              Danke{first ? `, ${first}` : ""}.
            </span>
            <span style={{ fontSize: 13, color: "rgba(14,20,28,.58)" }}>
              Das macht Salon 15 besser.
            </span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {step === 0 && (
          <>
            <button
              onClick={rate}
              disabled={score == null}
              className="glass-dark"
              style={primaryBtn(score != null)}
            >
              Weiter
            </button>
            <button onClick={close} style={ghostBtn}>
              {source === "prompt" ? "Später" : "Schliessen"}
            </button>
          </>
        )}
        {(step === 1 || step === 2) && (
          <>
            <button
              onClick={() => next(false)}
              className="glass-dark"
              style={primaryBtn(true)}
            >
              {step === 2 ? "Senden" : "Weiter"}
            </button>
            <button onClick={() => next(true)} style={ghostBtn}>
              Überspringen
            </button>
          </>
        )}
        {step === 3 && (
          <button
            onClick={close}
            className="glass-dark"
            style={primaryBtn(true)}
          >
            Schliessen
          </button>
        )}
      </div>
    </SheetFrame>
  );
}

/**
 * The question, when it comes by itself: a small glass note above the tab
 * bar on Start, a few seconds in — never a popup. Tap opens the sheet,
 * × puts it off for weeks.
 */
export function FeedbackNudge() {
  const { state, set } = useSalon();
  const due =
    state.fbAsk &&
    state.screen === "app" &&
    state.tab === "home" &&
    !state.sheet;
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!due) return;
    const t = setTimeout(() => setShown(true), 3200);
    return () => {
      clearTimeout(t);
      setShown(false);
    };
  }, [due]);
  if (!due || !shown) return null;

  const later = () => {
    snoozeFeedbackAction().catch(() => {});
    set({ fbAsk: false });
  };
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: "calc(92px + env(safe-area-inset-bottom))",
        zIndex: 19,
        display: "flex",
        justifyContent: "center",
        padding: "0 16px",
        pointerEvents: "none",
      }}
    >
      <div
        className="glass-light"
        style={{
          pointerEvents: "auto",
          width: "min(380px,100%)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 8px 8px 18px",
          borderRadius: 999,
          color: "#0E141C",
          animation: `up 1s ${EZ} both`,
        }}
      >
        <button
          onClick={() =>
            set({ sheet: { type: "feedback", source: "prompt" }, fbAsk: false })
          }
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            border: 0,
            padding: 0,
            background: "transparent",
            color: "inherit",
            textAlign: "left",
          }}
        >
          <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ ...kick, fontSize: 8 }}>Kurze Frage</span>
            <span style={{ fontSize: 13.5, fontWeight: 500 }}>
              Wie gefällt dir die App?
            </span>
          </span>
          <span
            className="glass-dark"
            style={{
              flex: "none",
              height: 36,
              padding: "0 16px",
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              fontSize: 12,
              fontWeight: 600,
              border: 0,
            }}
          >
            1–10
          </span>
        </button>
        <button
          onClick={later}
          aria-label="Später"
          style={{
            flex: "none",
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: 0,
            background: "rgba(14,20,28,.06)",
            color: "rgba(14,20,28,.55)",
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
