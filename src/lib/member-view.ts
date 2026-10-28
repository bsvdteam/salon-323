// Maps a server MemberBundle (plain JSON returned by a Server Action) onto the
// client SalonState shape. Pure and client-safe — the imports from server
// modules are type-only, so no server code is bundled.
import {
  tiers,
  monS,
  type SalonUser,
  type Invite,
  type ServiceKey,
  type Appt,
} from "@/lib/data";
import type { MemberBundle } from "@/lib/db/bundle";
import type { CircleNode } from "@/lib/db/invites";
import type { AppointmentRow } from "@/lib/supabase/types";

function tierRoman(cuts: number): string {
  let idx = 0;
  tiers.forEach((t, k) => {
    if (cuts >= t.min) idx = k;
  });
  return tiers[idx].r;
}

/** "2024-03-…" → [2, 2024] (month index 0-11, year), matching SalonUser.since. */
function sinceOf(dateStr: string): [number, number] {
  const [y, m] = dateStr.split("-").map(Number);
  return [(m || 1) - 1, y];
}

function monthLabel(dateStr: string): string {
  const [y, m] = dateStr.split("-").map(Number);
  return `${monS[(m || 1) - 1]} ${y}`;
}

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

/** Day offset from today (0 = today) for a timestamp, matching Appt.off. */
function offsetOf(iso: string): number {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((day0.getTime() - today.getTime()) / 86400000);
}
function timeOf(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function apptFromRow(r: AppointmentRow | null): Appt | null {
  if (!r) return null;
  return {
    off: offsetOf(r.starts_at),
    time: timeOf(r.starts_at),
    services: r.services as ServiceKey[],
    price: r.price_chf,
    pay: r.pay_method,
    eventId: r.google_event_id ?? undefined,
  };
}

function circleToInvites(circle: CircleNode[]): Invite[] {
  return circle.map((n): Invite => {
    if (n.kind === "member") {
      return {
        name: `${n.first} ${n.last}`.trim(),
        meta: `Seit ${monthLabel(n.since)} · ${n.cuts} Cuts`,
        tag: tierRoman(n.cuts),
        kids: n.kids.map((k) => ({
          name: `${k.first} ${k.last}`.trim(),
          meta: `Von ${n.first} · seit ${monthLabel(k.since)}`,
          tag: tierRoman(k.cuts),
        })),
      };
    }
    return {
      name: n.first,
      meta: `Einladung offen · noch ${daysUntil(n.expiresAt)} Tage`,
      tag: "OFFEN",
      pending: true,
      code: n.code,
    };
  });
}

export type MemberStatePatch = {
  user: SalonUser;
  invites: Invite[];
  template: ServiceKey[];
  myInviter: string;
  appt: Appt | null;
  history: { off: number; s: ServiceKey[] }[];
};

/** The identity slice of SalonState for a logged-in member. Booking state
 *  (appt/history) is intentionally left to the existing flow. */
export function bundleToState(b: MemberBundle, isNew: boolean): MemberStatePatch {
  const m = b.member;
  return {
    user: {
      first: m.first_name,
      last: m.last_name,
      username: m.username,
      cuts: m.cuts,
      since: sinceOf(m.member_since),
      no: m.member_no,
      phone: m.phone,
      email: m.contact_email ?? "",
      card: m.card_index,
      isNew,
    },
    invites: circleToInvites(b.circle),
    template: (m.template as ServiceKey[]) ?? ["haare", "bart"],
    myInviter: b.invitedByName ?? "",
    appt: apptFromRow(b.upcoming),
    history: b.history.map((r) => ({
      off: offsetOf(r.starts_at),
      s: r.services as ServiceKey[],
    })),
  };
}
