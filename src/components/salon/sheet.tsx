"use client";

import { useEffect, useState } from "react";
import { useSalon, type ClientRecord } from "./store";
import { useSalonActions } from "./actions";
import {
  tiers,
  labelOf,
  mon,
  svc,
  priceOf,
  SPONTI,
  type ServiceKey,
} from "@/lib/data";
import {
  updateUsernameAction,
  changePinAction,
  resetMemberPinAction,
  setMemberActiveAction,
  deleteMemberAction,
  walkInAction,
  listMembersAction,
  type AdminMember,
} from "@/lib/actions";

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "12px 0",
  borderTop: "1px solid rgba(14,20,28,.07)",
};
const pillBtn: React.CSSProperties = {
  height: 36,
  padding: "0 16px",
  borderRadius: 999,
  border: "1px solid rgba(14,20,28,.14)",
  background: "transparent",
  color: "#0E141C",
  fontSize: 12.5,
  fontWeight: 500,
};
const pinInput: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  height: 44,
  padding: "0 16px",
  borderRadius: 999,
  border: "1px solid rgba(14,20,28,.12)",
  background: "rgba(255,255,255,.6)",
  color: "#0E141C",
  fontSize: 16,
  letterSpacing: ".3em",
  fontFamily: "var(--font-urbanist)",
};
const digits = (v: string) => v.replace(/\D/g, "").slice(0, 6);

/** Member: change the login PIN (current PIN required). */
function PinChangeRow() {
  const { say } = useSalon();
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);
  const ok = cur.length === 6 && next.length === 6 && !busy;
  const save = () => {
    if (!ok) return;
    setBusy(true);
    changePinAction(cur, next).then((r) => {
      setBusy(false);
      if (r.ok) {
        setOpen(false);
        setCur("");
        setNext("");
        say("PIN geändert");
      } else {
        setCur("");
        say(
          r.error === "locked"
            ? "Zu viele Versuche – in 15 Min. nochmal"
            : "Aktueller PIN falsch",
        );
      }
    });
  };
  return (
    <div style={{ ...rowStyle, flexWrap: "wrap" }}>
      <span style={{ fontSize: 13, color: "rgba(14,20,28,.65)" }}>PIN</span>
      {!open ? (
        <button onClick={() => setOpen(true)} style={pillBtn}>
          Ändern
        </button>
      ) : (
        <div
          style={{
            flexBasis: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            animation: "fade .6s ease both",
          }}
        >
          <input
            value={cur}
            onChange={(e) => setCur(digits(e.target.value))}
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            placeholder="Aktueller PIN"
            className="ph-ink"
            autoFocus
            style={pinInput}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={next}
              onChange={(e) => setNext(digits(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
              }}
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              placeholder="Neuer PIN"
              className="ph-ink"
              style={pinInput}
            />
            <button
              onClick={save}
              className={ok ? "glass-dark" : undefined}
              style={{
                ...pillBtn,
                height: 44,
                border: ok ? 0 : pillBtn.border,
                opacity: ok ? 1 : 0.5,
              }}
            >
              {busy ? "…" : "Speichern"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Barber: a member forgot their PIN → generate a new one, shown once. The
 *  first tap only asks, since the old PIN stops working right away. */
function PinResetRow({ memberId, first }: { memberId: string; first: string }) {
  const { say } = useSalon();
  const [pin, setPin] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);
  const reset = () => {
    if (busy) return;
    if (!ask) return setAsk(true);
    setBusy(true);
    resetMemberPinAction(memberId).then((r) => {
      setBusy(false);
      if (r.ok) setPin(r.pin);
      else say("Ging nicht – bitte nochmal");
    });
  };
  return (
    <div style={rowStyle}>
      <span style={{ fontSize: 13, color: "rgba(14,20,28,.65)" }}>
        {pin
          ? `Neuer PIN für ${first} – sag ihn weiter`
          : ask
            ? "Alter PIN geht dann nicht mehr"
            : "PIN vergessen?"}
      </span>
      {pin ? (
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 18,
            letterSpacing: ".2em",
            animation: "fade .6s ease both",
          }}
        >
          {pin}
        </span>
      ) : (
        <button
          onClick={reset}
          style={
            ask
              ? {
                  ...pillBtn,
                  border: 0,
                  background: "#B5483F",
                  color: "#fff",
                }
              : pillBtn
          }
        >
          {busy ? "…" : ask ? "Neuen PIN erzeugen" : "Zurücksetzen"}
        </button>
      )}
    </div>
  );
}

/** Barber: deactivate (can't book any more, everything stays) or delete a
 *  member for good. Both destructive steps ask first. */
function MemberManageRows({ m }: { m: ClientRecord }) {
  const { set, say } = useSalon();
  const [ask, setAsk] = useState<"" | "off" | "del">("");
  const [busy, setBusy] = useState(false);
  const first = m.n.split(" ")[0];
  const id = m.id!;

  const toggle = async () => {
    if (!m.inactive && ask !== "off") return setAsk("off");
    setBusy(true);
    try {
      const r = await setMemberActiveAction(id, !!m.inactive);
      if (!r.ok) throw new Error();
      say(m.inactive ? `${first} ist wieder aktiv` : `${first} inaktiviert`);
      set((p) => ({
        sheet: { type: "client", m: { ...m, inactive: !m.inactive } },
        adminTick: p.adminTick + 1,
      }));
    } catch {
      say("Ging nicht – bitte nochmal");
    } finally {
      setBusy(false);
      setAsk("");
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      const r = await deleteMemberAction(id);
      if (!r.ok) throw new Error();
      say(`${first} gelöscht`);
      set((p) => ({ sheet: null, adminTick: p.adminTick + 1 }));
    } catch {
      say("Löschen fehlgeschlagen");
      setBusy(false);
    }
  };

  const red = { ...pillBtn, border: 0, background: "#B5483F", color: "#fff" };
  return (
    <>
      <div style={rowStyle}>
        <span style={{ fontSize: 13, color: "rgba(14,20,28,.65)" }}>
          {ask === "off"
            ? "Kann dann nichts mehr buchen"
            : m.inactive
              ? "Inaktiv · kann nicht buchen"
              : "Status · aktiv"}
        </span>
        <span style={{ display: "flex", gap: 6 }}>
          {ask === "off" && (
            <button onClick={() => setAsk("")} style={pillBtn}>
              Nein
            </button>
          )}
          <button
            onClick={toggle}
            disabled={busy}
            style={ask === "off" ? red : pillBtn}
          >
            {busy ? "…" : m.inactive ? "Aktivieren" : "Inaktivieren"}
          </button>
        </span>
      </div>
      {ask === "del" ? (
        <div
          style={{
            ...rowStyle,
            flexDirection: "column",
            alignItems: "stretch",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 13, lineHeight: 1.45 }}>
            <b style={{ fontWeight: 600 }}>{first} endgültig löschen?</b>{" "}
            Profil, Cuts, Termine und Wallet-Karte werden entfernt, ein offener
            Termin wird abgesagt. Der Umsatz bleibt.
            {m.invited
              ? ` Die ${m.invited} eingeladenen ${m.invited === 1 ? "Person bleibt" : "Leute bleiben"} Mitglied.`
              : ""}
          </span>
          <span style={{ display: "flex", gap: 8 }}>
            <button
              onClick={remove}
              disabled={busy}
              style={{ ...red, flex: 1, height: 42 }}
            >
              {busy ? "…" : "Endgültig löschen"}
            </button>
            <button
              onClick={() => setAsk("")}
              disabled={busy}
              style={{ ...pillBtn, height: 42 }}
            >
              Abbrechen
            </button>
          </span>
        </div>
      ) : (
        <div style={rowStyle}>
          <span style={{ fontSize: 13, color: "rgba(14,20,28,.65)" }}>
            Mitglied löschen
          </span>
          <button
            onClick={() => setAsk("del")}
            style={{
              ...pillBtn,
              border: "1px solid rgba(229,119,108,.35)",
              background: "rgba(229,119,108,.1)",
              color: "#B5483F",
            }}
          >
            Löschen
          </button>
        </div>
      )}
    </>
  );
}

/** Bottom sheet chrome: backdrop, glass panel, drag handle. */
function SheetFrame({ children }: { children: React.ReactNode }) {
  const { set } = useSalon();
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
            // never taller than the screen; scrolls inside on short phones or
            // when the keyboard is up while editing a field
            maxHeight: "calc(100dvh - 20px - env(safe-area-inset-top))",
            overflowY: "auto",
            overscrollBehavior: "contain",
            WebkitOverflowScrolling: "touch",
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
          {children}
        </div>
      </div>
    </>
  );
}

/** Barber: "+ Sponti" — someone walks in unannounced. Pick the person, the
 *  services and the time (now by default), done: it lands in today's agenda
 *  (own colour) and the calendar; "Fertig · abbuchen" there counts the cut. */
function SpontiSheet() {
  const { set, say } = useSalon();
  const [list, setList] = useState<AdminMember[] | null>(null);
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<AdminMember | null>(null);
  const [sv, setSv] = useState<ServiceKey[]>(["haare"]);
  const [time, setTime] = useState(() => {
    const n = new Date();
    const m = n.getHours() * 60 + Math.floor(n.getMinutes() / 5) * 5;
    return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    listMembersAction()
      .then((r) => setList(r ?? []))
      .catch(() => setList([]));
  }, []);
  const qq = q.trim().toLowerCase();
  const shown = (list ?? [])
    .filter((m) => !qq || m.n.toLowerCase().includes(qq))
    .sort((x, y) => x.n.localeCompare(y.n, "de"));
  const toggle = (k: ServiceKey) =>
    setSv((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  const ok = !!pick && sv.length > 0 && /^\d{2}:\d{2}$/.test(time) && !busy;
  const save = () => {
    if (!ok || !pick) return;
    setBusy(true);
    walkInAction({ memberId: pick.id, services: sv, time }).then((r) => {
      setBusy(false);
      if (!r.ok) return say("Ging nicht – bitte nochmal");
      say(`${pick.n.split(" ")[0]} · ${time} eingetragen`);
      set((p) => ({ sheet: null, adminTick: p.adminTick + 1 }));
    });
  };
  const muted = { padding: "12px 0", color: "rgba(14,20,28,.5)" };
  return (
    <SheetFrame>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span
          style={{
            fontFamily: "var(--font-geist-mono)",
            fontSize: 9,
            letterSpacing: ".2em",
            color: SPONTI.ink,
          }}
        >
          SPONTI
        </span>
        <span style={{ fontSize: 22, letterSpacing: "-.02em" }}>
          {pick ? pick.n : "Wer sitzt im Stuhl?"}
        </span>
      </div>

      {!pick ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name suchen"
            className="ph-ink"
            autoCorrect="off"
            spellCheck={false}
            style={{ ...pinInput, letterSpacing: 0, flex: "none" }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            {!list && <span style={muted}>Lädt …</span>}
            {list && !shown.length && (
              <span style={muted}>Niemand gefunden</span>
            )}
            {shown.map((m) => (
              <button
                key={m.id}
                onClick={() => setPick(m)}
                style={{
                  ...rowStyle,
                  width: "100%",
                  border: 0,
                  borderTop: "1px solid rgba(14,20,28,.07)",
                  background: "transparent",
                  color: "#0E141C",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 500 }}>{m.n}</span>
                <span style={{ fontSize: 12, color: "rgba(14,20,28,.55)" }}>
                  Tier {m.tier} · {m.cuts} Cuts
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {svc.map((x) => {
              const on = sv.includes(x.k);
              return (
                <button
                  key={x.k}
                  onClick={() => toggle(x.k)}
                  style={{
                    ...pillBtn,
                    height: 40,
                    border: on ? "1px solid #0E141C" : pillBtn.border,
                    background: on ? "#0E141C" : "transparent",
                    color: on ? "#F4F7FA" : "#0E141C",
                    fontWeight: on ? 600 : 500,
                  }}
                >
                  {x.name}
                </button>
              );
            })}
          </div>
          <div style={{ ...rowStyle, borderTop: 0, padding: 0 }}>
            <span style={{ fontSize: 13, color: "rgba(14,20,28,.65)" }}>
              Heute um
            </span>
            <input
              type="time"
              step={300}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              aria-label="Uhrzeit heute"
              style={{
                ...pinInput,
                flex: "none",
                width: 124,
                letterSpacing: ".04em",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={save}
              style={{
                flex: 1,
                height: 50,
                borderRadius: 999,
                border: 0,
                background: SPONTI.ink,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                opacity: ok ? 1 : 0.5,
              }}
            >
              {busy ? "…" : `Eintragen · CHF ${priceOf(sv)}`}
            </button>
            <button
              onClick={() => setPick(null)}
              style={{ ...pillBtn, height: 50, padding: "0 20px" }}
            >
              Zurück
            </button>
          </div>
        </div>
      )}
    </SheetFrame>
  );
}

export function Sheet() {
  const { state, set, say } = useSalon();
  const a = useSalonActions();
  const sh = state.sheet;
  if (!sh) return null;
  if (sh.type === "sponti") return <SpontiSheet />;

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
    <SheetFrame>
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
          <span style={{ fontSize: 12, color: "var(--ink-60)" }}>{sub}</span>
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
            <span style={{ fontSize: 13, fontWeight: 500, textAlign: "right" }}>
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
                  fontSize: 16,
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
                className="ph-ink"
                style={{
                  width: 170,
                  textAlign: "right",
                  border: 0,
                  background: "transparent",
                  color: "#0E141C",
                  fontSize: 16,
                  fontWeight: 500,
                  fontFamily: "var(--font-urbanist)",
                }}
              />
            </div>
          ))}
        {isProfile && <PinChangeRow />}
        {sh.type === "client" && sh.m.id && (
          <PinResetRow memberId={sh.m.id} first={sh.m.n.split(" ")[0]} />
        )}
        {sh.type === "client" && sh.m.id && (
          <MemberManageRows key={sh.m.id} m={sh.m} />
        )}
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
    </SheetFrame>
  );
}
