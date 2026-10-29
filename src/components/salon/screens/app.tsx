"use client";

import { useSalon, type Tab } from "../store";
import { useSalonActions } from "../actions";
import { Icon } from "../icons";
import { HomeTab } from "./tabs/home";
import { BookTab } from "./tabs/book";
import { CardTab } from "./tabs/card";
import { CircleTab } from "./tabs/circle";

const NAV: { k: Tab; label: string }[] = [
  { k: "home", label: "Start" },
  { k: "book", label: "Buchen" },
  { k: "card", label: "Karte" },
  { k: "circle", label: "Circle" },
];

export function TabBar() {
  const { state } = useSalon();
  const a = useSalonActions();
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: "calc(16px + env(safe-area-inset-bottom))",
        zIndex: 20,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <nav
        className="glass-dark"
        style={{
          pointerEvents: "auto",
          display: "flex",
          gap: 4,
          padding: 6,
          borderRadius: 999,
          animation: "up 1.8s cubic-bezier(.22,1,.36,1) .4s both",
        }}
      >
        {NAV.map((n) => {
          const active = state.tab === n.k;
          return (
            <button
              key={n.k}
              onClick={() => a.goTab(n.k)}
              style={{
                height: 50,
                // shrinks on very narrow phones (320px) so the bar never overflows
                minWidth: "clamp(42px, 12vw, 50px)",
                padding: "0 clamp(10px, 3.6vw, 16px)",
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: active ? 9 : 0,
                border: 0,
                background: active ? "#F4F7FA" : "transparent",
                color: active ? "#0E141C" : "rgba(244,247,250,.78)",
                transition: "all 1s cubic-bezier(.22,1,.36,1)",
              }}
            >
              <Icon k={n.k} />
              <span
                style={{
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  fontSize: 12,
                  fontWeight: 600,
                  maxWidth: active ? 96 : 0,
                  opacity: active ? 1 : 0,
                  transition: "all 1s cubic-bezier(.22,1,.36,1)",
                }}
              >
                {n.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/** Wordmark + profile button — part of the shell, so the profile is one tap
 *  away on every tab and the header never re-animates on a tab switch. */
function AppHeader() {
  const { state, set } = useSalon();
  const U = state.user;
  const initials = U ? (U.first[0] + (U.last[0] || "")).toUpperCase() : "";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "clamp(22px,4.5vh,46px)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-geist-mono)",
          fontSize: 9.5,
          letterSpacing: ".32em",
          textTransform: "uppercase",
          animation: "fade 1.6s ease both",
        }}
      >
        salon 323
      </span>
      <button
        onClick={() => set({ sheet: { type: "profile" } })}
        aria-label="Profil"
        className="glass-light"
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: ".02em",
          border: 0,
          color: "#0E141C",
          animation: "up 1.4s cubic-bezier(.22,1,.36,1) both",
        }}
      >
        {initials}
      </button>
    </div>
  );
}

export function AppScreen() {
  const { state } = useSalon();
  return (
    <div
      style={{
        position: "relative",
        maxWidth: 1040,
        margin: "0 auto",
        padding:
          "calc(16px + env(safe-area-inset-top)) clamp(16px,4vw,40px) calc(130px + env(safe-area-inset-bottom))",
      }}
    >
      <AppHeader />
      {/* keyed on the tab so switching re-runs a clean crossfade-up entrance */}
      <div
        key={state.tab}
        style={{ animation: "tabIn .62s cubic-bezier(.22,1,.36,1) both" }}
      >
        {state.tab === "home" && <HomeTab />}
        {state.tab === "book" && <BookTab />}
        {state.tab === "card" && <CardTab />}
        {state.tab === "circle" && <CircleTab />}
      </div>
      <TabBar />
    </div>
  );
}
