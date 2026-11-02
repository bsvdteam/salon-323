// Maps a server MemberBundle (plain JSON returned by a Server Action) onto the
// client SalonState shape. Pure and client-safe — the imports from server
// modules are type-only, so no server code is bundled.
import {
  tierAt,
  monS,
  type SalonUser,
  type Invite,
  type ServiceKey,
  type Appt,
  type Standing,
} from "@/lib/data";
import type { MemberBundle } from "@/lib/db/bundle";
import type { CircleNode } from "@/lib/db/invites";
import type { AppointmentRow } from "@/lib/supabase/types";

const tierRoman = (points: number, cuts: number) => tierAt(points, cuts).T.r;

/** "2024-03-…" → [2, 2024] (month index 0-11, year), matching SalonUser.since. */
function sinceOf(dateStr: string): [number, number] {
  const [y, m] = dateStr.split("-").map(Number);
  return [(m || 1) - 1, y];
}

function monthLabel(dateStr: string): string {
  const [y, m] = dateStr.split("-").map(Number);
  return `${monS[(m || 1) - 1]} ${y}`;
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
  return circle.map((n): Invite => ({
    id: n.id,
    name: `${n.first} ${n.last}`.trim(),
    meta: `Seit ${monthLabel(n.since)} · ${n.cuts} ${n.cuts === 1 ? "Cut" : "Cuts"}`,
    tag: tierRoman(n.points ?? 0, n.cuts),
    cuts: n.cuts,
    points: n.points ?? 0,
    since: monthLabel(n.since),
    kids: circleToInvites(n.kids),
  }));
}

export type MemberStatePatch = {
  user: SalonUser;
  invites: Invite[];
  refCode: string; // the member's personal invite code
  walletToken: string; // signed link to the Wallet pass
  template: ServiceKey[];
  myInviter: string;
  standing: Standing;
  fbAsk: boolean; // show the feedback question (once, this app open)
  appt: Appt | null;
  history: { off: number; s: ServiceKey[] }[];
};

/** The identity slice of SalonState for a logged-in member. Booking state
 *  (appt/history) is intentionally left to the existing flow. */
export function bundleToState(
  b: MemberBundle,
  isNew: boolean,
): MemberStatePatch {
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
      inactive: !!m.deactivated_at,
    },
    invites: circleToInvites(b.circle),
    refCode: m.ref_code,
    walletToken: b.walletToken,
    template: (m.template as ServiceKey[]) ?? ["haare", "bart"],
    myInviter: b.invitedByName ?? "",
    standing: b.standing,
    fbAsk: !!b.askFeedback,
    appt: apptFromRow(b.upcoming),
    history: b.history.map((r) => ({
      off: offsetOf(r.starts_at),
      s: r.services as ServiceKey[],
    })),
  };
}
