"use server";

// Server Actions — the only way the client reaches the database. Each action
// runs as a public POST, so it authenticates via the session cookie and never
// trusts a member id sent from the client. The heavy lifting lives in
// src/lib/db/*; these wrappers add auth, validation and the session cookie.
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { after } from "next/server";
import { notifyPassChanged } from "@/lib/wallet/apple/push";
import { getSession, setSession, clearSession } from "@/lib/auth/session";
import {
  getMemberByUsername,
  getMemberById,
  getMemberCount,
  updateUsername,
  setTemplate,
  setMemberNote,
  setContactEmail,
  setPin,
  checkSecret,
} from "@/lib/db/members";
import { randomInt } from "crypto";
import {
  validateInvite,
  redeemInviteCreateMember,
  type InviteValidation,
} from "@/lib/db/invites";
import {
  createAppointment,
  cancelAppointment,
  getUpcoming,
  settlePastAppointments,
  markAppointmentDone,
} from "@/lib/db/appointments";
import {
  getAvailability,
  saveAvailability,
  salonToday as todayZ,
  type AvailConfig,
} from "@/lib/db/availability";
import { loadMemberBundle, type MemberBundle } from "@/lib/db/bundle";
import { createEvent, wallISO, deleteEvent } from "@/lib/google/calendar";
import { durOf, labelOf, priceOf, tiers, SPONTI } from "@/lib/data";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { ServiceKey, PayMethod } from "@/lib/supabase/types";

const TZ = process.env.GOOGLE_TZ || "Europe/Zurich";

// — internal helpers (not exported ⇒ not server actions) —

async function requireMember(): Promise<string> {
  const s = await getSession();
  if (!s) throw new Error("not_authenticated");
  return s.mid;
}

// ── public ──────────────────────────────────────────────────────────────────

/** Landing member count (non-barber). */
export async function memberCountAction(): Promise<number> {
  return getMemberCount();
}

/** Read-only invite check for the code-entry step. */
export async function validateInviteAction(
  code: string,
): Promise<InviteValidation | null> {
  return validateInvite(code);
}

/** Onboarding: is this username still free? Only answers for a valid invite
 *  code, so it can't be used to probe the member list from outside. */
export async function usernameAvailableAction(
  code: string,
  username: string,
): Promise<"ok" | "taken" | "invalid"> {
  const u = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{2,20}$/.test(u)) return "invalid";
  if (!(await validateInvite(code))) return "invalid";
  return (await getMemberByUsername(u)) ? "taken" : "ok";
}

export type AuthResult =
  { ok: true; bundle: MemberBundle } | { ok: false; error: string };

const PIN = /^\d{6}$/;

/** Returning member logs in with username + 6-digit PIN. Without a PIN the
 *  call only says what comes next ("pin_required" / barber password). */
export async function loginMemberAction(
  username: string,
  pin?: string,
): Promise<AuthResult> {
  const member = await getMemberByUsername(username);
  if (!member) return { ok: false, error: "not_found" };
  if (member.is_barber) return { ok: false, error: "use_barber_login" };
  if (!member.pin_hash) return { ok: false, error: "pin_missing" };
  if (!pin) return { ok: false, error: "pin_required" };
  if (!PIN.test(pin)) return { ok: false, error: "pin_wrong" };
  const check = await checkSecret(member, pin, member.pin_hash);
  if (check !== "ok")
    return { ok: false, error: check === "locked" ? "locked" : "pin_wrong" };
  await setSession({ mid: member.id, role: "member" });
  const bundle = await loadMemberBundle(member.id);
  if (!bundle) return { ok: false, error: "not_found" };
  return { ok: true, bundle };
}

export type OnboardArgs = {
  code: string;
  first: string;
  last: string;
  username: string;
  pin: string;
  phone: string;
  email?: string;
  card: number;
};

/** New member: redeem the invite + create the account atomically, then log in. */
export async function redeemOnboardAction(
  args: OnboardArgs,
): Promise<AuthResult> {
  const first = args.first.trim();
  if (first.length < 1 || first.length > 40)
    return { ok: false, error: "first_invalid" };
  if (!/^[a-z0-9_]{2,20}$/.test(args.username.trim().toLowerCase()))
    return { ok: false, error: "username_invalid" };
  if (args.phone.replace(/\D/g, "").length < 6)
    return { ok: false, error: "phone_invalid" };
  if (!PIN.test(args.pin)) return { ok: false, error: "pin_invalid" };

  const res = await redeemInviteCreateMember(args);
  if (!res.ok) return { ok: false, error: res.error };
  await setPin(res.member.id, args.pin);
  if (args.email && args.email.trim())
    await setContactEmail(res.member.id, args.email);
  await setSession({ mid: res.member.id, role: "member" });
  const bundle = await loadMemberBundle(res.member.id);
  if (!bundle) return { ok: false, error: "unknown" };
  return { ok: true, bundle };
}

/** Barber logs in with username + password. */
export async function loginBarberAction(
  username: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const member = await getMemberByUsername(username);
  if (!member || !member.is_barber || !member.password_hash)
    return { ok: false, error: "invalid" };
  const check = await checkSecret(member, password, member.password_hash);
  if (check !== "ok")
    return { ok: false, error: check === "locked" ? "locked" : "invalid" };
  await setSession({ mid: member.id, role: "barber" });
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await clearSession();
}

// ── member-authenticated ──────────────────────────────────────────────────

/** Barber hours, overrides, absences + booking settings (member or barber). */
export async function getAvailabilityAction(): Promise<AvailConfig | null> {
  if (!(await getSession())) return null;
  return getAvailability(todayZ());
}

/** Barber saves the whole availability config (debounced from the portal). */
export async function saveAvailabilityAction(
  cfg: AvailConfig,
): Promise<{ ok: boolean }> {
  const s = await getSession();
  if (!s || s.role !== "barber") return { ok: false };
  await saveAvailability(cfg, todayZ());
  return { ok: true };
}

export async function updateUsernameAction(
  username: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const mid = await requireMember();
  return updateUsername(mid, username);
}

/** Member changes their PIN (current PIN required, same lockout as login). */
export async function changePinAction(
  current: string,
  next: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const mid = await requireMember();
  if (!PIN.test(next)) return { ok: false, error: "pin_invalid" };
  const m = await getMemberById(mid);
  if (!m) return { ok: false, error: "not_found" };
  const check = await checkSecret(m, current, m.pin_hash);
  if (check !== "ok")
    return { ok: false, error: check === "locked" ? "locked" : "pin_wrong" };
  await setPin(mid, next);
  return { ok: true };
}

export async function saveTemplateAction(
  services: ServiceKey[],
): Promise<void> {
  const mid = await requireMember();
  if (services.length) await setTemplate(mid, services);
}

export type BookArgs = {
  date: string; // YYYY-MM-DD (salon-local)
  time: string; // HH:MM (salon-local)
  services: ServiceKey[];
  cut?: string | null;
  payMethod?: PayMethod;
};

/** Book an appointment: store in DB + mirror to Google Calendar (best effort). */
export async function bookAppointmentAction(
  args: BookArgs,
): Promise<{ ok: true; bundle: MemberBundle } | { ok: false; error: string }> {
  const mid = await requireMember();
  if (!args.services.length) return { ok: false, error: "no_services" };
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(args.date) ||
    !/^\d{2}:\d{2}$/.test(args.time)
  )
    return { ok: false, error: "bad_datetime" };

  const member = await getMemberById(mid);
  if (!member) return { ok: false, error: "not_found" };
  if (member.deactivated_at) return { ok: false, error: "inactive" };

  // Price: CHF 15 / 20 with beard (server-computed).
  const price = priceOf(args.services) || 15;
  const startsAt = fromZonedTime(
    `${args.date}T${args.time}:00`,
    TZ,
  ).toISOString();
  const dur = durOf(args.services) || 30;

  // Mirror to Google Calendar — optional until the OAuth refresh token is set.
  let googleEventId: string | null = null;
  try {
    const [y, m, d] = args.date.split("-").map(Number);
    const [hh, mm] = args.time.split(":").map(Number);
    const startMin = hh * 60 + mm;
    const ev = await createEvent({
      summary: `Salon 15 — ${member.first_name} ${member.last_name}`.trim(),
      description: [
        `Leistung: ${labelOf(args.services, args.cut ?? undefined)}`,
        member.phone ? `Telefon: ${member.phone}` : null,
        `Mitglied: @${member.username} (N° ${member.member_no})`,
      ]
        .filter(Boolean)
        .join("\n"),
      startISO: wallISO(y, m, d, startMin),
      endISO: wallISO(y, m, d, startMin + dur),
      // Member joins as a guest → Google emails them the invitation + updates.
      attendeeEmail: member.contact_email ?? undefined,
    });
    googleEventId = ev.id;
  } catch {
    // Calendar not connected yet — the booking still stands in the DB.
  }

  await createAppointment({
    memberId: mid,
    startsAt,
    durationMin: dur,
    services: args.services,
    cut: args.cut ?? null,
    priceChf: price,
    payMethod: args.payMethod ?? "ort",
    googleEventId,
  });
  // the Wallet card becomes the appointment card
  after(() => notifyPassChanged(mid));

  const bundle = await loadMemberBundle(mid);
  if (!bundle) return { ok: false, error: "unknown" };
  return { ok: true, bundle };
}

/** Cancel the member's own upcoming appointment. */
export async function cancelAppointmentAction(
  appointmentId: string,
): Promise<{ ok: true; bundle: MemberBundle } | { ok: false; error: string }> {
  const mid = await requireMember();
  const up = await getUpcoming(mid);
  if (!up || up.id !== appointmentId) return { ok: false, error: "not_found" };
  await cancelAppointment(appointmentId);
  after(() => notifyPassChanged(mid));
  const bundle = await loadMemberBundle(mid);
  if (!bundle) return { ok: false, error: "unknown" };
  return { ok: true, bundle };
}

/** Member cancels their own upcoming appointment (home hold-to-release):
 *  mark the DB row cancelled and remove the mirrored Google-Calendar event. */
export async function cancelUpcomingAction(): Promise<{ ok: boolean }> {
  const mid = await requireMember();
  const up = await getUpcoming(mid);
  if (!up) return { ok: true };
  await cancelAppointment(up.id);
  after(() => notifyPassChanged(mid));
  if (up.google_event_id) {
    try {
      await deleteEvent(up.google_event_id);
    } catch {
      // calendar offline — the DB cancel still stands
    }
  }
  return { ok: true };
}

/** Barber cancels via Google event id (AdminAppointments) → sync the DB row. */
export async function cancelApptByEventIdAction(
  eventId: string,
): Promise<{ ok: boolean }> {
  const s = await getSession();
  if (!s || s.role !== "barber") return { ok: false };
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("google_event_id", eventId)
    .select("member_id");
  for (const r of data ?? []) after(() => notifyPassChanged(r.member_id));
  return { ok: true };
}

export type AdminMember = {
  id: string;
  n: string;
  tier: string;
  cuts: number;
  via: string;
  last: string;
  since: [number, number];
  tpl: string;
  note: string;
  inactive: boolean; // deactivated by the barber: can't book
  invited: number; // how many joined with their code
};

/** Barber: the real member roster for the admin Members tab. */
export async function listMembersAction(): Promise<AdminMember[] | null> {
  const s = await getSession();
  if (!s || s.role !== "barber") return null;
  await settlePastAppointments();
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("members")
    .select(
      "id, first_name, last_name, cuts, member_since, template, note, invited_by, deactivated_at",
    )
    .eq("is_barber", false)
    .order("cuts", { ascending: false });
  if (error) throw error;

  const inviterIds = [
    ...new Set((data ?? []).map((m) => m.invited_by).filter(Boolean)),
  ] as string[];
  const inviters = new Map<string, string>();
  if (inviterIds.length) {
    const { data: inv } = await sb
      .from("members")
      .select("id, first_name, last_name")
      .in("id", inviterIds);
    for (const i of inv ?? [])
      inviters.set(
        i.id,
        `${i.first_name}${i.last_name ? " " + i.last_name[0] + "." : ""}`,
      );
  }

  const invitedCount = new Map<string, number>();
  for (const m of data ?? [])
    if (m.invited_by)
      invitedCount.set(m.invited_by, (invitedCount.get(m.invited_by) ?? 0) + 1);

  return (data ?? []).map((m): AdminMember => {
    let ti = 0;
    tiers.forEach((t, k) => {
      if (m.cuts >= t.min) ti = k;
    });
    const [y, mo] = m.member_since.split("-").map(Number);
    return {
      id: m.id,
      n: `${m.first_name} ${m.last_name}`.trim(),
      tier: tiers[ti].r,
      cuts: m.cuts,
      via: m.invited_by ? (inviters.get(m.invited_by) ?? "—") : "Gründer",
      last: "—",
      since: [(mo || 1) - 1, y],
      tpl: labelOf((m.template as ServiceKey[]) ?? []),
      note: m.note ?? "",
      inactive: !!m.deactivated_at,
      invited: invitedCount.get(m.id) ?? 0,
    };
  });
}

/** Barber: deactivate (or reactivate) a member. Inactive = the account and
 *  its history stay, but booking is refused and the invite code stops
 *  working. An upcoming appointment stays — cancel it in Termine if needed. */
export async function setMemberActiveAction(
  memberId: string,
  active: boolean,
): Promise<{ ok: boolean }> {
  const s = await getSession();
  if (!s || s.role !== "barber") return { ok: false };
  const m = await getMemberById(memberId);
  if (!m || m.is_barber) return { ok: false };
  const { error } = await supabaseAdmin()
    .from("members")
    .update({ deactivated_at: active ? null : new Date().toISOString() })
    .eq("id", memberId);
  if (error) throw error;
  return { ok: true };
}

/** Barber: delete a member for good. Their upcoming appointment is cancelled
 *  in Google (the guest gets Google's cancellation), the money of past cuts
 *  stays in the revenue as anonymous manual entries, then the row goes —
 *  appointments, wallet registrations and invites cascade; people they
 *  invited stay members (invited_by → null). */
export async function deleteMemberAction(
  memberId: string,
): Promise<{ ok: boolean }> {
  const s = await getSession();
  if (!s || s.role !== "barber") return { ok: false };
  const m = await getMemberById(memberId);
  if (!m || m.is_barber) return { ok: false };
  const sb = supabaseAdmin();
  const { data: appts, error } = await sb
    .from("appointments")
    .select("starts_at, price_chf, status, google_event_id")
    .eq("member_id", memberId);
  if (error) throw error;

  // keep the money: past cuts become anonymous manual revenue entries
  const p2 = (n: number) => String(n).padStart(2, "0");
  const keep = (appts ?? [])
    .filter((a) => a.status === "done" && (a.price_chf ?? 0) > 0)
    .map((a) => {
      const z = toZonedTime(new Date(a.starts_at), TZ);
      return {
        day: `${z.getFullYear()}-${p2(z.getMonth() + 1)}-${p2(z.getDate())}`,
        amount_chf: a.price_chf,
        note: "Schnitt · gelöschtes Mitglied",
      };
    });
  if (keep.length) {
    const { error: e2 } = await sb.from("revenue_entries").insert(keep);
    if (e2) throw e2;
  }
  for (const a of appts ?? [])
    if (
      a.status === "booked" &&
      a.google_event_id &&
      new Date(a.starts_at) > new Date()
    )
      await deleteEvent(a.google_event_id).catch(() => {});

  const { error: e3 } = await sb.from("members").delete().eq("id", memberId);
  if (e3) throw e3;
  return { ok: true };
}

export type AdminTodayAppt = {
  id: string;
  start: number; // minutes from midnight (salon-local)
  sv: ServiceKey[];
  done: boolean;
  sponti: boolean; // walk-in entered by the barber
  m: AdminMember;
};

/** Barber: today's real appointments for the "Heute" agenda. */
export async function listTodayAppointmentsAction(): Promise<
  AdminTodayAppt[] | null
> {
  const s = await getSession();
  if (!s || s.role !== "barber") return null;
  await settlePastAppointments();
  const sb = supabaseAdmin();
  // day bounds in salon time (the server itself may run in UTC)
  const dayStart = fromZonedTime(`${todayZ()}T00:00:00`, TZ);
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  const { data, error } = await sb
    .from("appointments")
    .select("id, starts_at, services, status, member_id, note")
    .gte("starts_at", dayStart.toISOString())
    .lt("starts_at", dayEnd.toISOString())
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  if (!rows.length) return [];

  const memberIds = [...new Set(rows.map((r) => r.member_id))];
  const { data: ms } = await sb.from("members").select("*").in("id", memberIds);
  const byId = new Map((ms ?? []).map((m) => [m.id, m]));
  const inviterIds = [
    ...new Set((ms ?? []).map((m) => m.invited_by).filter(Boolean)),
  ] as string[];
  const inviters = new Map<string, string>();
  if (inviterIds.length) {
    const { data: inv } = await sb
      .from("members")
      .select("id, first_name, last_name")
      .in("id", inviterIds);
    for (const i of inv ?? [])
      inviters.set(
        i.id,
        `${i.first_name}${i.last_name ? " " + i.last_name[0] + "." : ""}`,
      );
  }

  // how many joined with each one's code (shown when deleting from the sheet)
  const { data: kids } = await sb
    .from("members")
    .select("invited_by")
    .in("invited_by", memberIds);
  const invited = new Map<string, number>();
  for (const k of kids ?? [])
    invited.set(k.invited_by!, (invited.get(k.invited_by!) ?? 0) + 1);

  return rows.map((r): AdminTodayAppt => {
    const m = byId.get(r.member_id);
    const d = toZonedTime(new Date(r.starts_at), TZ);
    let ti = 0;
    if (m)
      tiers.forEach((t, k) => {
        if (m.cuts >= t.min) ti = k;
      });
    const [y, mo] = (m?.member_since ?? "2026-01-01").split("-").map(Number);
    return {
      id: r.id,
      start: d.getHours() * 60 + d.getMinutes(),
      sv: r.services as ServiceKey[],
      done: r.status === "done",
      sponti: r.note === "Sponti",
      m: {
        id: r.member_id,
        n: m ? `${m.first_name} ${m.last_name}`.trim() : "—",
        tier: tiers[ti].r,
        cuts: m?.cuts ?? 0,
        via: m?.invited_by ? (inviters.get(m.invited_by) ?? "—") : "Gründer",
        last: "—",
        since: [(mo || 1) - 1, y],
        tpl: labelOf((m?.template as ServiceKey[]) ?? []),
        note: m?.note ?? "",
        inactive: !!m?.deactivated_at,
        invited: invited.get(r.member_id) ?? 0,
      },
    };
  });
}

export type RevenueMonth = { ym: string; label: string; total: number };
export type RevenueEntry = {
  id: string;
  day: string; // YYYY-MM-DD, Salon-Kalendertag
  amount: number;
  note: string;
};
export type RevenueData = {
  ym: string; // gewählter Monat, YYYY-MM
  isCurrent: boolean;
  monthLabel: string; // "November", bei anderem Jahr "November 2025"
  total: number; // Termine + manuell
  apptTotal: number;
  apptCount: number;
  manualTotal: number;
  today: number; // nur im aktuellen Monat, sonst 0
  week: number;
  entries: RevenueEntry[]; // manuelle Einträge des Monats, neu → alt
  months: RevenueMonth[]; // 12 Monate, alt → neu (letzter = aktueller oder gewählter)
};

const MON_FULL = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];
const MON_ABBR = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];
const ymOf = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, "0")}`;
const dayOf = (d: Date) =>
  `${ymOf(d.getFullYear(), d.getMonth())}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Barber revenue for one month (default: the current one) plus a 12-month
 * trend. Two sources, added together: erledigte Termine (status 'done' —
 * automatisch nach dem Termin oder vom Barber abgehakt, je mit price_chf) and
 * revenue_entries, the amounts the barber typed in himself (nachgetragene
 * Monate, Termine ausserhalb der App). All boundaries in salon time.
 */
export async function listRevenueAction(
  ym?: string,
): Promise<RevenueData | null> {
  const s = await getSession();
  if (!s || s.role !== "barber") return null;
  await settlePastAppointments();
  const sb = supabaseAdmin();

  const nowZ = toZonedTime(new Date(), TZ);
  const curYm = ymOf(nowZ.getFullYear(), nowZ.getMonth());
  // a valid month that is not in the future, else the current one
  const sel =
    ym && /^\d{4}-(0[1-9]|1[0-2])$/.test(ym) && ym <= curYm ? ym : curYm;
  const [sy, sm] = sel.split("-").map(Number);

  // trend window: the 12 months ending now, or ending at the chosen month when
  // that one is older than the window
  const winEnd =
    (nowZ.getFullYear() - sy) * 12 + nowZ.getMonth() - (sm - 1) > 11
      ? new Date(sy, sm - 1, 1)
      : new Date(nowZ.getFullYear(), nowZ.getMonth(), 1);
  const winStart = new Date(winEnd.getFullYear(), winEnd.getMonth() - 11, 1);
  const winNext = new Date(winEnd.getFullYear(), winEnd.getMonth() + 1, 1);

  const [appts, manual] = await Promise.all([
    sb
      .from("appointments")
      .select("starts_at, price_chf")
      .eq("status", "done")
      .gte("starts_at", fromZonedTime(winStart, TZ).toISOString())
      .lt("starts_at", fromZonedTime(winNext, TZ).toISOString()),
    sb
      .from("revenue_entries")
      .select("id, day, amount_chf, note")
      .gte("day", dayOf(winStart))
      .lt("day", dayOf(winNext))
      .order("day", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (appts.error) throw appts.error;
  if (manual.error) throw manual.error;

  const months: RevenueMonth[] = [];
  const idx = new Map<string, number>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(winStart.getFullYear(), winStart.getMonth() + i, 1);
    const k = ymOf(d.getFullYear(), d.getMonth());
    idx.set(k, months.length);
    months.push({ ym: k, label: MON_ABBR[d.getMonth()], total: 0 });
  }

  const isCurrent = sel === curYm;
  const todayStr = dayOf(nowZ);
  const dow = (nowZ.getDay() + 6) % 7; // 0 = Monday
  const weekStart = dayOf(
    new Date(nowZ.getFullYear(), nowZ.getMonth(), nowZ.getDate() - dow),
  );

  let apptTotal = 0,
    apptCount = 0,
    manualTotal = 0,
    today = 0,
    week = 0;
  const add = (day: string, p: number) => {
    const bi = idx.get(day.slice(0, 7));
    if (bi != null) months[bi].total += p;
    if (day === todayStr) today += p;
    if (day >= weekStart && day <= todayStr) week += p;
  };
  for (const r of appts.data ?? []) {
    const day = dayOf(toZonedTime(new Date(r.starts_at), TZ));
    const p = r.price_chf ?? 0;
    add(day, p);
    if (day.startsWith(sel)) {
      apptTotal += p;
      apptCount += 1;
    }
  }
  const entries: RevenueEntry[] = [];
  for (const r of manual.data ?? []) {
    const p = Number(r.amount_chf);
    add(r.day, p);
    if (r.day.startsWith(sel)) {
      manualTotal += p;
      entries.push({ id: r.id, day: r.day, amount: p, note: r.note ?? "" });
    }
  }

  return {
    ym: sel,
    isCurrent,
    monthLabel: MON_FULL[sm - 1] + (sy === nowZ.getFullYear() ? "" : ` ${sy}`),
    total: apptTotal + manualTotal,
    apptTotal,
    apptCount,
    manualTotal,
    today: isCurrent ? today : 0,
    week: isCurrent ? week : 0,
    entries,
    months,
  };
}

/** Barber types in revenue by hand (a past month, a cut outside the app). */
export async function addRevenueAction(input: {
  day: string;
  amount: number;
  note?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const s = await getSession();
  if (!s || s.role !== "barber") return { ok: false };
  const amount = Math.round(Number(input.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000)
    return { ok: false, error: "Betrag ungültig" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.day))
    return { ok: false, error: "Datum ungültig" };
  if (input.day > dayOf(toZonedTime(new Date(), TZ)))
    return { ok: false, error: "Datum liegt in der Zukunft" };
  const { error } = await supabaseAdmin()
    .from("revenue_entries")
    .insert({
      day: input.day,
      amount_chf: amount,
      note: input.note?.trim().slice(0, 120) || null,
    });
  if (error) throw error;
  return { ok: true };
}

export async function deleteRevenueAction(
  id: string,
): Promise<{ ok: boolean }> {
  const s = await getSession();
  if (!s || s.role !== "barber") return { ok: false };
  const { error } = await supabaseAdmin()
    .from("revenue_entries")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return { ok: true };
}

/** Barber marks an appointment done (also before its time) → status 'done'
 *  + one cut for the member, atomically and never twice. */
export async function markApptDoneAction(
  appointmentId: string,
): Promise<{ ok: boolean }> {
  const s = await getSession();
  if (!s || s.role !== "barber") return { ok: false };
  await markAppointmentDone(appointmentId);
  const { data } = await supabaseAdmin()
    .from("appointments")
    .select("member_id")
    .eq("id", appointmentId)
    .maybeSingle();
  // cuts +1, back to the membership card
  if (data) after(() => notifyPassChanged(data.member_id));
  return { ok: true };
}

/** Barber: a walk-in ("Sponti") for a member, entered in the shop for today
 *  at `time` (salon time). Stored as a normal booking marked "Sponti": it
 *  shows in its own colour in the agenda and the Google Calendar (no guest
 *  invite → no mail) and is charged with "Fertig · abbuchen" like any other —
 *  or counts by itself once its time is over. */
export async function walkInAction(args: {
  memberId: string;
  services: ServiceKey[];
  time: string; // "HH:MM", today
}): Promise<{ ok: true; price: number } | { ok: false }> {
  const s = await getSession();
  if (!s || s.role !== "barber") return { ok: false };
  if (!args.services.length || !/^\d{2}:\d{2}$/.test(args.time))
    return { ok: false };
  const member = await getMemberById(args.memberId);
  if (!member || member.is_barber) return { ok: false };

  const day = todayZ();
  const start = fromZonedTime(`${day}T${args.time}:00`, TZ);
  const dur = durOf(args.services) || 30;
  const price = priceOf(args.services) || 15;

  let googleEventId: string | null = null;
  try {
    const [y, m, d] = day.split("-").map(Number);
    const [hh, mm] = args.time.split(":").map(Number);
    const ev = await createEvent({
      summary: `Salon 15 — ${member.first_name} ${member.last_name}`.trim(),
      description: [
        `Leistung: ${labelOf(args.services)}`,
        "Sponti (im Salon eingetragen)",
        `Mitglied: @${member.username} (N° ${member.member_no})`,
      ].join("\n"),
      startISO: wallISO(y, m, d, hh * 60 + mm),
      endISO: wallISO(y, m, d, hh * 60 + mm + dur),
      colorId: SPONTI.gcal,
    });
    googleEventId = ev.id;
  } catch {
    // calendar unreachable — the cut still counts in the DB
  }

  await createAppointment({
    memberId: member.id,
    startsAt: start.toISOString(),
    durationMin: dur,
    services: args.services,
    priceChf: price,
    payMethod: "ort",
    googleEventId,
    note: "Sponti",
  });
  after(() => notifyPassChanged(member.id));
  return { ok: true, price };
}

/** Barber: his own invite code (no use limit) for the invite card. */
export async function barberInviteCodeAction(): Promise<string | null> {
  const s = await getSession();
  if (!s || s.role !== "barber") return null;
  const m = await getMemberById(s.mid);
  return m?.ref_code ?? null;
}

/** Barber: a member forgot their PIN → a fresh random one, shown once to the
 *  barber to pass on. The member can change it in their profile afterwards. */
export async function resetMemberPinAction(
  memberId: string,
): Promise<{ ok: true; pin: string } | { ok: false }> {
  const s = await getSession();
  if (!s || s.role !== "barber") return { ok: false };
  const m = await getMemberById(memberId);
  if (!m || m.is_barber) return { ok: false };
  const pin = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await setPin(memberId, pin);
  return { ok: true, pin };
}

/** Barber: set a private note on a member. */
export async function setMemberNoteAction(
  memberId: string,
  note: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await getSession();
  if (!s || s.role !== "barber") return { ok: false, error: "forbidden" };
  await setMemberNote(memberId, note);
  return { ok: true };
}
