"use client";

import { useSalon } from "./store";

/** Bottom sheet chrome: backdrop, glass panel, drag handle. */
export function SheetFrame({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose?: () => void; // instead of just closing (e.g. to note a "Später")
}) {
  const { set } = useSalon();
  const close = onClose ?? (() => set({ sheet: null }));
  return (
    <>
      <div
        onClick={close}
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
            onClick={close}
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
