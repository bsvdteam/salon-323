"use client";

import { useEffect, useState } from "react";
import { useSalon } from "./store";
import { cancelApptByEventIdAction } from "@/lib/actions";

type Appt = { id: string; start: string; end: string; summary: string };

const kick: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono)",
  fontSize: 9,
  letterSpacing: ".22em",
  textTransform: "uppercase",
  color: "var(--ink-60)",
};

/** Echte Kalender-Termine im Admin: anzeigen + absagen (löscht + mailt Kunde). */
export function AdminAppointments() {
  const { say } = useSalon();
  const [items, setItems] = useState<Appt[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const d2s = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 21);
    fetch(`/api/appointments?from=${d2s(from)}&to=${d2s(to)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j?.ok) setItems(j.items);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const cancel = async (ev: Appt) => {
    setBusyId(ev.id);
    try {
      const r = await fetch(`/api/book?eventId=${encodeURIComponent(ev.id)}`, {
        method: "DELETE",
      });
      const j = await r.json();
      if (!j.ok) throw new Error();
      await cancelApptByEventIdAction(ev.id); // Supabase-Status mitziehen
      setItems((prev) => prev.filter((x) => x.id !== ev.id));
      say("Termin abgesagt – Kunde benachrichtigt");
    } catch {
      say("Absagen fehlgeschlagen");
    } finally {
      setBusyId(null);
    }
  };

  const fmt = (iso: string) => {
    if (!iso) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const d = new Date(iso + "T00:00:00");
      return (
        d.toLocaleDateString("de-CH", {
          weekday: "short",
          day: "numeric",
          month: "short",
          timeZone: "Europe/Zurich",
        }) + " · ganztags"
      );
    }
    return new Date(iso).toLocaleString("de-CH", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Zurich",
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={kick}>Kalender · nächste 3 Wochen</span>
        <span style={{ fontSize: 11.5, color: "var(--ink-60)" }}>
          {loaded ? `${items.length} Termine` : "lädt…"}
        </span>
      </div>
      {loaded && items.length === 0 && (
        <span style={{ fontSize: 13, color: "var(--ink-60)" }}>
          Keine Termine im Kalender.
        </span>
      )}
      {items.length > 0 && (
        <div
          className="glass-light"
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "2px 18px",
            borderRadius: 30,
            color: "#0E141C",
          }}
        >
          {items.map((ev, i) => (
            <div
              key={ev.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "12px 0",
                borderBottom:
                  i < items.length - 1
                    ? "1px solid rgba(14,20,28,.07)"
                    : "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {ev.summary}
                </span>
                <span style={{ fontSize: 11.5, color: "var(--ink-62)" }}>
                  {fmt(ev.start)}
                </span>
              </div>
              <button
                onClick={() => cancel(ev)}
                disabled={busyId === ev.id}
                style={{
                  flex: "none",
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  border: "1px solid rgba(229,119,108,.35)",
                  background: "rgba(229,119,108,.1)",
                  color: "#B5483F",
                  opacity: busyId === ev.id ? 0.5 : 1,
                }}
              >
                {busyId === ev.id ? "…" : "Absagen"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
