"use client";

import { useSalon } from "./store";
import { useSalonActions } from "./actions";
import { tiers, labelOf, mon } from "@/lib/data";
import { updateUsernameAction } from "@/lib/actions";

export function Sheet() {
  const { state, set, say } = useSalon();
  const a = useSalonActions();
  const sh = state.sheet;
  if (!sh) return null;

  const U = state.user ?? {
    first: "Luca",
    last: "Meier",
    username: "luca",
    cuts: 41,
    since: [2, 2024] as [number, number],
    no: "0047",
    phone: "",
    email: "",
    card: 0,
    isNew: false,
  };
  const ti = tiers.reduce((acc, t, k) => (U.cuts >= t.min ? k : acc), 0);
  const T = tiers[ti];
  const ini2 = (n: string) =>
    n
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  let ini: string,
    name: string,
    sub: string,
    rows: { l: string; v: string }[],
    primary: () => void,
    primaryLabel: string;
  const isProfile = sh.type === "profile";
  if (sh.type === "profile") {
    ini = (U.first[0] + (U.last[0] || "")).toUpperCase();
    name = (U.first + " " + U.last).trim();
    sub = "@" + U.username;
    rows = [
      { l: "Mitglied", v: "N° " + U.no },
      { l: "Tier", v: T.r + " · " + T.n },
      { l: "Vorlage", v: labelOf(state.template) },
    ];
    primary = () => a.logout();
    primaryLabel = "Abmelden";
  } else {
    const m = sh.m;
    ini = ini2(m.n);
    name = m.n;
    sub = `Tier ${m.tier} · ${m.cuts} Cuts`;
    rows = [
      { l: "Mitglied seit", v: mon[m.since[0]] + " " + m.since[1] },
      { l: "Eingeladen von", v: m.via },
      { l: "Zuletzt", v: m.last },
      { l: "Vorlage", v: m.tpl },
      { l: "Notiz", v: m.note },
    ];
    primary = () => {
      set({ sheet: null });
      a.say("Anruf an " + m.n.split(" ")[0]);
    };
    primaryLabel = "Anrufen";
  }

  return (
    <>
      <div
        onClick={() => set({ sheet: null })}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "rgba(20,30,46,.22)",
          animation: "fade .8s ease both",
        }}
      />
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 101,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            pointerEvents: "auto",
            width: "min(520px,100%)",
            borderRadius: "36px 36px 0 0",
            padding: "12px 22px calc(28px + env(safe-area-inset-bottom))",
            background:
              "linear-gradient(170deg,rgba(250,251,253,.92),rgba(236,241,246,.86))",
            backdropFilter: "blur(30px) saturate(170%)",
            WebkitBackdropFilter: "blur(30px) saturate(170%)",
            border: "1px solid rgba(255,255,255,.9)",
            boxShadow: "0 -24px 60px -24px rgba(20,30,50,.35)",
            animation: "sheetUp 1s cubic-bezier(.22,1,.36,1) both",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <button
            onClick={() => set({ sheet: null })}
            style={{
              alignSelf: "center",
              width: 44,
              height: 16,
              border: 0,
              background: "transparent",
              padding: "6px 0",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                width: 38,
                height: 4,
                borderRadius: 9,
                background: "rgba(14,20,28,.18)",
              }}
            />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              className="glass-dark"
              style={{
                flex: "none",
                width: 52,
                height: 52,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontSize: 14,
                fontWeight: 600,
                border: 0,
              }}
            >
              {ini}
            </span>
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
                  fontSize: 20,
                  fontWeight: 400,
                  letterSpacing: "-.01em",
                }}
              >
                {name}
              </span>
              <span style={{ fontSize: 12, color: "var(--ink-60)" }}>
                {sub}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {rows.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 0",
                  borderTop: "1px solid rgba(14,20,28,.07)",
                }}
              >
                <span style={{ fontSize: 13, color: "rgba(14,20,28,.65)" }}>
                  {r.l}
                </span>
                <span
                  style={{ fontSize: 13, fontWeight: 500, textAlign: "right" }}
                >
                  {r.v}
                </span>
              </div>
            ))}
            {isProfile && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 0",
                  borderTop: "1px solid rgba(14,20,28,.07)",
                }}
              >
                <span style={{ fontSize: 13, color: "rgba(14,20,28,.65)" }}>
                  Username
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flex: "none",
                  }}
                >
                  <span style={{ fontSize: 13, color: "rgba(14,20,28,.4)" }}>
                    @
                  </span>
                  <input
                    value={U.username}
                    onChange={(e) =>
                      set((p) =>
                        p.user
                          ? {
                              user: {
                                ...p.user,
                                username: e.target.value
                                  .replace(/\s/g, "")
                                  .toLowerCase(),
                              },
                            }
                          : {},
                      )
                    }
                    onBlur={() => {
                      // Persist the change; the server enforces format +
                      // uniqueness. On a clash we just flag it (the member can
                      // pick another; a re-login re-syncs the stored value).
                      const u = U.username.trim();
                      if (!u) return;
                      updateUsernameAction(u).then((res) => {
                        if (!res.ok)
                          say(
                            res.error === "username_taken"
                              ? "Username schon vergeben"
                              : "Ungültiger Username",
                          );
                      });
                    }}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    style={{
                      width: 130,
                      textAlign: "right",
                      border: 0,
                      background: "transparent",
                      color: "#0E141C",
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: "var(--font-urbanist)",
                    }}
                  />
                </div>
              </div>
            )}
            {isProfile &&
              (
                [
                  { l: "Vorname", key: "first" as const, v: U.first },
                  { l: "Nachname", key: "last" as const, v: U.last },
                  { l: "Telefon", key: "phone" as const, v: U.phone },
                  { l: "E-Mail", key: "email" as const, v: U.email },
                ] as const
              ).map((f) => (
                <div
                  key={f.key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 0",
                    borderTop: "1px solid rgba(14,20,28,.07)",
                  }}
                >
                  <span style={{ fontSize: 13, color: "rgba(14,20,28,.65)" }}>
                    {f.l}
                  </span>
                  <input
                    value={f.v}
                    onChange={(e) =>
                      set((p) =>
                        p.user
                          ? { user: { ...p.user, [f.key]: e.target.value } }
                          : {},
                      )
                    }
                    type={f.key === "email" ? "email" : "text"}
                    autoCapitalize={f.key === "email" ? "none" : undefined}
                    autoCorrect={f.key === "email" ? "off" : undefined}
                    spellCheck={f.key === "email" ? false : undefined}
                    placeholder={f.key === "email" ? "du@mail.ch" : undefined}
                    style={{
                      width: 170,
                      textAlign: "right",
                      border: 0,
                      background: "transparent",
                      color: "#0E141C",
                      fontSize: 13,
                      fontWeight: 500,
                      fontFamily: "var(--font-urbanist)",
                    }}
                  />
                </div>
              ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={primary}
              className="glass-dark"
              style={{
                flex: 1,
                height: 50,
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                border: 0,
              }}
            >
              {primaryLabel}
            </button>
            <button
              onClick={() => set({ sheet: null })}
              style={{
                height: 50,
                borderRadius: 999,
                padding: "0 22px",
                fontSize: 13,
                border: "1px solid rgba(14,20,28,.14)",
                background: "transparent",
                color: "#0E141C",
              }}
            >
              Schliessen
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
