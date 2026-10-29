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
  verses,
  type Appt,
  type Invite,
  type SalonUser,
  type ServiceKey,
} from "@/lib/data";
import { getAvailabilityAction } from "@/lib/actions";
import { bundleToState } from "@/lib/member-view";
import { availToState } from "@/lib/avail-view";
import type { MemberBundle } from "@/lib/db/bundle";
import type { AvailConfig } from "@/lib/db/availability";

/* Design tweaks (prototype props). */
export const TWEAKS = {
  cutsView: "compare" as "compare" | "detail" | "index",
  payOnline: false,
};

export type DayHours = { on: boolean; s: number; e: number };
export type Absence = {
  id: number;
  a: number;
  b: number;
  why: string;
  src: "HIER" | "GOOGLE";
};
export type ClientRecord = {
  id?: string; // member id (real members from the DB)
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
export type AdminTab = "today" | "termine" | "members" | "revenue" | "avail";
export type Mode = null | "member" | "invite";
export type OverlayKind = "salon" | "cuts" | "legal" | "story";
/** Initial state for a deep-linked route (see src/app/* pages). Member and
 *  barber routes are checked on the server, which hands over the session's
 *  data so the app renders real data at once (no demo seed, no extra fetch). */
export type StartConfig = {
  screen: Screen;
  mode?: Mode;
  tab?: Tab;
  overlay?: OverlayKind;
  member?: MemberBundle;
  barber?: boolean;
  avail?: AvailConfig;
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
  inviteFirst: string; // first name fixed by the matched invite (server)
  inviteBy: string; // inviter display name ("Marco R.")
  myInviter: string; // who invited the logged-in member (for the circle tab)
  busy: boolean; // a server action is in flight (login / onboarding)
  barberAuthed: boolean; // barber session verified (server) or just logged in
  pwFor: null | "member" | "barber"; // landing login, 2nd field: PIN or password
  pw: string;
  pin: string; // onboarding: chosen PIN
  pin2: string; // onboarding: PIN repeated
  ready: boolean; // client mounted — member/barber screens render from here on
  availLoaded: boolean; // barber hours etc. loaded from the DB
  veil: boolean;
  ob: number;
  first: string;
  last: string;
  username: string;
  unameMsg: string; // onboarding: why the chosen username can't be used
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
  booked: {
    pay: string;
    time: string;
    when: string;
    what: string;
    cal?: string; // "Zum Kalender"-Link (Google Calendar Template)
  } | null;
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
    inviteFirst: "",
    inviteBy: "",
    myInviter: "",
    busy: false,
    barberAuthed: !!start?.barber,
    pwFor: null,
    pw: "",
    pin: "",
    pin2: "",
    ready: false,
    availLoaded: false,
    veil: false,
    ob: 0,
    first: "",
    last: "",
    username: "",
    unameMsg: "",
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
    // placeholder until the DB config arrives (same as the barber's real hours)
    week: Object.fromEntries(
      [0, 1, 2, 3, 4, 5, 6].map((d) => [d, { on: true, s: 1140, e: 1320 }]),
    ),
    pause: { s: 720, e: 780 },
    bufferMin: 0,
    leadHours: 2,
    ovr: {},
    dOpen: null,
    wOpen: null,
    abs: [],
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

  // mount: random verse + the session data the server handed over. Client-only
  // (Math.random and the local-time day offsets would mismatch during SSR).
  useEffect(() => {
    const st = startRef.current;
    setState((p) => ({
      ...p,
      ready: true,
      verse: Math.floor(Math.random() * verses.length),
      ...(st?.member ? bundleToState(st.member, false) : {}),
      ...(st?.avail ? { ...availToState(st.avail), availLoaded: true } : {}),
    }));
    if (!st) startIntro();
    return () => {
      clearIntro();
      if (veilT.current) clearTimeout(veilT.current);
      if (toastT.current) clearTimeout(toastT.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // After an in-app login the barber's hours aren't loaded yet — fetch once.
  const needAvail =
    !state.availLoaded &&
    (state.screen === "welcome" ||
      state.screen === "app" ||
      state.screen === "admin");
  useEffect(() => {
    if (!needAvail) return;
    let live = true;
    getAvailabilityAction().then((c) => {
      if (live && c)
        setState((p) => ({ ...p, ...availToState(c), availLoaded: true }));
    });
    return () => {
      live = false;
    };
  }, [needAvail]);

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
