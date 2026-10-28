"use client";

import { useSalon } from "../store";
import { useSalonActions } from "../actions";
import { cardStyles, tiers } from "@/lib/data";

const kick: React.CSSProperties = {
  fontFamily: "var(--font-geist-mono)",
  fontSize: 9,
  letterSpacing: ".22em",
  textTransform: "uppercase",
  color: "rgba(244,247,250,.62)",
};
const field: React.CSSProperties = {
  height: 54,
  padding: "0 20px",
  borderRadius: 999,
  background: "rgba(255,255,255,.07)",
  border: "1px solid rgba(255,255,255,.12)",
  color: "#F4F7FA",
  fontFamily: "var(--font-urbanist)",
  fontSize: 16,
};
const h2: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 300,
  letterSpacing: "-.02em",
  lineHeight: 1.15,
};
const lead: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.6,
  color: "rgba(244,247,250,.7)",
  textWrap: "pretty",
};

/** Live preview of the chosen member card. */
function CardPreview({
  style,
  first,
  last,
  username,
}: {
  style: number;
  first: string;
  last: string;
  username: string;
}) {
  const c = cardStyles[style] ?? cardStyles[0];
  const T = tiers[0];
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1.586/1",
        borderRadius: 20,
        overflow: "hidden",
        color: c.text,
        boxShadow:
          "0 30px 60px -30px rgba(10,20,40,.6),inset 0 0 0 1px rgba(255,255,255,.22)",
        animation: "cardMorph 1.2s cubic-bezier(.22,1,.36,1) both",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "-6%",
          backgroundImage: c.front,
          backgroundSize: "cover",
          backgroundPosition: "48% 42%",
        }}
      />
      <div style={{ position: "absolute", inset: 0, background: c.overlay }} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "18px 20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 9,
                letterSpacing: ".38em",
              }}
            >
              SALON 323
            </span>
            <span
              style={{
                fontFamily: "var(--font-geist-mono)",
                fontSize: 7.5,
                letterSpacing: ".24em",
                opacity: 0.7,
              }}
            >
              MEMBER
            </span>
          </div>
          <span
            style={{ fontSize: 20, fontWeight: 200, letterSpacing: ".06em" }}
          >
            {T.r}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 17, fontWeight: 400 }}>
            {`${first} ${last}`.trim() || "Dein Name"}
          </span>
          <span
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 8.5,
              letterSpacing: ".18em",
              opacity: 0.75,
            }}
          >
            @{username || "username"}
          </span>
        </div>
      </div>
    </div>
  );
}

export function OnboardScreen() {
  const { state, set } = useSalon();
  const a = useSalonActions();
  const st = state;
  const phoneOk = st.phone.replace(/\D/g, "").length >= 6;
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(st.email.trim());
  const obOk =
    st.ob === 0
      ? !!st.first.trim()
      : st.ob === 1
        ? !!st.username.trim()
        : st.ob === 2
          ? phoneOk
          : st.ob === 3
            ? emailOk
            : true;
  const obBtnLabel = st.ob === 4 ? "Mitglied werden" : "Weiter";

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding:
          "calc(64px + env(safe-area-inset-top)) 16px calc(40px + env(safe-area-inset-bottom))",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "calc(14px + env(safe-area-inset-top))",
          height: 44,
          lineHeight: "44px",
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "var(--font-geist-mono)",
          fontSize: 9,
          letterSpacing: ".26em",
          textTransform: "uppercase",
          color: "#fff",
          mixBlendMode: "difference",
        }}
      >
        salon 323 · Einladung
      </div>
      <div
        className="glass-dark"
        style={{
          width: "min(380px,100%)",
          borderRadius: 38,
          padding: 22,
          animation: "up 1.6s cubic-bezier(.22,1,.36,1) both",
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => a.obBack()}
            style={{
              border: 0,
              background: "transparent",
              color: "rgba(244,247,250,.65)",
              fontSize: 12,
              padding: "6px 0",
            }}
          >
            ← Zurück
          </button>
          <div style={{ display: "flex", gap: 5 }}>
            {[0, 1, 2, 3, 4].map((k) => (
              <span
                key={k}
                style={{
                  width: 18,
                  height: 2,
                  borderRadius: 2,
                  background: k <= st.ob ? "#F4F7FA" : "rgba(255,255,255,.2)",
                  transition: "background 1.2s cubic-bezier(.22,1,.36,1)",
                }}
              />
            ))}
          </div>
        </div>

        {st.ob === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
              animation: "fade 1s ease both",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={kick}>Von {st.inviteBy || "Salon 323"}</span>
              <span style={h2}>Willkommen, {st.first.trim() || "Gast"}.</span>
              <span style={lead}>
                Deinen Vornamen hat {st.inviteBy || "der Salon"} mit dem Code
                festgelegt. Ergänze deinen Nachnamen.
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  ...field,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  color: "rgba(244,247,250,.55)",
                }}
              >
                <span style={{ color: "#F4F7FA" }}>{st.first}</span>
                <span style={{ fontSize: 11, letterSpacing: ".04em" }}>
                  Vom Code · fix
                </span>
              </div>
              <input
                value={st.last}
                onChange={(e) => set({ last: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") a.obNext();
                }}
                autoFocus
                placeholder="Nachname"
                style={field}
              />
            </div>
          </div>
        )}

        {st.ob === 1 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
              animation: "fade 1s ease both",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={kick}>Dein Username</span>
              <span style={h2}>Wähl dir einen Namen.</span>
              <span style={lead}>
                Damit meldest du dich später an. Du kannst ihn im Profil
                jederzeit ändern.
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                ...field,
              }}
            >
              <span style={{ color: "rgba(244,247,250,.4)", fontSize: 16 }}>
                @
              </span>
              <input
                value={st.username}
                onChange={(e) =>
                  set({
                    username: e.target.value.replace(/\s/g, "").toLowerCase(),
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") a.obNext();
                }}
                autoFocus
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="username"
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: "100%",
                  background: "transparent",
                  border: 0,
                  color: "#F4F7FA",
                  fontFamily: "var(--font-urbanist)",
                  fontSize: 16,
                }}
              />
            </div>
          </div>
        )}

        {st.ob === 2 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
              animation: "fade 1s ease both",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={kick}>Telefon</span>
              <span style={h2}>Deine Nummer.</span>
              <span style={lead}>
                Für die Terminerinnerung. Keine Werbung, versprochen.
              </span>
            </div>
            <input
              value={st.phone}
              onChange={(e) => set({ phone: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") a.obNext();
              }}
              autoFocus
              type="tel"
              placeholder="+41 79 000 00 00"
              style={field}
            />
          </div>
        )}

        {st.ob === 3 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 22,
              animation: "fade 1s ease both",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={kick}>E-Mail</span>
              <span style={h2}>Deine E-Mail.</span>
              <span style={lead}>
                Für die Terminbestätigung – und falls sich etwas ändert.
              </span>
            </div>
            <input
              value={st.email}
              onChange={(e) => set({ email: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") a.obNext();
              }}
              autoFocus
              type="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="du@mail.ch"
              style={field}
            />
          </div>
        )}

        {st.ob === 4 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              animation: "fade 1s ease both",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={kick}>Deine Karte</span>
              <span style={h2}>Wähl dein Design.</span>
            </div>
            <CardPreview
              style={st.cardSel}
              first={st.first}
              last={st.last}
              username={st.username}
            />
            <div style={{ display: "flex", gap: 8 }}>
              {cardStyles.map((c, i) => {
                const on = st.cardSel === i;
                return (
                  <button
                    key={i}
                    onClick={() => set({ cardSel: i })}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      alignItems: "center",
                      border: 0,
                      background: "transparent",
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        width: "100%",
                        aspectRatio: "1.586/1",
                        borderRadius: 10,
                        backgroundImage: c.front,
                        backgroundSize: "cover",
                        backgroundPosition: "50% 45%",
                        boxShadow: on
                          ? "0 0 0 2px #F4F7FA, 0 8px 20px -10px rgba(0,0,0,.6)"
                          : "inset 0 0 0 1px rgba(255,255,255,.18)",
                        transition:
                          "box-shadow .5s, transform .5s cubic-bezier(.22,1,.36,1)",
                        transform: on ? "translateY(-2px)" : "none",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        color: on ? "#F4F7FA" : "rgba(244,247,250,.5)",
                        transition: "color .5s",
                      }}
                    >
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={() => a.obNext()}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            height: 54,
            border: 0,
            borderRadius: 999,
            padding: "0 22px",
            fontSize: 13,
            fontWeight: 600,
            transition: "all .9s cubic-bezier(.22,1,.36,1)",
            background: obOk ? "#F4F7FA" : "rgba(255,255,255,.1)",
            color: obOk ? "#0E141C" : "rgba(244,247,250,.45)",
            pointerEvents: obOk ? "auto" : "none",
          }}
        >
          <span>{obBtnLabel}</span>
          <span style={{ fontWeight: 300 }}>→</span>
        </button>
      </div>
    </div>
  );
}
