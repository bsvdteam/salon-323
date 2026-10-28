"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSalon } from "./store";
import { lucaState, verses, type ServiceKey } from "@/lib/data";
import { findInviteCode } from "@/config/access";

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
      const words = verses[sref.current.verse].t.split(" ").length;
      set({ screen: "welcome" });
      if (timers.current.welcome) clearTimeout(timers.current.welcome);
      timers.current.welcome = setTimeout(
        () => toApp(),
        (2.6 + words * 0.14 + 5) * 1000,
      );
    });
  }, [go, set, toApp]);

  // Returning member logs in with just a username — no password yet.
  const loginUsername = useCallback(() => {
    const u = sref.current.username.trim();
    if (!u) return;
    const base = lucaState();
    set({ ...base, user: { ...base.user, username: u } });
    goWelcome();
  }, [set, goWelcome]);

  const onCode = useCallback(
    (value: string) => {
      const v = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 6);
      if (timers.current.code) clearTimeout(timers.current.code);
      set({ code: v, inviteOk: false, checking: v.length === 6 });
      if (v.length === 6)
        timers.current.code = setTimeout(
          // Valid only if the code is in the access config (src/config/access.ts).
          () => set({ checking: false, inviteOk: !!findInviteCode(v) }),
          1400,
        );
    },
    [set],
  );

  const redeem = useCallback(() => {
    const match = findInviteCode(sref.current.code);
    if (!sref.current.inviteOk || !match) return;
    // The inviter set the first name with the code — it's fixed for the invitee.
    go(() =>
      set({
        screen: "onboard",
        ob: 0,
        first: match.firstName,
        last: "",
        username: "",
        phone: "",
        cardSel: 0,
      }),
    );
  }, [go, set]);

  // Ultra-clean onboarding: 0 name → 1 username → 2 phone → 3 card.
  const obNext = useCallback(() => {
    const st = sref.current;
    if (st.ob === 0 && st.first.trim()) set({ ob: 1 });
    else if (st.ob === 1 && st.username.trim()) set({ ob: 2 });
    else if (st.ob === 2 && st.phone.replace(/\D/g, "").length >= 6)
      set({ ob: 3 });
    else if (st.ob === 3 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(st.email.trim()))
      set({ ob: 4 });
    else if (st.ob === 4) {
      set({
        user: {
          first: st.first.trim(),
          last: st.last.trim(),
          username: st.username.trim(),
          cuts: 0,
          since: [9, 2026],
          no: "0048",
          phone: st.phone,
          email: st.email.trim(),
          card: st.cardSel,
          isNew: true,
        },
        invites: [],
        appt: null,
        history: [],
        lastCode: null,
      });
      goWelcome();
    }
  }, [set, goWelcome]);

  const obBack = useCallback(() => {
    if (sref.current.ob === 0)
      go(() => set({ screen: "login", mode: "invite", intro: 3 }));
    else set((p) => ({ ob: p.ob - 1 }));
  }, [go, set]);

  const logout = useCallback(() => {
    go(() => {
      set({
        screen: "login",
        mode: null,
        mStep: 0,
        sms: "",
        phone: "",
        code: "",
        inviteOk: false,
        checking: false,
        flipped: false,
        ...lucaState(),
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
