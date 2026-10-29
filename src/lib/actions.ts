"use server";

// Server Actions — the only way the client reaches the database. Each action
// runs as a public POST, so it authenticates via the session cookie and never
// trusts a member id sent from the client. The heavy lifting lives in
// src/lib/db/*; these wrappers add auth, validation and the session cookie.
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { getSession, setSession, clearSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import {
  getMemberByUsername,
  getMemberById,
  getMemberCount,
  updateUsername,
  setTemplate,
  setMemberNote,
  setContactEmail,
} from "@/lib/db/members";
import {
  validateInvite,
  redeemInviteCreateMember,
  generateInvite,
  type InviteValidation,
  type GenerateResult,
} from "@/lib/db/invites";
import {
  createAppointment,
  cancelAppointment,
  getCreditChf,
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
import { durOf, labelOf, priceOf, tiers } from "@/lib/data";
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

/** Returning member logs in with username only (no password yet). */
export async function loginMemberAction(username: string): Promise<AuthResult> {
  const member = await getMemberByUsername(username);
  if (!member) return { ok: false, error: "not_found" };
  if (member.is_barber) return { ok: false, error: "use_barber_login" };
  await setSession({ mid: member.id, role: "member" });
  const bundle = await loadMemberBundle(member.id);
  if (!bundle) return { ok: false, error: "not_found" };
  return { ok: true, bundle };
}

export type OnboardArgs = {
  code: string;
  last: string;
  username: string;
  phone: string;
  email?: string;
  card: number;
};

/** New member: redeem the invite + create the account atomically, then log in. */
export async function redeemOnboardAction(
  args: OnboardArgs,
): Promise<AuthResult> {
  if (!/^[a-z0-9_]{2,20}$/.test(args.username.trim().toLowerCase()))
    return { ok: false, error: "username_invalid" };
  if (args.phone.replace(/\D/g, "").length < 6)
    return { ok: false, error: "phone_invalid" };

  const res = await redeemInviteCreateMember(args);
  if (!res.ok) return { ok: false, error: res.error };
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
  if (!verifyPassword(password, member.password_hash))
    return { ok: false, error: "invalid" };
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

/** Generate a pending invite the logged-in member owns (max 3). */
export async function generateInviteAction(
  firstName: string,
): Promise<GenerateResult> {
  const mid = await requireMember();
  if (!firstName.trim()) return { ok: false, error: "unknown" };
  return generateInvite(mid, firstName);
}

export async function updateUsernameAction(
  username: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const mid = await requireMember();
  return updateUsername(mid, username);
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

  // Price: CHF 15 / 20 with beard; invite credit applies on top (server-computed).
  const price = priceOf(args.services) || 15;
  const credit = await getCreditChf(mid);
  const creditApplied = Math.min(price, credit);
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
      summary: `Salon 323 — ${member.first_name} ${member.last_name}`.trim(),
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
    creditAppliedChf: creditApplied,
    payMethod: args.payMethod ?? "ort",
    googleEventId,
  });

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
  await sb
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("google_event_id", eventId);
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
      "id, first_name, last_name, cuts, member_since, template, note, invited_by",
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
    };
  });
}

export type AdminTodayAppt = {
  id: string;
  start: number; // minutes from midnight (salon-local)
  sv: ServiceKey[];
  done: boolean;
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
    .select("id, starts_at, services, status, member_id")
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
      },
    };
  });
}

export type RevenueMonth = { label: string; total: number; count: number };
export type RevenueData = {
  today: number;
  week: number;
  month: number;
  monthCount: number;
  monthLabel: string; // z.B. "Oktober"
  months: RevenueMonth[]; // letzte 6, alt → neu (letzter = aktueller Monat)
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

/**
 * Barber revenue, aggregated from real appointments and scalable over months.
 * "Verdient" = erledigte Termine (status 'done' — automatisch, sobald der
 * Termin vorbei ist, oder vorher vom Barber abgehakt); jeder zählt mit seinem
 * price_chf (15 / 20 mit Bart). Alle Zeitgrenzen in Salon-Zeitzone.
 */
export async function listRevenueAction(): Promise<RevenueData | null> {
  const s = await getSession();
  if (!s || s.role !== "barber") return null;
  await settlePastAppointments();
  const sb = supabaseAdmin();

  const nowZ = toZonedTime(new Date(), TZ);
  const startMonth = new Date(nowZ.getFullYear(), nowZ.getMonth() - 5, 1);
  const sinceISO = fromZonedTime(startMonth, TZ).toISOString();

  const { data, error } = await sb
    .from("appointments")
    .select("starts_at, price_chf, status")
    .eq("status", "done")
    .gte("starts_at", sinceISO);
  if (error) throw error;
  const rows = data ?? [];

  // last 6 month buckets (oldest → current)
  const months: RevenueMonth[] = [];
  const bucketIndex = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(nowZ.getFullYear(), nowZ.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    bucketIndex.set(key, months.length);
    months.push({ label: MON_ABBR[d.getMonth()], total: 0, count: 0 });
  }

  // week start (Monday 00:00, salon-local)
  const dow = (nowZ.getDay() + 6) % 7; // 0 = Monday
  const weekStart = new Date(
    nowZ.getFullYear(),
    nowZ.getMonth(),
    nowZ.getDate() - dow,
  );

  let today = 0,
    week = 0,
    month = 0,
    monthCount = 0;
  for (const r of rows) {
    const z = toZonedTime(new Date(r.starts_at), TZ);
    const p = r.price_chf ?? 0;
    const bi = bucketIndex.get(`${z.getFullYear()}-${z.getMonth()}`);
    if (bi != null) {
      months[bi].total += p;
      months[bi].count += 1;
    }
    if (
      z.getFullYear() === nowZ.getFullYear() &&
      z.getMonth() === nowZ.getMonth()
    ) {
      month += p;
      monthCount += 1;
      if (z.getDate() === nowZ.getDate()) today += p;
    }
    if (z >= weekStart) week += p;
  }

  return {
    today,
    week,
    month,
    monthCount,
    monthLabel: MON_FULL[nowZ.getMonth()],
    months,
  };
}

/** Barber marks an appointment done (also before its time) → status 'done'
 *  + one cut for the member, atomically and never twice. */
export async function markApptDoneAction(
  appointmentId: string,
): Promise<{ ok: boolean }> {
  const s = await getSession();
  if (!s || s.role !== "barber") return { ok: false };
  await markAppointmentDone(appointmentId);
  return { ok: true };
}

/** Barber: generate an invite code for a first member (inviter = the barber). */
export async function barberGenerateInviteAction(
  firstName: string,
): Promise<GenerateResult> {
  const s = await getSession();
  if (!s || s.role !== "barber") return { ok: false, error: "unknown" };
  if (!firstName.trim()) return { ok: false, error: "unknown" };
  return generateInvite(s.mid, firstName);
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
