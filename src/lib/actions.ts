"use server";

// Server Actions — the only way the client reaches the database. Each action
// runs as a public POST, so it authenticates via the session cookie and never
// trusts a member id sent from the client. The heavy lifting lives in
// src/lib/db/*; these wrappers add auth, validation and the session cookie.
import { fromZonedTime } from "date-fns-tz";
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
} from "@/lib/db/appointments";
import { loadMemberBundle, type MemberBundle } from "@/lib/db/bundle";
import { createEvent, wallISO } from "@/lib/google/calendar";
import { durOf, labelOf } from "@/lib/data";
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

export type AuthResult =
  | { ok: true; bundle: MemberBundle }
  | { ok: false; error: string };

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

/** Who is logged in now, for rehydrating the app on load. */
export async function sessionAction(): Promise<
  | { role: "member"; bundle: MemberBundle }
  | { role: "barber"; username: string }
  | null
> {
  const s = await getSession();
  if (!s) return null;
  if (s.role === "barber") {
    const m = await getMemberById(s.mid);
    if (!m || !m.is_barber) return null;
    return { role: "barber", username: m.username };
  }
  const bundle = await loadMemberBundle(s.mid);
  if (!bundle) return null;
  return { role: "member", bundle };
}

// ── member-authenticated ──────────────────────────────────────────────────

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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date) || !/^\d{2}:\d{2}$/.test(args.time))
    return { ok: false, error: "bad_datetime" };

  const member = await getMemberById(mid);
  if (!member) return { ok: false, error: "not_found" };

  // Apply available invite credit (computed server-side, never trusted from UI).
  const credit = await getCreditChf(mid);
  const creditApplied = Math.min(20, credit);
  const startsAt = fromZonedTime(`${args.date}T${args.time}:00`, TZ).toISOString();
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
    priceChf: 20,
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
