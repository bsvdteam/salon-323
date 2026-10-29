"use client";

import { useEffect, useState } from "react";
import { barberInviteCodeAction, memberCountAction } from "@/lib/actions";
import { copyText, inviteMessage, inviteUrl, shareText } from "@/lib/share";

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

/** Barber's invite card: his personal code (no use limit) to share. Copy and
 *  share run straight in the tap handler so iOS allows them. */
export function InviteGenerator() {
  const [code, setCode] = useState<string | null>(null);
  const [done, setDone] = useState<"" | "link" | "code">("");
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    barberInviteCodeAction()
      .then(setCode)
      .catch(() => {});
  }, []);

  const flash = (what: "link" | "code") => {
    setDone(what);
    setTimeout(() => setDone(""), 2200);
  };
  const copy = (what: "link" | "code") => {
    if (!code) return;
    if (copyText(what === "link" ? inviteUrl(code) : code)) flash(what);
    else setMsg("Kopieren ging nicht – bitte von Hand abschreiben.");
  };
  const share = () => {
    if (!code) return;
    shareText({
      title: "Einladung zu Salon 15",
      text: inviteMessage(code),
      url: inviteUrl(code),
    }).then((r) => {
      if (r === "copied") setMsg("Einladung kopiert – jetzt einfügen.");
      else if (r === "failed")
        setMsg("Kopieren ging nicht – bitte von Hand abschreiben.");
      else setMsg(null);
    });
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
          Dein Einladungscode
        </span>
        <span style={{ fontSize: 12.5, color: "rgba(244,247,250,.6)" }}>
          Ohne Limit. Wer ihn nutzt, erfasst Name und alles Weitere selbst.
        </span>
      </div>

      <span
        style={{
          fontFamily: "var(--font-geist-mono)",
          fontSize: 26,
          letterSpacing: ".22em",
          color: "#F7F9FB",
        }}
      >
        {code ?? "······"}
      </span>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={share} style={primaryBtn}>
          Einladung teilen
        </button>
        <button onClick={() => copy("link")} style={ghostBtn}>
          {done === "link" ? "Link kopiert ✓" : "Link kopieren"}
        </button>
        <button onClick={() => copy("code")} style={ghostBtn}>
          {done === "code" ? "Code kopiert ✓" : "Code kopieren"}
        </button>
      </div>

      {msg && (
        <span style={{ color: "rgba(244,166,158,.9)", fontSize: 12.5 }}>
          {msg}
        </span>
      )}
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  height: 44,
  padding: "0 20px",
  borderRadius: 999,
  border: 0,
  background: "#F4F7FA",
  color: "#0E141C",
  fontSize: 12.5,
  fontWeight: 600,
  fontFamily: "var(--font-urbanist)",
};
const ghostBtn: React.CSSProperties = {
  height: 44,
  padding: "0 18px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.18)",
  background: "transparent",
  color: "#F4F7FA",
  fontSize: 12,
  fontFamily: "var(--font-urbanist)",
};
