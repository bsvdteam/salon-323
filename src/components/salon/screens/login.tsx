"use client";

import { useEffect, useRef, useState } from "react";
import { useSalon } from "../store";
import { useSalonActions } from "../actions";
import { Wordmark } from "../wordmark";
import { useOverlayActions } from "../overlays/overlay-actions";
import { useCardScale } from "../use-portrait";
import { salon } from "@/lib/data";
import { memberCountAction } from "@/lib/actions";

const WA_CODE_REQUEST =
  salon.wa +
  "?text=" +
  encodeURIComponent("Hoi! Ich hätte gern einen Einladungscode für Salon 15.");

type Box = { ch: string; active: boolean; bg: string; border: string };
function boxes(str: string, n: number): Box[] {
  return Array.from({ length: n }, (_, k) => {
    const ch = str[k] || "";
    const active = k === Math.min(str.length, n - 1) && str.length < n;
    const full = str.length === n;
    return {
      ch,
      active,
      bg: ch ? "rgba(255,255,255,.14)" : "rgba(255,255,255,.04)",
      border: active
        ? "rgba(255,255,255,.55)"
        : full
          ? "rgba(244,166,158,.6)"
          : "rgba(255,255,255,.1)",
    };
  });
}

// intro card definitions: [x, y, rotate]
const CARDS: [string, string, number][] = [
  ["max(-13vw,-170px)", "-9vh", -3],
  ["min(15vw,200px)", "-17vh", 3],
  ["max(-9vw,-120px)", "15vh", 2],
  ["min(13vw,170px)", "9vh", -2],
];
const CARD_DIM = [
  { w: 136, h: 84, r: 26, float: "float1 9s ease-in-out infinite" },
  { w: 150, h: 86, r: 26, float: "float2 11s ease-in-out infinite" },
  { w: 150, h: 42, r: 21, float: "float1 12s ease-in-out -3s infinite" },
  { w: 164, h: 52, r: 26, float: "float2 10s ease-in-out -4s infinite" },
];

function cardTf(i: number, ph: number) {
  const c = CARDS[i];
  const base = "translate(-50%,-50%) ";
  if (ph === 0)
    return (
      base + `translate(${c[0]}, calc(${c[1]} + 62vh)) rotate(${c[2] * 2}deg)`
    );
  if (ph === 1) return base + `translate(${c[0]}, ${c[1]}) rotate(${c[2]}deg)`;
  return base + `translate(${c[0]}, calc(${c[1]} - 62vh)) rotate(${-c[2]}deg)`;
}

function IntroCard({
  i,
  ph,
  children,
}: {
  i: number;
  ph: number;
  children: React.ReactNode;
}) {
  const d = CARD_DIM[i];
  const o = ph === 1 ? 1 : 0;
  const od = ph === 1 ? "1.6s" : "1.1s";
  const delay = ph === 1 ? `${i * 0.28}s` : ph >= 2 ? `${i * 0.12}s` : "0s";
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: d.w,
        height: d.h,
        transform: cardTf(i, ph),
        transition: `transform 3.4s cubic-bezier(.5,0,.15,1) ${delay}`,
      }}
    >
      <div
        data-loop
        style={{ width: "100%", height: "100%", animation: d.float }}
      >
        <div
          className="lens-card"
          style={{
            width: "100%",
            height: "100%",
            borderRadius: d.r,
            opacity: o,
            transition: `opacity ${od} ease ${delay}`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function LoginScreen() {
  const { state, set } = useSalon();
  const a = useSalonActions();
  const ov = useOverlayActions();
  const st = state;
  const ready = st.intro >= 3;
  const panelOpen = !!st.mode;
  const chromeO = ready ? 1 : 0;

  const nameMt = panelOpen
    ? "calc(clamp(148px,17.5vw,212px) * -0.207 - 44px)"
    : "calc(clamp(148px,17.5vw,212px) * -0.207 + 2px)";
  const subMt = panelOpen ? "-36px" : "10px";
  const cardScale = useCardScale();

  const usernameOk = st.username.trim().length > 0;
  const codeInvalid = st.code.length === 6 && !st.checking && !st.inviteOk;

  // Keep the panel's inner content mounted even after it closes, so the card
  // fades out at full size (no empty-card flash). `shown` adopts the latest
  // open mode at render time and simply keeps it while the panel is hidden.
  const [shown, setShown] = useState<typeof st.mode>(st.mode);
  if (st.mode && st.mode !== shown) setShown(st.mode);
  // the barber login (/admin) is the same panel, password asked right away
  const modeBarber = shown === "barber";
  const modeMember = shown === "member" || modeBarber;
  const modeInvite = shown === "invite";

  // Invite link (/i/CODE): the code arrives prefilled — check it once.
  useEffect(() => {
    if (st.mode === "invite" && st.code.length === 6 && !st.inviteOk)
      a.onCode(st.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real member count (non-barber), fetched once on mount.
  const [memberCount, setMemberCount] = useState<number | null>(null);
  useEffect(() => {
    memberCountAction()
      .then(setMemberCount)
      .catch(() => {});
  }, []);

  const pty = useRef(0);
  const peekWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaY) < 4) return;
    const v = e.deltaY > 0;
    if (v !== st.peek) set({ peek: v });
  };
  return (
    <div
      onClick={() => a.set((p) => (p.intro >= 3 ? {} : { intro: 3 }))}
      onWheel={peekWheel}
      onTouchStart={(e) => {
        pty.current = e.touches[0].clientY;
      }}
      onTouchEnd={(e) => {
        const dd = pty.current - e.changedTouches[0].clientY;
        if (Math.abs(dd) > 30) set({ peek: dd > 0 });
      }}
      style={{ position: "relative", minHeight: "100dvh", overflow: "hidden" }}
    >
      {/* top chrome */}
      <div
        style={{
          position: "absolute",
          top: "calc(14px + env(safe-area-inset-top))",
          height: 44,
          left: "clamp(20px,4vw,48px)",
          right: "clamp(20px,4vw,48px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          fontFamily: "var(--font-geist-mono)",
          fontSize: 9,
          letterSpacing: ".26em",
          textTransform: "uppercase",
          color: "#0E141C",
          opacity: chromeO,
          transition: "opacity 2.4s ease",
        }}
      >
        <span>N° 15</span>
        {/* Member count, top-right on the landing (Supabase-backed later). */}
        <span>{memberCount !== null ? `${memberCount} ` : ""}Members</span>
      </div>

      {/* intro cards */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          transform: `scale(${cardScale})`,
        }}
      >
        <IntroCard i={0} ph={st.intro}>
          <div
            style={{ height: "100%", display: "grid", placeItems: "center" }}
          >
            <span
              style={{
                fontSize: 20,
                fontWeight: 300,
                letterSpacing: "-.005em",
                whiteSpace: "nowrap",
              }}
            >
              Kol 3,23
            </span>
          </div>
        </IntroCard>
        <IntroCard i={1} ph={st.intro}>
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 8,
              padding: "0 20px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 8.5,
                letterSpacing: ".24em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,.7)",
              }}
            >
              Dein Termin
            </span>
            <span
              style={{
                fontSize: 30,
                fontWeight: 300,
                letterSpacing: "-.03em",
                lineHeight: 1,
              }}
            >
              14:30
            </span>
          </div>
        </IntroCard>
        <IntroCard i={2} ph={st.intro}>
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: 9,
                background: "#F4A69E",
              }}
            />
            <span
              style={{
                fontSize: 12,
                letterSpacing: ".01em",
                whiteSpace: "nowrap",
              }}
            >
              Members only
            </span>
          </div>
        </IntroCard>
        <IntroCard i={3} ph={st.intro}>
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              padding: "0 8px 0 18px",
            }}
          >
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>
                Wie immer?
              </span>
              <span
                style={{
                  fontSize: 10.5,
                  color: "rgba(255,255,255,.7)",
                  whiteSpace: "nowrap",
                }}
              >
                Haare · Bart
              </span>
            </span>
            <span
              style={{
                flex: "none",
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: "#F4F7FA",
                color: "#0E141C",
                fontSize: 13,
              }}
            >
              →
            </span>
          </div>
        </IntroCard>
      </div>

      {/* wordmark + subtitle */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          marginTop: nameMt,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          color: "#fff",
          mixBlendMode: "difference",
          opacity: ready ? 1 : 0,
          filter: ready ? "blur(0px)" : "blur(14px)",
          transition:
            "opacity 2.2s ease, filter 2.2s ease, margin-top 1.4s cubic-bezier(.22,1,.36,1)",
        }}
      >
        <Wordmark />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          marginTop: subMt,
          textAlign: "center",
          pointerEvents: "none",
          color: "#fff",
          mixBlendMode: "difference",
          fontFamily: "var(--font-geist-mono)",
          fontSize: 8.5,
          letterSpacing: ".34em",
          textTransform: "uppercase",
          opacity: ready ? 1 : 0,
          transition:
            "opacity 2s ease .6s, margin-top 1.4s cubic-bezier(.22,1,.36,1)",
        }}
      >
        members only
      </div>

      {/* chooser — stacked: "Mitglied werden" (white) on top, "Anmelden"
          (chrome ink) directly below it */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "calc(58px + env(safe-area-inset-bottom))",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          fontFamily: "var(--font-geist-mono)",
          fontSize: 9.5,
          letterSpacing: ".26em",
          textTransform: "uppercase",
          opacity: ready && !panelOpen ? 1 : 0,
          pointerEvents: ready && !panelOpen ? "auto" : "none",
          transition: `opacity 1.1s ease ${panelOpen ? "0s" : ".45s"}`,
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            set({ mode: "invite" });
          }}
          style={{
            ...chooserBtn,
            color: "#F7F9FB",
            textShadow: "0 1px 14px rgba(10,16,26,.6)",
          }}
        >
          Member werden
        </button>
        {/* Ghost pill so sign-in is clearly visible against the dark base. */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            set({ mode: "member", username: "" });
          }}
          style={{
            ...chooserBtn,
            marginTop: 2,
            padding: "9px 20px",
            fontSize: 9,
            color: "#F7F9FB",
            opacity: 0.92,
            borderRadius: 999,
            border: "1px solid rgba(247,249,251,.32)",
            background: "rgba(247,249,251,.06)",
            textShadow: "0 1px 12px rgba(10,16,26,.55)",
            WebkitBackdropFilter: "blur(6px)",
            backdropFilter: "blur(6px)",
          }}
        >
          Anmelden
        </button>
      </div>

      {/* login panel */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "calc(64px + env(safe-area-inset-bottom))",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          padding: "0 16px",
          pointerEvents: ready && panelOpen ? "auto" : "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="glass-dark"
          style={{
            width: "min(360px,100%)",
            borderRadius: 30,
            padding: 18,
            opacity: ready && panelOpen ? 1 : 0,
            transform: ready && panelOpen ? "none" : "translateY(16px)",
            transition:
              "opacity .7s ease, transform .85s cubic-bezier(.22,1,.36,1)",
          }}
        >
          {modeMember && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                animation: "fade 1s ease both",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={kicker}>{modeBarber ? "Barber" : "Anmelden"}</span>
                <button
                  onClick={() => set({ mode: null, pwFor: null, pw: "" })}
                  style={closeBtn}
                >
                  Schliessen
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  height: 54,
                  padding: "0 6px 0 18px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.07)",
                  border: "1px solid rgba(255,255,255,.12)",
                }}
              >
                <input
                  value={st.username}
                  onChange={(e) =>
                    set(
                      modeBarber
                        ? { username: e.target.value }
                        : { username: e.target.value, pwFor: null, pw: "" },
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") a.loginUsername();
                  }}
                  autoFocus
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Username"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: "transparent",
                    border: 0,
                    color: "#F4F7FA",
                    fontFamily: "var(--font-urbanist)",
                    fontSize: 16,
                    letterSpacing: ".02em",
                  }}
                />
                {!st.pwFor && (
                  <button
                    onClick={() => a.loginUsername()}
                    style={{
                      flex: "none",
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      border: 0,
                      fontSize: 15,
                      transition: "all .8s cubic-bezier(.22,1,.36,1)",
                      background: usernameOk
                        ? "#F4F7FA"
                        : "rgba(255,255,255,.1)",
                      color: usernameOk ? "#0E141C" : "rgba(244,247,250,.45)",
                    }}
                  >
                    →
                  </button>
                )}
              </div>
              {st.pwFor && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    height: 54,
                    padding: "0 6px 0 18px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,.07)",
                    border: "1px solid rgba(255,255,255,.12)",
                    animation: "fade .8s ease both",
                  }}
                >
                  <input
                    key={st.pwFor}
                    value={st.pw}
                    onChange={(e) => {
                      if (st.pwFor === "barber")
                        return set({ pw: e.target.value });
                      // member PIN: digits only; the 6th digit signs in
                      const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                      set(
                        { pw: v },
                        v.length === 6 ? () => a.loginUsername() : undefined,
                      );
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") a.loginUsername();
                    }}
                    autoFocus={!modeBarber}
                    type="password"
                    inputMode={st.pwFor === "member" ? "numeric" : undefined}
                    autoComplete="current-password"
                    placeholder={
                      st.pwFor === "member" ? "PIN · 6 Ziffern" : "Passwort"
                    }
                    style={{
                      flex: 1,
                      minWidth: 0,
                      background: "transparent",
                      border: 0,
                      color: "#F4F7FA",
                      fontFamily: "var(--font-urbanist)",
                      fontSize: 16,
                      letterSpacing: ".02em",
                    }}
                  />
                  <button
                    onClick={() => a.loginUsername()}
                    style={{
                      flex: "none",
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      border: 0,
                      fontSize: 15,
                      transition: "all .8s cubic-bezier(.22,1,.36,1)",
                      background: st.pw ? "#F4F7FA" : "rgba(255,255,255,.1)",
                      color: st.pw ? "#0E141C" : "rgba(244,247,250,.45)",
                    }}
                  >
                    {st.busy ? "…" : "→"}
                  </button>
                </div>
              )}
            </div>
          )}

          {modeInvite && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                animation: "fade 1s ease both",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={kicker}>Persönlicher Code</span>
                <button
                  onClick={() => set({ mode: null, mStep: 0 })}
                  style={closeBtn}
                >
                  Schliessen
                </button>
              </div>
              <div
                style={{
                  position: "relative",
                  display: "grid",
                  gridTemplateColumns: "repeat(6,minmax(0,1fr))",
                  gap: 6,
                }}
              >
                {boxes(st.code, 6).map((b, k) => (
                  <div
                    key={k}
                    style={{
                      position: "relative",
                      height: 52,
                      borderRadius: 16,
                      display: "grid",
                      placeItems: "center",
                      fontFamily: "var(--font-geist-mono)",
                      fontSize: 16,
                      fontWeight: 300,
                      background: b.bg,
                      border: `1px solid ${b.border}`,
                      transition: "all .8s cubic-bezier(.22,1,.36,1)",
                    }}
                  >
                    <span>{b.ch}</span>
                    {b.active && (
                      <span
                        style={{
                          position: "absolute",
                          width: 1,
                          height: 16,
                          background: "#F4F7FA",
                          animation: "caret 1.1s steps(1) infinite",
                        }}
                      />
                    )}
                  </div>
                ))}
                <input
                  value={st.code}
                  onChange={(e) => a.onCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") a.redeem();
                  }}
                  autoFocus
                  maxLength={6}
                  autoComplete="off"
                  autoCapitalize="characters"
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 0,
                    width: "100%",
                    cursor: "text",
                    fontSize: 16,
                  }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  minHeight: 42,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "rgba(244,247,250,.75)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  {st.checking && (
                    <>
                      <span
                        data-loop
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          border: "1px solid rgba(255,255,255,.25)",
                          borderTopColor: "#fff",
                          animation: "spin 1s linear infinite",
                        }}
                      />
                      <span>Wird geprüft</span>
                    </>
                  )}
                  {st.inviteOk && (
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        animation: "fade 1s both",
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 9,
                          background: "#F4A69E",
                        }}
                      />
                      Einladung von {st.inviteBy}
                      {st.inviteFirst ? ` · für ${st.inviteFirst}` : ""}
                    </span>
                  )}
                  {codeInvalid && (
                    <span
                      style={{
                        color: "rgba(244,166,158,.85)",
                        animation: "fade 1s both",
                      }}
                    >
                      Code nicht gefunden
                    </span>
                  )}
                </div>
                <button
                  onClick={() => a.redeem()}
                  style={{
                    flex: "none",
                    width: 42,
                    height: 42,
                    borderRadius: "50%",
                    border: 0,
                    fontSize: 15,
                    transition: "all .9s cubic-bezier(.22,1,.36,1)",
                    background: st.inviteOk
                      ? "#F4F7FA"
                      : "rgba(255,255,255,.1)",
                    color: st.inviteOk ? "#0E141C" : "rgba(244,247,250,.45)",
                    pointerEvents: st.inviteOk ? "auto" : "none",
                  }}
                >
                  →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Code anfordern — sits cleanly BELOW the card, not inside it */}
        {modeInvite && (
          <a
            href={WA_CODE_REQUEST}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              color: "#F7F9FB",
              textShadow: "0 1px 14px rgba(10,16,26,.55)",
              fontFamily: "var(--font-geist-mono)",
              fontSize: 9,
              letterSpacing: ".22em",
              textTransform: "uppercase",
              textDecoration: "none",
              padding: "14px 16px",
              margin: "-12px 0",
              opacity: ready && panelOpen ? 0.78 : 0,
              transition: "opacity 1.6s ease .2s",
            }}
          >
            Keinen Code? Anfordern →
          </a>
        )}
      </div>

      {/* bottom bar */}
      <div
        style={{
          position: "absolute",
          bottom: "calc(14px + env(safe-area-inset-bottom))",
          left: "clamp(20px,4vw,48px)",
          right: "clamp(20px,4vw,48px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "var(--font-geist-mono)",
          fontSize: 9,
          letterSpacing: ".26em",
          textTransform: "uppercase",
          color: "#0E141C",
          opacity: chromeO,
          transition: "opacity 2.4s ease",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            ov.openCuts();
          }}
          style={{
            flex: "1 1 0",
            justifyContent: "flex-start",
            border: 0,
            background: "transparent",
            color: "inherit",
            font: "inherit",
            letterSpacing: "inherit",
            textTransform: "inherit",
            padding: "12px 0",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ width: 18, height: 1, background: "currentColor" }} />
          Cuts
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            ov.openLm();
          }}
          style={{
            flex: "none",
            border: 0,
            background: "transparent",
            color: "#F7F9FB",
            textShadow: "0 1px 14px rgba(10,16,26,.6)",
            opacity: st.peek ? 1 : 0,
            transform: st.peek ? "none" : "translateY(22px)",
            filter: st.peek ? "blur(0px)" : "blur(6px)",
            pointerEvents: st.peek ? "auto" : "none",
            transition:
              "opacity .9s ease,transform 1.1s cubic-bezier(.22,1,.36,1),filter .9s ease",
            font: "inherit",
            letterSpacing: "inherit",
            textTransform: "inherit",
            padding: "12px 4px",
          }}
        >
          Legal
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            ov.openSalon();
          }}
          style={{
            flex: "1 1 0",
            justifyContent: "flex-end",
            border: 0,
            background: "transparent",
            color: "inherit",
            font: "inherit",
            letterSpacing: "inherit",
            textTransform: "inherit",
            padding: "12px 0",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          Salon
          <span style={{ width: 18, height: 1, background: "currentColor" }} />
        </button>
      </div>
    </div>
  );
}

const chooserBtn: React.CSSProperties = {
  border: 0,
  background: "transparent",
  color: "inherit",
  font: "inherit",
  letterSpacing: "inherit",
  textTransform: "inherit",
  padding: "14px 0",
  opacity: 0.95,
};
const kicker: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono)",
  fontSize: 9,
  letterSpacing: ".22em",
  textTransform: "uppercase",
  color: "rgba(244,247,250,.62)",
};
// Generous invisible hit area (≈44px) without shifting the visual layout.
const closeBtn: React.CSSProperties = {
  border: 0,
  background: "transparent",
  color: "rgba(244,247,250,.6)",
  fontSize: 12,
  padding: "14px 10px",
  margin: "-14px -10px",
};
