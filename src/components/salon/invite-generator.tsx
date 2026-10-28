"use client";

import { useEffect, useState } from "react";
import { barberGenerateInviteAction, memberCountAction } from "@/lib/actions";

/** Real member count (non-barber) for the barber portal heading. */
export function MemberCount() {
  const [n, setN] = useState<number | null>(null);
  useEffect(() => {
    memberCountAction()
      .then(setN)
      .catch(() => {});
  }, []);
  return <>{n ?? "·"} Mitglieder</>;
}

/** Barber tool: generate an invite code with a fixed first name for a new member. */
export function InviteGenerator() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ code: string; name: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const gen = () => {
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    setErr(null);
    setResult(null);
    barberGenerateInviteAction(n).then((res) => {
      setBusy(false);
      if (res.ok) {
        setResult({ code: res.code, name: n });
        setName("");
      } else {
        setErr(res.error === "limit" ? "Einladungs-Limit erreicht (max. 3 offen)" : "Fehler – nochmal versuchen");
      }
    });
  };

  const copy = () => {
    if (!result) return;
    navigator.clipboard?.writeText(result.code).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  };

  return (
    <div
      className="glass-dark"
      style={{
        borderRadius: 26,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        animation: "up 1.4s cubic-bezier(.22,1,.36,1) .05s both",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 9,
            letterSpacing: ".22em",
            textTransform: "uppercase",
            color: "rgba(244,247,250,.6)",
          }}
        >
          Neues Mitglied einladen
        </span>
        <span style={{ fontSize: 12.5, color: "rgba(244,247,250,.6)" }}>
          Vorname festlegen → Code erzeugen → weitergeben.
        </span>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") gen();
          }}
          placeholder="Vorname des Gasts"
          style={{
            flex: 1,
            minWidth: 0,
            height: 50,
            padding: "0 18px",
            borderRadius: 999,
            background: "rgba(255,255,255,.07)",
            border: "1px solid rgba(255,255,255,.12)",
            color: "#F4F7FA",
            fontFamily: "var(--font-urbanist)",
            fontSize: 16,
          }}
        />
        <button
          onClick={gen}
          style={{
            flex: "none",
            height: 50,
            padding: "0 20px",
            borderRadius: 999,
            border: 0,
            fontSize: 14,
            fontFamily: "var(--font-urbanist)",
            transition: "all .7s cubic-bezier(.22,1,.36,1)",
            background: name.trim() ? "#F4F7FA" : "rgba(255,255,255,.1)",
            color: name.trim() ? "#0E141C" : "rgba(244,247,250,.45)",
          }}
        >
          {busy ? "…" : "Code"}
        </button>
      </div>

      {err && (
        <span style={{ color: "rgba(244,166,158,.9)", fontSize: 12.5 }}>{err}</span>
      )}

      {result && (
        <button
          onClick={copy}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            padding: "14px 18px",
            borderRadius: 18,
            border: "1px solid rgba(244,166,158,.5)",
            background: "rgba(244,166,158,.1)",
            cursor: "pointer",
            animation: "fade .8s ease both",
          }}
        >
          <span style={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "left" }}>
            <span style={{ fontSize: 11, color: "rgba(244,247,250,.6)" }}>
              Für {result.name}
            </span>
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 22,
                letterSpacing: ".18em",
                color: "#F7F9FB",
              }}
            >
              {result.code}
            </span>
          </span>
          <span style={{ fontSize: 11.5, color: "rgba(244,247,250,.75)" }}>
            {copied ? "Kopiert ✓" : "Kopieren"}
          </span>
        </button>
      )}
    </div>
  );
}
