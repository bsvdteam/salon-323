"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  lucaState,
  verses,
  type Appt,
  type Invite,
  type SalonUser,
  type ServiceKey,
} from "@/lib/data";

/* Design tweaks (prototype props). showBarber is enabled so the barber portal
   is testable on localhost; in production it only appears with a barber session. */
export const TWEAKS = {
  showBarber: true,
  cutsView: "compare" as "compare" | "detail" | "index",
  payOnline: false,
};

export type DayHours = { on: boolean; s: number; e: number };
export type Absence = {
  id: number;
  a: number;
  b: number;
  why: string;
  src: "HIER" | "CALENDLY";
};
export type ClientRecord = {
  n: string;
  tier: string;
  cuts: number;
  via: string;
  last: string;
  since: [number, number];
  tpl: string;
  note: string;
};

export type Screen = "login" | "onboard" | "welcome" | "app" | "admin";
export type Tab = "home" | "book" | "card" | "circle";
export type AdminTab = "today" | "members" | "revenue" | "avail";
export type Mode = null | "member" | "invite";
export type OverlayKind = "salon" | "cuts" | "legal" | "story";
/** Initial state for a deep-linked route (see src/app/* pages). */
export type StartConfig = {
  screen: Screen;
  mode?: Mode;
  tab?: Tab;
  overlay?: OverlayKind;
};

export interface SalonState {
  screen: Screen;
  intro: number; // 0..3
  mode: Mode;
  mStep: number;
  phone: string;
  email: string;
  sms: string;
  code: string;
  checking: boolean;
  inviteOk: boolean;
  veil: boolean;
  ob: number;
  first: string;
  last: string;
  username: string;
  cardSel: number;
  resent: boolean;
  verse: number;
  peek: boolean;

  user: SalonUser | null;
  invites: Invite[] | null;
  appt: Appt | null;
  history: { off: number; s: ServiceKey[] }[];

  tab: Tab;
  sel: ServiceKey[];
  template: ServiceKey[];
  day: number;
  time: string | null;
  rescheduling: boolean;
  cancelling: boolean;
  booked: { pay: string; time: string; when: string; what: string } | null;
  flipped: boolean;
  cut: string;

  // circle
  newInv: string;
  lastCode: { code: string; name: string } | null;
  copied: boolean;
  circleSel: string | null;

  // booking
  slideDone: boolean;
  creditUsed: number;
  pay: string;
  remind: boolean;

  // bottom sheet (profile / client)
  sheet: { type: "profile" } | { type: "client"; m: ClientRecord } | null;

  // story
  story: boolean;
  sVis: boolean;
  sIdx: number;
  sReady: boolean;

  // admin
  aTab: AdminTab;
  q: string;
  tierF: string;
  week: Record<number, DayHours>;
  pause: { s: number; e: number };
  bufferMin: number; // Puffer zwischen Terminen (min)
  leadHours: number; // Mindest-Vorlaufzeit bis ein Termin buchbar ist (h)
  ovr: Record<number, DayHours>;
  dOpen: number | null;
  wOpen: number | null;
  abs: Absence[];
  calOn: boolean;
  syncing: boolean;
  syncAgo: string;
  absForm: boolean;
  absA: number | null;
  absB: number | null;
  absWhy: string;
  done: Record<string, boolean>;
  started: Record<string, boolean>;

  // overlays
  salOn: boolean;
  salVis: boolean;
  cOn: boolean;
  cVis: boolean;
  cIdx: number;
  cMode: "compare" | "detail" | "index";
  cDrag: boolean;
  dragged: boolean;
  dHov: number;
  iHov: number;
  lmOn: boolean;
  lmVis: boolean;
  lmHov: number;
  lOn: boolean;
  lVis: boolean;
  lDoc: string;
  lSec: number;
  lSwap: boolean;
  plain: boolean;
  tSwap: boolean;
  mailCopied: boolean;

  toast: string;
  toastOn: boolean;
}

function initialState(start?: StartConfig): SalonState {
  const ov = start?.overlay;
  return {
    screen: start?.screen ?? "login",
    intro: start ? 3 : 0,
    mode: start?.mode ?? null,
    mStep: 0,
    phone: "",
    email: "",
    sms: "",
    code: "",
    checking: false,
    inviteOk: false,
    veil: false,
    ob: 0,
    first: "",
    last: "",
    username: "",
    cardSel: 0,
    resent: false,
    verse: 0,
    peek: false,
    user: null,
    invites: null,
    appt: null,
    history: [],
    tab: start?.tab ?? "home",
    sel: [],
    template: ["haare", "bart"],
    day: 1,
    time: null,
    rescheduling: false,
    cancelling: false,
    booked: null,
    flipped: false,
    cut: "Mid",
    newInv: "",
    lastCode: null,
    copied: false,
    circleSel: null,
    slideDone: false,
    creditUsed: 0,
    pay: "twint",
    remind: true,
    sheet: null,
    story: ov === "story",
    sVis: ov === "story",
    sIdx: 0,
    sReady: ov === "story",
    aTab: "today",
    q: "",
    tierF: "Alle",
    week: {
      0: { on: false, s: 540, e: 1080 },
      1: { on: false, s: 540, e: 1080 },
      2: { on: true, s: 540, e: 1080 },
      3: { on: true, s: 540, e: 1080 },
      4: { on: true, s: 540, e: 1170 },
      5: { on: true, s: 540, e: 1080 },
      6: { on: true, s: 540, e: 960 },
    },
    pause: { s: 720, e: 780 },
    bufferMin: 0,
    leadHours: 2,
    ovr: {
      4: { on: true, s: 1020, e: 1080 },
      7: { on: false, s: 540, e: 1080 },
    },
    dOpen: null,
    wOpen: null,
    abs: [
      { id: 1, a: 12, b: 12, why: "Privat", src: "HIER" },
      { id: 2, a: 22, b: 29, why: "Ferien", src: "CALENDLY" },
    ],
    calOn: true,
    syncing: false,
    syncAgo: "vor 2 Min",
    absForm: false,
    absA: null,
    absB: null,
    absWhy: "Ferien",
    done: {},
    started: {},
    salOn: ov === "salon",
    salVis: ov === "salon",
    cOn: ov === "cuts",
    cVis: ov === "cuts",
    cIdx: 0,
    cMode: TWEAKS.cutsView,
    cDrag: false,
    dragged: false,
    dHov: 1,
    iHov: -1,
    lmOn: false,
    lmVis: false,
    lmHov: -1,
    lOn: ov === "legal",
    lVis: ov === "legal",
    lDoc: "impressum",
    lSec: 0,
    lSwap: false,
    plain: true,
    tSwap: false,
    mailCopied: false,
    toast: "",
    toastOn: false,
  };
}

type Patch = Partial<SalonState> | ((p: SalonState) => Partial<SalonState>);

interface SalonCtx {
  state: SalonState;
  set: (patch: Patch, cb?: () => void) => void;
  go: (fn: () => void) => void;
  say: (msg: string) => void;
  startIntro: () => void;
  clearIntro: () => void;
}

const Ctx = createContext<SalonCtx | null>(null);

export function SalonProvider({
  children,
  start,
}: {
  children: React.ReactNode;
  start?: StartConfig;
}) {
  const [state, setState] = useState<SalonState>(() => initialState(start));
  const startRef = useRef(start);
  const cbRef = useRef<(() => void) | null>(null);

  const set = useCallback((patch: Patch, cb?: () => void) => {
    setState((p) => ({
      ...p,
      ...(typeof patch === "function" ? patch(p) : patch),
    }));
    if (cb) cbRef.current = cb;
  }, []);

  useEffect(() => {
    if (cbRef.current) {
      const cb = cbRef.current;
      cbRef.current = null;
      cb();
    }
  }, [state]);

  // timers
  const introTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const veilT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearIntro = useCallback(() => {
    introTimers.current.forEach(clearTimeout);
    introTimers.current = [];
  }, []);

  const startIntro = useCallback(() => {
    clearIntro();
    setState((p) => ({ ...p, intro: 0 }));
    introTimers.current = [
      setTimeout(() => setState((p) => ({ ...p, intro: 1 })), 80),
      setTimeout(() => setState((p) => ({ ...p, intro: 2 })), 4600),
      setTimeout(() => setState((p) => ({ ...p, intro: 3 })), 5600),
    ];
  }, [clearIntro]);

  const go = useCallback((fn: () => void) => {
    setState((p) => ({ ...p, veil: true }));
    if (veilT.current) clearTimeout(veilT.current);
    veilT.current = setTimeout(() => {
      fn();
      window.scrollTo(0, 0);
      setTimeout(() => setState((p) => ({ ...p, veil: false })), 120);
    }, 980);
  }, []);

  const say = useCallback((msg: string) => {
    if (toastT.current) clearTimeout(toastT.current);
    setState((p) => ({ ...p, toast: msg, toastOn: true }));
    toastT.current = setTimeout(
      () => setState((p) => ({ ...p, toastOn: false })),
      2600,
    );
  }, []);

  // mount: random verse, seed demo member, start intro. Client-only one-time
  // seeding (Math.random would mismatch during SSR hydration if done earlier).
  useEffect(() => {
    setState((p) => ({
      ...p,
      verse: Math.floor(Math.random() * verses.length),
      ...lucaState(),
      ...(startRef.current
        ? { screen: startRef.current.screen, intro: 3 }
        : {}),
    }));
    if (!startRef.current) startIntro();
    return () => {
      clearIntro();
      if (veilT.current) clearTimeout(veilT.current);
      if (toastT.current) clearTimeout(toastT.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<SalonCtx>(
    () => ({ state, set, go, say, startIntro, clearIntro }),
    [state, set, go, say, startIntro, clearIntro],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSalon() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSalon must be used inside SalonProvider");
  return c;
}
