"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSalon } from "./store";
import { verses, type ServiceKey } from "@/lib/data";
import {
  loginMemberAction,
  loginBarberAction,
  validateInviteAction,
  redeemOnboardAction,
  usernameAvailableAction,
  logoutAction,
} from "@/lib/actions";
import { bundleToState } from "@/lib/member-view";

/** Auth + navigation actions, ported 1:1 from the prototype Component methods. */
export function useSalonActions() {
  const { state, set, go, say, startIntro } = useSalon();
  const sref = useRef(state);
  useEffect(() => {
    sref.current = state;
  });
  const timers = useRef<{
    sms?: ReturnType<typeof setTimeout>;
    code?: ReturnType<typeof setTimeout>;
    welcome?: ReturnType<typeof setTimeout>;
  }>({});

  useEffect(
    () => () =>
      Object.values(timers.current).forEach((t) => t && clearTimeout(t)),
    [],
  );

  const toApp = useCallback(() => {
    if (sref.current.screen !== "welcome" || sref.current.veil) return;
    if (timers.current.welcome) clearTimeout(timers.current.welcome);
    go(() => set({ screen: "app", tab: "home" }));
  }, [go, set]);

  const goWelcome = useCallback(() => {
    go(() => {
      // Fresh random verse on every welcome, so it isn't the same one each login.
      const verse = Math.floor(Math.random() * verses.length);
      const words = verses[verse].t.split(" ").length;
      set({ screen: "welcome", verse });
      if (timers.current.welcome) clearTimeout(timers.current.welcome);
      timers.current.welcome = setTimeout(
        () => toApp(),
        (2.6 + words * 0.14 + 5) * 1000,
      );
    });
  }, [go, set, toApp]);

  // Returning member logs in with just a username — no password yet. The
  // server verifies the username really exists; an unknown name is rejected.
  // The barber's username asks for the password next and opens the portal.
  const loginUsername = useCallback(() => {
    const st = sref.current;
    const u = st.username.trim();
    if (!u || st.busy) return;
    set({ busy: true });
    if (st.barberPw) {
      if (!st.pw) return set({ busy: false });
      loginBarberAction(u, st.pw).then((res) => {
        if (res.ok) {
          set({ busy: false, pw: "" });
          go(() =>
            set({
              screen: "admin",
              aTab: "today",
              barberAuthed: true,
              barberPw: false,
              mode: null,
              username: "",
            }),
          );
        } else {
          set({ busy: false, pw: "" });
          say("Passwort falsch");
        }
      });
      return;
    }
    loginMemberAction(u).then((res) => {
      if (res.ok) {
        set({ busy: false, ...bundleToState(res.bundle, false) });
        goWelcome();
      } else if (res.error === "use_barber_login") {
        set({ busy: false, barberPw: true, pw: "" });
      } else {
        set({ busy: false });
        say("Diesen Username gibt es nicht");
      }
    });
  }, [set, go, goWelcome, say]);

  const onCode = useCallback(
    (value: string) => {
      const v = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 6);
      set({
        code: v,
        inviteOk: false,
        inviteFirst: "",
        inviteBy: "",
        checking: v.length === 6,
      });
      if (v.length === 6)
        // The server checks the code against the invites table (open + valid).
        validateInviteAction(v).then((match) => {
          if (sref.current.code !== v) return; // user kept typing — ignore stale
          set({
            checking: false,
            inviteOk: !!match,
            inviteFirst: match?.firstName ?? "",
            inviteBy: match?.inviterName ?? "",
          });
        });
    },
    [set],
  );

  const redeem = useCallback(() => {
    if (!sref.current.inviteOk || !sref.current.inviteFirst) return;
    // The inviter set the first name with the code — it's fixed for the invitee.
    go(() =>
      set({
        screen: "onboard",
        ob: 0,
        first: sref.current.inviteFirst,
        last: "",
        username: "",
        phone: "",
        email: "",
        cardSel: 0,
      }),
    );
  }, [go, set]);

  // Ultra-clean onboarding: 0 name → 1 username → 2 phone → 3 card.
  const obNext = useCallback(() => {
    const st = sref.current;
    if (st.ob === 0 && st.first.trim()) set({ ob: 1 });
    else if (st.ob === 1 && st.username.trim()) {
      // A taken username is caught here, not only at the very end.
      if (st.busy) return;
      set({ busy: true });
      const u = st.username.trim();
      usernameAvailableAction(st.code, u).then((r) => {
        set({ busy: false });
        if (sref.current.ob !== 1 || sref.current.username.trim() !== u) return;
        if (r === "ok") set({ ob: 2, unameMsg: "" });
        else
          set({
            unameMsg:
              r === "taken"
                ? "@" + u.toLowerCase() + " ist schon vergeben"
                : "Nur a–z, 0–9 und _ · 2–20 Zeichen",
          });
      });
    } else if (st.ob === 2 && st.phone.replace(/\D/g, "").length >= 6)
      set({ ob: 3 });
    else if (st.ob === 3 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(st.email.trim()))
      set({ ob: 4 });
    else if (st.ob === 4) {
      if (st.busy) return;
      set({ busy: true });
      // Atomic on the server: redeem the invite + create the member + log in.
      redeemOnboardAction({
        code: st.code,
        last: st.last.trim(),
        username: st.username.trim(),
        phone: st.phone,
        email: st.email.trim(),
        card: st.cardSel,
      }).then((res) => {
        if (res.ok) {
          set({
            busy: false,
            ...bundleToState(res.bundle, true),
            appt: null,
            history: [],
            lastCode: null,
          });
          goWelcome();
        } else {
          set({ busy: false });
          if (
            res.error === "username_taken" ||
            res.error === "username_invalid"
          ) {
            // taken in the meantime (race) — back to the username step
            set({
              ob: 1,
              unameMsg:
                res.error === "username_taken"
                  ? "Gerade vergeben worden – wähl einen anderen"
                  : "Nur a–z, 0–9 und _ · 2–20 Zeichen",
            });
          } else if (res.error === "phone_invalid") {
            set({ ob: 2 });
            say("Telefonnummer prüfen");
          } else if (res.error === "invite_invalid") {
            say("Code ungültig oder abgelaufen");
          } else {
            say("Etwas ging schief – bitte nochmal");
          }
        }
      });
    }
  }, [set, goWelcome, say]);

  const obBack = useCallback(() => {
    if (sref.current.ob === 0)
      go(() => set({ screen: "login", mode: "invite", intro: 3 }));
    else set((p) => ({ ob: p.ob - 1 }));
  }, [go, set]);

  const logout = useCallback(() => {
    logoutAction(); // clear the server session cookie
    // The profile sheet closes at once, before the veil — never lingers.
    set({ sheet: null });
    go(() => {
      set({
        screen: "login",
        mode: null,
        mStep: 0,
        sms: "",
        phone: "",
        code: "",
        username: "",
        pw: "",
        barberPw: false,
        inviteOk: false,
        checking: false,
        flipped: false,
        barberAuthed: false,
        tab: "home",
        // drop every bit of the member's data from memory
        user: null,
        invites: null,
        appt: null,
        history: [],
        booked: null,
        lastCode: null,
      });
      startIntro();
    });
  }, [go, set, startIntro]);

  const toAdmin = useCallback(() => {
    go(() => set({ screen: "admin", aTab: "today" }));
  }, [go, set]);

  const goTab = useCallback(
    (t: "home" | "book" | "card" | "circle") => {
      const st = sref.current;
      const patch: Record<string, unknown> = { tab: t, cancelling: false };
      if (t === "book" && !st.rescheduling) {
        patch.sel = [...st.template];
        patch.time = null;
      }
      if (t !== "book") patch.rescheduling = false;
      set(patch);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [set],
  );

  const toggleService = useCallback(
    (k: ServiceKey) =>
      set((p) => ({
        sel: p.sel.includes(k) ? p.sel.filter((x) => x !== k) : [...p.sel, k],
      })),
    [set],
  );

  const toggleTemplate = useCallback(
    (k: ServiceKey) =>
      set((p) => ({
        template: p.template.includes(k)
          ? p.template.filter((x) => x !== k)
          : [...p.template, k],
      })),
    [set],
  );

  return {
    goWelcome,
    toApp,
    loginUsername,
    onCode,
    redeem,
    obNext,
    obBack,
    logout,
    toAdmin,
    goTab,
    toggleService,
    toggleTemplate,
    say,
    go,
    set,
  };
}
