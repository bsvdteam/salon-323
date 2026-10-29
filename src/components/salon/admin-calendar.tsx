"use client";

import { useEffect, useState } from "react";
import { useSalon } from "./store";
import { EmptyState } from "./empty-state";
import { cancelApptByEventIdAction } from "@/lib/actions";

type Appt = { id: string; start: string; end: string; summary: string };

const kick: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono)",
  fontSize: 9,
  letterSpacing: ".22em",
  textTransform: "uppercase",
  color: "var(--ink-62)",
};

const WD = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MON = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];

/**
 * Termine — calendar overview of the booked period (next 2 weeks), grouped by
 * day as an agenda. The single source is the Google calendar (/api/appointments);
 * cancelling removes the event + mirrors the Supabase status, and mails the guest.
 */
export function CalendarTab() {
  const { say } = useSalon();
  const [items, setItems] = useState<Appt[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const d2s = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 14);
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
      await cancelApptByEventIdAction(ev.id);
      setItems((prev) => prev.filter((x) => x.id !== ev.id));
      say("Termin abgesagt – Kunde benachrichtigt");
    } catch {
      say("Absagen fehlgeschlagen");
    } finally {
      setBusyId(null);
    }
  };

  const isAllDay = (iso: string) => /^\d{4}-\d{2}-\d{2}$/.test(iso);
  const dateOfIso = (iso: string) =>
    isAllDay(iso) ? new Date(iso + "T00:00:00") : new Date(iso);
  const timeLabel = (iso: string) =>
    isAllDay(iso)
      ? "ganztags"
      : new Date(iso).toLocaleTimeString("de-CH", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Zurich",
        });

  // group by day
  const byDay = new Map<string, { d: Date; items: Appt[] }>();
  for (const ev of [...items].sort((a, b) => a.start.localeCompare(b.start))) {
    const d = dateOfIso(ev.start);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!byDay.has(key)) byDay.set(key, { d, items: [] });
    byDay.get(key)!.items.push(ev);
  }
  const days = [...byDay.values()];

  const today = new Date();
  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          animation: "up 1.4s cubic-bezier(.22,1,.36,1) both",
        }}
      >
        <span style={kick}>
          {loaded ? `${items.length} Termine` : "lädt…"} · nächste 2 Wochen
        </span>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(28px,6vw,38px)",
            fontWeight: 300,
            letterSpacing: "-.025em",
          }}
        >
          Deine Termine.
        </h1>
      </div>

      {loaded && items.length === 0 ? (
        <div
          className="glass-dark"
          style={{
            borderRadius: 34,
            animation: "up 1.4s cubic-bezier(.22,1,.36,1) .1s both",
          }}
        >
          <EmptyState
            title="Keine Termine gebucht"
            sub="In den nächsten 2 Wochen ist noch nichts gebucht. Neue Buchungen erscheinen automatisch hier und in deinem Google Kalender."
            glyph="◷"
            tone="dark"
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {days.map((day, di) => (
            <div
              key={di}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                animation: `up 1.4s cubic-bezier(.22,1,.36,1) ${0.1 + di * 0.05}s both`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  padding: "0 4px",
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 500 }}>
                  {isToday(day.d) ? "Heute" : WD[day.d.getDay()]}
                </span>
                <span style={{ fontSize: 12.5, color: "var(--ink-60)" }}>
                  {day.d.getDate()}. {MON[day.d.getMonth()]}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 10,
                    letterSpacing: ".14em",
                    color: "var(--ink-62)",
                  }}
                >
                  {day.items.length}×
                </span>
              </div>
              <div
                className="glass-light"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "2px 18px",
                  borderRadius: 26,
                  color: "#0E141C",
                }}
              >
                {day.items.map((ev, i) => (
                  <div
                    key={ev.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "13px 0",
                      borderBottom:
                        i < day.items.length - 1
                          ? "1px solid rgba(14,20,28,.07)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        minWidth: 0,
                      }}
                    >
                      <span
                        style={{
                          flex: "none",
                          minWidth: 48,
                          fontFamily: "var(--font-geist-mono)",
                          fontSize: 13,
                          color: "#0E141C",
                        }}
                      >
                        {timeLabel(ev.start)}
                      </span>
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
                    </div>
                    <button
                      onClick={() => cancel(ev)}
                      disabled={busyId === ev.id}
                      style={{
                        flex: "none",
                        height: 34,
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
