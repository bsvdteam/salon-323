"use client";

import { useEffect, useState } from "react";
import { useSalon } from "./store";
import { EmptyState } from "./empty-state";
import { SCORE_WORD } from "./feedback";
import { listFeedbackAction, deleteFeedbackAction } from "@/lib/actions";
import type { FeedbackEntry } from "@/lib/db/feedback";

const EZ = "cubic-bezier(.22,1,.36,1)";
const kick: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono)",
  fontSize: 9,
  letterSpacing: ".22em",
  textTransform: "uppercase",
  color: "var(--ink-62)",
};
const kickD: React.CSSProperties = { ...kick, color: "rgba(244,247,250,.62)" };

type Filter = "all" | "wish" | "annoy";
const FILTERS: { k: Filter; l: string }[] = [
  { k: "all", l: "Alle" },
  { k: "wish", l: "Wünsche" },
  { k: "annoy", l: "Was stört" },
];

const when = (iso: string) => {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("de-CH", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
};
const avgOf = (xs: FeedbackEntry[]) =>
  xs.length ? xs.reduce((s, f) => s + f.score, 0) / xs.length : 0;

/**
 * Admin → Feedback: what members think of the app. The average and how the
 * scores spread, then every answer — newest first, filterable to just the
 * wishes ("10× wertvoller") or just what bothers people.
 */
export function FeedbackTab() {
  const { say } = useSalon();
  const [list, setList] = useState<FeedbackEntry[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [askDel, setAskDel] = useState<string | null>(null);
  const [now] = useState(() => Date.now()); // "last 30 days" counts from opening the tab

  useEffect(() => {
    let live = true;
    listFeedbackAction()
      .then((r) => live && setList(r ?? []))
      .catch(() => live && setList([]));
    return () => {
      live = false;
    };
  }, []);

  const remove = async (id: string) => {
    try {
      await deleteFeedbackAction(id);
      setList((l) => (l ?? []).filter((f) => f.id !== id));
      say("Feedback gelöscht");
    } catch {
      say("Löschen fehlgeschlagen");
    } finally {
      setAskDel(null);
    }
  };

  const all = list ?? [];
  const avg = avgOf(all);
  const month = all.filter(
    (f) => now - new Date(f.at).getTime() < 30 * 86_400_000,
  );
  const counts = Array.from(
    { length: 10 },
    (_, k) => all.filter((f) => f.score === k + 1).length,
  );
  const max = Math.max(1, ...counts);
  const pct = (n: number) =>
    all.length ? Math.round((n / all.length) * 100) : 0;
  const fans = pct(all.filter((f) => f.score >= 9).length);
  const critics = pct(all.filter((f) => f.score <= 6).length);
  const shown = all.filter((f) =>
    filter === "wish" ? !!f.wish : filter === "annoy" ? !!f.annoy : true,
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          animation: `up 1.4s ${EZ} both`,
        }}
      >
        <span style={kick}>
          Feedback · {all.length} {all.length === 1 ? "Antwort" : "Antworten"}
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span
            style={{
              fontSize: "clamp(56px,13vw,78px)",
              fontWeight: 200,
              letterSpacing: "-.045em",
              lineHeight: 1,
            }}
          >
            {all.length ? avg.toFixed(1).replace(".0", "") : "–"}
          </span>
          <span style={{ fontSize: 14, color: "var(--ink-60)" }}>/ 10</span>
        </div>
        <span style={{ fontSize: 12.5, color: "rgba(14,20,28,.65)" }}>
          {all.length
            ? `Ø aller Antworten · ${month.length} in den letzten 30 Tagen${
                month.length ? ` (Ø ${avgOf(month).toFixed(1)})` : ""
              }`
            : "Die Frage kommt ab und zu nach dem Öffnen der App – oder Mitglieder geben es im Profil."}
        </span>
      </div>

      {list && !all.length ? (
        <div
          className="glass-dark"
          style={{ borderRadius: 32, animation: `up 1.6s ${EZ} .15s both` }}
        >
          <EmptyState
            title="Noch kein Feedback"
            sub="Sobald jemand die App bewertet, siehst du hier die Note, was fehlt und was stört."
            glyph="10"
            tone="dark"
          />
        </div>
      ) : (
        all.length > 0 && (
          <div
            className="glass-dark"
            style={{
              borderRadius: 32,
              padding: 22,
              display: "flex",
              flexDirection: "column",
              gap: 18,
              animation: `up 1.6s ${EZ} .15s both`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={kickD}>Verteilung</span>
              <span style={{ fontSize: 11.5, color: "rgba(244,247,250,.65)" }}>
                {fans}% begeistert · {critics}% kritisch
              </span>
            </div>
            <div
              style={{
                height: 110,
                display: "grid",
                gridTemplateColumns: "repeat(10,minmax(0,1fr))",
                gap: 6,
                alignItems: "end",
              }}
            >
              {counts.map((c, k) => (
                <div
                  key={k}
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div
                    title={`${k + 1}: ${c}`}
                    style={{
                      width: "100%",
                      maxWidth: 22,
                      height: Math.max(3, (c / max) * 78) + "px",
                      borderRadius: 999,
                      background: !c
                        ? "rgba(244,247,250,.14)"
                        : k >= 8
                          ? "#F4A69E"
                          : "rgba(244,247,250,.55)",
                      transformOrigin: "bottom",
                      animation: `grow 1.6s ${EZ} both`,
                      animationDelay: 0.3 + k * 0.05 + "s",
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 8.5,
                      color: "rgba(244,247,250,.6)",
                    }}
                  >
                    {k + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {all.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            animation: `up 1.6s ${EZ} .2s both`,
          }}
        >
          {FILTERS.map((f) => {
            const on = filter === f.k;
            return (
              <button
                key={f.k}
                onClick={() => setFilter(f.k)}
                className={on ? "glass-dark" : "glass-light"}
                style={{
                  height: 36,
                  padding: "0 15px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: on ? 600 : 500,
                  border: 0,
                  color: on ? "#F4F7FA" : "#0E141C",
                  transition: `all .6s ${EZ}`,
                }}
              >
                {f.l}
              </button>
            );
          })}
        </div>
      )}

      {!list && (
        <span style={{ fontSize: 12.5, color: "var(--ink-60)" }}>Lädt …</span>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {shown.map((f, i) => (
          <div
            key={f.id}
            className="glass-light"
            style={{
              borderRadius: 26,
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              color: "#0E141C",
              animation: `up 1.2s ${EZ} ${0.25 + Math.min(i, 8) * 0.05}s both`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                className={f.score >= 9 ? undefined : "glass-dark"}
                style={{
                  flex: "none",
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 16,
                  fontWeight: 300,
                  border: 0,
                  background: f.score >= 9 ? "#E5776C" : undefined,
                  color: "#fff",
                }}
              >
                {f.score}
              </span>
              <span
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <span style={{ fontSize: 14.5, fontWeight: 500 }}>
                  {f.name}
                </span>
                <span style={{ ...kick, fontSize: 8.5 }}>
                  {when(f.at)} · {SCORE_WORD[f.score]}
                  {f.source === "profile" ? " · aus dem Profil" : ""}
                </span>
              </span>
              <button
                onClick={() =>
                  askDel === f.id ? remove(f.id) : setAskDel(f.id)
                }
                onBlur={() => askDel === f.id && setAskDel(null)}
                aria-label="Feedback löschen"
                style={{
                  flex: "none",
                  height: 30,
                  minWidth: 30,
                  padding: askDel === f.id ? "0 12px" : 0,
                  borderRadius: 999,
                  fontSize: askDel === f.id ? 11.5 : 14,
                  border: "1px solid rgba(14,20,28,.1)",
                  background: askDel === f.id ? "#B5483F" : "transparent",
                  color: askDel === f.id ? "#fff" : "rgba(14,20,28,.4)",
                  transition: `all .4s ${EZ}`,
                }}
              >
                {askDel === f.id ? "Löschen?" : "×"}
              </button>
            </div>
            {f.wish && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ ...kick, fontSize: 8.5, color: "#C2564C" }}>
                  Fehlt / 10× wertvoller
                </span>
                <span
                  style={{
                    fontSize: 14.5,
                    lineHeight: 1.45,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {f.wish}
                </span>
              </div>
            )}
            {f.annoy && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={{ ...kick, fontSize: 8.5 }}>Stört</span>
                <span
                  style={{
                    fontSize: 14.5,
                    lineHeight: 1.45,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {f.annoy}
                </span>
              </div>
            )}
            {!f.wish && !f.annoy && (
              <span style={{ fontSize: 12.5, color: "rgba(14,20,28,.45)" }}>
                Nur die Note, ohne Text.
              </span>
            )}
          </div>
        ))}
        {list && all.length > 0 && !shown.length && (
          <span style={{ fontSize: 12.5, color: "var(--ink-60)" }}>
            Dazu hat noch niemand etwas geschrieben.
          </span>
        )}
      </div>
    </div>
  );
}
