"use client";

import { useEffect, useState } from "react";
import { useSalon } from "./store";
import { EmptyState } from "./empty-state";
import {
  listRevenueAction,
  addRevenueAction,
  deleteRevenueAction,
  type RevenueData,
} from "@/lib/actions";

const kick: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono)",
  fontSize: 9,
  letterSpacing: ".22em",
  textTransform: "uppercase",
  color: "var(--ink-62)",
};
const kickD: React.CSSProperties = { ...kick, color: "rgba(244,247,250,.62)" };
const field: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  height: 44,
  padding: "0 16px",
  borderRadius: 999,
  border: "1px solid rgba(14,20,28,.12)",
  background: "rgba(255,255,255,.6)",
  color: "#0E141C",
  fontSize: 16,
  fontFamily: "var(--font-urbanist)",
};
const navBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 999,
  border: "1px solid rgba(14,20,28,.14)",
  background: "rgba(255,255,255,.4)",
  color: "#0E141C",
  fontSize: 16,
  lineHeight: 1,
};

const WD = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const chf = (n: number) =>
  n.toLocaleString("de-CH", {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
const pad = (n: number) => String(n).padStart(2, "0");
const isoDay = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const shiftYm = (ym: string, by: number) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + by, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};
// "So 1.11."
const dayLabel = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return `${WD[new Date(y, m - 1, d).getDay()]} ${d}.${m}.`;
};

/**
 * Umsatz — focused on the current month, with ‹ › (and the 12-month bars) to
 * look at earlier ones. Revenue = erledigte Termine + what the barber enters by
 * hand here (nachgetragene Monate, Termine ausserhalb der App).
 */
export function RevenueTab() {
  const { state: st, say } = useSalon();
  const [ym, setYm] = useState<string | null>(null); // null = current month
  const [rev, setRev] = useState<RevenueData | null>(null);
  const [tick, setTick] = useState(0);
  // which request the shown numbers belong to — dimmed while a newer one loads
  const want = `${ym}|${tick}|${st.adminTick}`;
  const [got, setGot] = useState<string | null>(null);
  const loading = got !== want;

  useEffect(() => {
    let live = true;
    listRevenueAction(ym ?? undefined)
      .then((r) => {
        if (live) setRev(r);
      })
      .catch(() => {})
      .finally(() => {
        if (live) setGot(want);
      });
    return () => {
      live = false;
    };
  }, [ym, want]);

  // ── manual entry form ──
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [askDel, setAskDel] = useState<string | null>(null);
  const today = isoDay(new Date());

  const openForm = () => {
    // current month → today; an earlier month → its last day
    let d = today;
    if (rev && !rev.isCurrent) {
      const [y, m] = rev.ym.split("-").map(Number);
      d = isoDay(new Date(y, m, 0));
    }
    setDay(d);
    setAmount("");
    setNote("");
    setOpen(true);
  };

  const save = async () => {
    const n = Number(amount.replace(/['’\s]/g, "").replace(",", "."));
    if (!n || n <= 0) return say("Betrag eingeben");
    if (!day) return say("Datum wählen");
    setSaving(true);
    try {
      const r = await addRevenueAction({ day, amount: n, note });
      if (!r.ok) return say(r.error ?? "Speichern fehlgeschlagen");
      say(`CHF ${chf(n)} eingetragen`);
      setOpen(false);
      // jump to the month the entry landed in, so it is visible right away
      const entryYm = day.slice(0, 7);
      if (entryYm !== rev?.ym)
        setYm(entryYm === today.slice(0, 7) ? null : entryYm);
      setTick((t) => t + 1);
    } catch {
      say("Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteRevenueAction(id);
      say("Eintrag gelöscht");
      setTick((t) => t + 1);
    } catch {
      say("Löschen fehlgeschlagen");
    } finally {
      setAskDel(null);
    }
  };

  const months = rev?.months ?? [];
  const max = Math.max(1, ...months.map((m) => m.total));
  const sum12 = months.reduce((s, m) => s + m.total, 0);
  const avg =
    rev && rev.apptCount ? Math.round(rev.apptTotal / rev.apptCount) : null;
  const tiles = rev?.isCurrent
    ? [
        { l: "Heute", v: "CHF " + chf(rev.today) },
        { l: "Diese Woche", v: "CHF " + chf(rev.week) },
        { l: "Ø / Schnitt", v: avg != null ? "CHF " + avg : "—" },
      ]
    : [
        { l: "Schnitte", v: String(rev?.apptCount ?? 0) },
        { l: "Manuell", v: "CHF " + chf(rev?.manualTotal ?? 0) },
        { l: "Ø / Schnitt", v: avg != null ? "CHF " + avg : "—" },
      ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* hero: the chosen month (default: this one) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          animation: "up 1.4s cubic-bezier(.22,1,.36,1) both",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <span style={kick}>Umsatz · {rev?.monthLabel ?? "Monat"}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {rev && !rev.isCurrent && (
              <button
                onClick={() => setYm(null)}
                style={{
                  ...navBtn,
                  width: "auto",
                  padding: "0 12px",
                  fontSize: 11.5,
                }}
              >
                Aktueller Monat
              </button>
            )}
            <button
              aria-label="Vorheriger Monat"
              onClick={() => rev && setYm(shiftYm(rev.ym, -1))}
              style={navBtn}
            >
              ‹
            </button>
            <button
              aria-label="Nächster Monat"
              disabled={!rev || rev.isCurrent}
              onClick={() => {
                if (!rev) return;
                const n = shiftYm(rev.ym, 1);
                setYm(n === today.slice(0, 7) ? null : n);
              }}
              style={{ ...navBtn, opacity: !rev || rev.isCurrent ? 0.3 : 1 }}
            >
              ›
            </button>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            opacity: loading ? 0.45 : 1,
            transition: "opacity .3s",
          }}
        >
          <span style={{ fontSize: 14, color: "var(--ink-60)" }}>CHF</span>
          <span
            style={{
              fontSize: "clamp(56px,13vw,78px)",
              fontWeight: 200,
              letterSpacing: "-.045em",
              lineHeight: 1,
            }}
          >
            {chf(rev?.total ?? 0)}
          </span>
        </div>
        <span style={{ fontSize: 12.5, color: "rgba(14,20,28,.65)" }}>
          {rev?.apptCount ?? 0} {rev?.apptCount === 1 ? "Schnitt" : "Schnitte"}{" "}
          über die App
          {rev?.manualTotal
            ? ` · CHF ${chf(rev.manualTotal)} manuell eingetragen`
            : rev?.isCurrent
              ? " · CHF 15 pro Schnitt, 20 mit Bart"
              : ""}
        </span>
      </div>

      {/* 12-month trend; tap a month to open it */}
      {sum12 > 0 ? (
        <div
          className="glass-dark"
          style={{
            borderRadius: 32,
            padding: 22,
            animation: "up 1.6s cubic-bezier(.22,1,.36,1) .15s both",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={kickD}>Letzte 12 Monate</span>
            <span style={{ fontSize: 11.5, color: "rgba(244,247,250,.65)" }}>
              CHF {chf(sum12)}
            </span>
          </div>
          <div
            style={{
              height: 130,
              display: "grid",
              gridTemplateColumns: "repeat(12,minmax(0,1fr))",
              gap: 6,
              alignItems: "end",
            }}
          >
            {months.map((m, i) => {
              const on = m.ym === rev?.ym;
              return (
                <button
                  key={m.ym}
                  onClick={() =>
                    setYm(m.ym === today.slice(0, 7) ? null : m.ym)
                  }
                  aria-label={`${m.label}: CHF ${chf(m.total)}`}
                  style={{
                    height: "100%",
                    border: 0,
                    padding: 0,
                    background: "transparent",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 22,
                      height: Math.max(3, (m.total / max) * 96) + "px",
                      borderRadius: 999,
                      background: on ? "#F4A69E" : "rgba(244,247,250,.55)",
                      transformOrigin: "bottom",
                      animation: "grow 1.6s cubic-bezier(.22,1,.36,1) both",
                      animationDelay: 0.3 + i * 0.05 + "s",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 8,
                      letterSpacing: ".04em",
                      color: on ? "#F4A69E" : "rgba(244,247,250,.6)",
                    }}
                  >
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          className="glass-dark"
          style={{
            borderRadius: 32,
            animation: "up 1.6s cubic-bezier(.22,1,.36,1) .15s both",
          }}
        >
          <EmptyState
            title="Noch kein Umsatz"
            sub="Jeder erledigte Termin zählt automatisch (CHF 15, 20 mit Bart). Früheren Umsatz oder Termine ausserhalb der App unten von Hand eintragen."
            glyph="CHF"
            tone="dark"
          />
        </div>
      )}

      {/* tiles: today / week / avg — or, for an earlier month, its breakdown */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,minmax(0,1fr))",
          gap: 10,
        }}
      >
        {tiles.map((t, i) => (
          <div
            key={t.l}
            className="glass-light"
            style={{
              padding: "16px 14px",
              borderRadius: 24,
              color: "#0E141C",
              animation: `up 1.6s cubic-bezier(.22,1,.36,1) ${0.25 + i * 0.05}s both`,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 11, color: "var(--ink-62)" }}>{t.l}</span>
            <span
              style={{ fontSize: 20, fontWeight: 300, letterSpacing: "-.02em" }}
            >
              {t.v}
            </span>
          </div>
        ))}
      </div>

      {/* manual revenue for the chosen month */}
      <div
        className="glass-light"
        style={{
          borderRadius: 28,
          padding: 18,
          color: "#0E141C",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          animation: "up 1.6s cubic-bezier(.22,1,.36,1) .35s both",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <span style={kick}>Manuell · {rev?.monthLabel ?? "Monat"}</span>
          {!open && (
            <button
              onClick={openForm}
              style={{
                height: 34,
                padding: "0 14px",
                borderRadius: 999,
                border: 0,
                background: "#0E141C",
                color: "#F4F7FA",
                fontSize: 12,
              }}
            >
              + Umsatz eintragen
            </button>
          )}
        </div>

        {open && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="ph-ink"
                inputMode="decimal"
                placeholder="Betrag CHF"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-label="Betrag in CHF"
                style={{ ...field, flex: 1 }}
                autoFocus
              />
              <input
                type="date"
                value={day}
                max={today}
                onChange={(e) => setDay(e.target.value)}
                aria-label="Datum"
                style={{ ...field, flex: 1 }}
              />
            </div>
            <input
              className="ph-ink"
              placeholder="Notiz, z. B. „Oktober gesamt“ (optional)"
              value={note}
              maxLength={120}
              onChange={(e) => setNote(e.target.value)}
              aria-label="Notiz"
              style={field}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={save}
                disabled={saving}
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: 999,
                  border: 0,
                  background: "#0E141C",
                  color: "#F4F7FA",
                  fontSize: 14,
                  opacity: saving ? 0.5 : 1,
                }}
              >
                {saving ? "…" : "Speichern"}
              </button>
              <button
                onClick={() => setOpen(false)}
                disabled={saving}
                style={{
                  flex: "none",
                  height: 46,
                  padding: "0 18px",
                  borderRadius: 999,
                  border: "1px solid rgba(14,20,28,.14)",
                  background: "transparent",
                  color: "#0E141C",
                  fontSize: 14,
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {rev?.entries.length ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {rev.entries.map((e, i) => (
              <div
                key={e.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 0",
                  borderTop: i ? "1px solid rgba(14,20,28,.07)" : "none",
                }}
              >
                <span
                  style={{
                    flex: "none",
                    minWidth: 62,
                    fontFamily: "var(--font-geist-mono)",
                    fontSize: 12,
                  }}
                >
                  {dayLabel(e.day)}
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 13,
                    color: e.note ? "#0E141C" : "rgba(14,20,28,.45)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {e.note || "Ohne Notiz"}
                </span>
                <span style={{ flex: "none", fontSize: 14, fontWeight: 500 }}>
                  CHF {chf(e.amount)}
                </span>
                <button
                  onClick={() =>
                    askDel === e.id ? remove(e.id) : setAskDel(e.id)
                  }
                  aria-label="Eintrag löschen"
                  style={{
                    flex: "none",
                    height: 30,
                    minWidth: 30,
                    padding: askDel === e.id ? "0 12px" : 0,
                    borderRadius: 999,
                    fontSize: askDel === e.id ? 11.5 : 14,
                    border: "1px solid rgba(229,119,108,.35)",
                    background:
                      askDel === e.id ? "#B5483F" : "rgba(229,119,108,.1)",
                    color: askDel === e.id ? "#fff" : "#B5483F",
                  }}
                >
                  {askDel === e.id ? "Löschen?" : "×"}
                </button>
              </div>
            ))}
          </div>
        ) : (
          !open && (
            <span style={{ fontSize: 12.5, color: "rgba(14,20,28,.55)" }}>
              Für frühere Monate oder Termine, die nicht über die App gebucht
              wurden. Zählt im Umsatz mit.
            </span>
          )
        )}
      </div>

      <span
        style={{ padding: "0 4px", fontSize: 11.5, color: "var(--ink-60)" }}
      >
        Verdient = erledigte Termine + manuell eingetragener Umsatz · bezahlt
        vor Ort (bar oder TWINT).
      </span>
    </div>
  );
}
