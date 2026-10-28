"use client";

import { useEffect } from "react";
import { SalonProvider, useSalon, type StartConfig } from "./store";
import { Background, Veil, Toast } from "./background";
import { Overlays } from "./overlays";
import { Sheet } from "./sheet";
import { BookedOverlay } from "./booked-overlay";
import { LoginScreen } from "./screens/login";
import { WelcomeScreen } from "./screens/welcome";
import { OnboardScreen } from "./screens/onboard";
import { AppScreen } from "./screens/app";
import { AdminScreen } from "./screens/admin";
import { BarberLogin } from "./screens/barber-login";
import { sessionAction } from "@/lib/actions";

/** /barber shows nothing until a barber signs in with username + password. A
 *  valid barber session (cookie) skips the form. */
function BarberGate() {
  const { state, set } = useSalon();
  useEffect(() => {
    if (state.barberAuthed) return;
    sessionAction().then((s) => {
      if (s?.role === "barber") set({ barberAuthed: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state.barberAuthed ? <AdminScreen /> : <BarberLogin />;
}

function Screens() {
  const { state } = useSalon();
  return (
    <div
      style={{
        position: "relative",
        zIndex: 1,
        minHeight: "100dvh",
        color: "#0E141C",
        fontFamily: "var(--font-urbanist)",
        fontWeight: 400,
      }}
    >
      {state.screen === "login" && <LoginScreen />}
      {state.screen === "onboard" && <OnboardScreen />}
      {state.screen === "welcome" && <WelcomeScreen />}
      {state.screen === "app" && <AppScreen />}
      {state.screen === "admin" && <BarberGate />}
    </div>
  );
}

/** Keep the address bar in sync with the current screen/overlay (one-way). */
function UrlSync() {
  const { state: s } = useSalon();
  let path = "/";
  if (s.salOn) path = "/salon";
  else if (s.cOn) path = "/cuts";
  else if (s.lmOn || s.lOn) path = "/legal";
  else if (s.story) path = "/story";
  else if (s.screen === "admin") path = "/barber";
  else if (s.screen === "app") path = "/" + s.tab;
  else if (s.screen === "onboard") path = "/onboarding";
  else if (s.screen === "welcome") path = "/welcome";
  else if (s.screen === "login")
    path =
      s.mode === "member" ? "/login" : s.mode === "invite" ? "/invite" : "/";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.pathname !== path) {
      window.history.replaceState(
        window.history.state,
        "",
        path + window.location.search,
      );
    }
  }, [path]);
  return null;
}

export function SalonApp({ start }: { start?: StartConfig }) {
  return (
    <SalonProvider start={start}>
      <Background />
      <Screens />
      <Overlays />
      <Sheet />
      <BookedOverlay />
      <Veil />
      <Toast />
      <UrlSync />
    </SalonProvider>
  );
}
