"use client";

import { useState } from "react";
import { useSalon } from "../store";
import { loginBarberAction } from "@/lib/actions";

/** Gate in front of the barber portal: username + password, verified server-side. */
export function BarberLogin() {
  const { set } = useSalon();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const ok = u.trim().length > 0 && p.length > 0;

  const submit = () => {
    if (!ok || busy) return;
    setBusy(true);
    setErr(false);
    loginBarberAction(u.trim(), p).then((res) => {
      setBusy(false);
      if (res.ok) set({ barberAuthed: true });
      else setErr(true);
    });
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "0 16px",
      }}
    >
      <div
        className="glass-dark"
        style={{
          width: "min(360px,100%)",
          borderRadius: 30,
          padding: 22,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          animation: "fade 1s ease both",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 9,
              letterSpacing: ".24em",
              textTransform: "uppercase",
              color: "rgba(244,247,250,.6)",
            }}
          >
            Salon 323 · Barber
          </span>
          <span style={{ fontSize: 24, fontWeight: 300, color: "#F4F7FA" }}>
            Anmelden
          </span>
        </div>

        <input
          value={u}
          onChange={(e) => setU(e.target.value)}
          placeholder="Username"
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          style={field}
        />
        <input
          value={p}
          onChange={(e) => setP(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          type="password"
          placeholder="Passwort"
          style={field}
        />

        {err && (
          <span style={{ color: "rgba(244,166,158,.9)", fontSize: 12.5 }}>
            Username oder Passwort falsch
          </span>
        )}

        <button
          onClick={submit}
          style={{
            height: 54,
            borderRadius: 999,
            border: 0,
            fontSize: 15,
            fontFamily: "var(--font-urbanist)",
            transition: "all .7s cubic-bezier(.22,1,.36,1)",
            background: ok ? "#F4F7FA" : "rgba(255,255,255,.1)",
            color: ok ? "#0E141C" : "rgba(244,247,250,.45)",
            cursor: ok ? "pointer" : "default",
          }}
        >
          {busy ? "…" : "Anmelden →"}
        </button>
      </div>
    </div>
  );
}

const field: React.CSSProperties = {
  height: 54,
  padding: "0 18px",
  borderRadius: 999,
  background: "rgba(255,255,255,.07)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "#F4F7FA",
  fontFamily: "var(--font-urbanist)",
  fontSize: 16,
  letterSpacing: ".01em",
};
