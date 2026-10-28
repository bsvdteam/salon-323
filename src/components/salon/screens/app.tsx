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
                minWidth: 50,
                padding: "0 16px",
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
      {state.tab === "home" && <HomeTab />}
      {state.tab === "book" && <BookTab />}
      {state.tab === "card" && <CardTab />}
      {state.tab === "circle" && <CircleTab />}
      <TabBar />
    </div>
  );
}
