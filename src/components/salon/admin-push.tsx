"use client";

import { useEffect, useState } from "react";
import { useSalon } from "./store";
import {
  pushKeyAction,
  pushSubscribeAction,
  pushUnsubscribeAction,
  pushTestAction,
} from "@/lib/actions";

const b64ToBytes = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

type St = "check" | "unsupported" | "install" | "denied" | "off" | "on";

/**
 * Admin → Zeiten: Laurin's push switch. New bookings, cancellations and moves
 * arrive as iPhone notifications. iOS only allows web push for the home-screen
 * app, so in Safari it says how to get there first.
 */
export function PushRow({ delay = ".08s" }: { delay?: string }) {
  const { say } = useSalon();
  const [st, setSt] = useState<St>("check");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      const ok = "serviceWorker" in navigator && "PushManager" in window;
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as { standalone?: boolean }).standalone === true;
      if (!ok)
        return live && setSt(ios && !standalone ? "install" : "unsupported");
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });
        const sub = await reg.pushManager.getSubscription();
        if (!live) return;
        if (sub) {
          // keep the server copy fresh (endpoint may have rotated)
          pushSubscribeAction(sub.toJSON() as never).catch(() => {});
          setSt("on");
        } else setSt(Notification.permission === "denied" ? "denied" : "off");
      } catch {
        if (live) setSt("unsupported");
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setSt(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const key = await pushKeyAction();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: b64ToBytes(key),
      });
      const r = await pushSubscribeAction(sub.toJSON() as never);
      if (!r.ok) throw new Error();
      setSt("on");
      await pushTestAction();
    } catch {
      say("Mitteilungen konnten nicht aktiviert werden");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await pushUnsubscribeAction(sub.endpoint);
        await sub.unsubscribe();
      }
      setSt("off");
    } catch {
      say("Ausschalten fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  const on = st === "on";
  const sub =
    st === "check"
      ? "Wird geprüft …"
      : on
        ? "Buchungen, Absagen & Verschiebungen aufs iPhone"
        : st === "install"
          ? "Teilen → „Zum Home-Bildschirm“, dann hier aktivieren"
          : st === "denied"
            ? "Blockiert · in den iPhone-Einstellungen erlauben"
            : st === "unsupported"
              ? "Auf diesem Gerät nicht möglich"
              : "Neue Buchungen sofort aufs iPhone";
  const canToggle = st === "on" || st === "off";

  return (
    <div
      className="glass-dark"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        borderRadius: 26,
        padding: "16px 18px",
        animation: `up 1.4s cubic-bezier(.22,1,.36,1) ${delay} both`,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}
      >
        <span
          style={{
            flex: "none",
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: on ? "#7FD4A6" : "#9AA6B2",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            minWidth: 0,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 500 }}>Mitteilungen</span>
          <span
            style={{
              fontSize: 11.5,
              color: "rgba(244,247,250,.62)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {sub}
          </span>
        </div>
      </div>
      {canToggle && (
        <button
          onClick={on ? disable : enable}
          disabled={busy}
          style={{
            flex: "none",
            border: 0,
            fontFamily: "var(--font-geist-mono)",
            fontSize: 8.5,
            letterSpacing: ".18em",
            padding: "6px 11px",
            borderRadius: 999,
            background: on ? "rgba(255,255,255,.1)" : "#F4F7FA",
            color: on ? "rgba(244,247,250,.75)" : "#0E141C",
            opacity: busy ? 0.5 : 1,
          }}
        >
          {busy ? "…" : on ? "AUS" : "AKTIVIEREN"}
        </button>
      )}
    </div>
  );
}
