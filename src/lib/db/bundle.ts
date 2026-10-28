// SERVER-ONLY: compose everything a logged-in member's UI needs in one shot.
// Returned to the client on login / onboarding; the wiring layer maps it onto
// the SalonState shape. Never includes password_hash.
import { getMemberById } from "./members";
import { getCircle, type CircleNode } from "./invites";
import { getUpcoming, getHistory, getCreditChf } from "./appointments";
import type { AppointmentRow, MemberRow } from "@/lib/supabase/types";

export type PublicMember = Omit<MemberRow, "password_hash">;

export type MemberBundle = {
  member: PublicMember;
  circle: CircleNode[];
  upcoming: AppointmentRow | null;
  history: AppointmentRow[];
  creditChf: number;
};

export function toPublicMember(m: MemberRow): PublicMember {
  const copy: Partial<MemberRow> = { ...m };
  delete copy.password_hash;
  return copy as PublicMember;
}

export async function loadMemberBundle(
  memberId: string,
): Promise<MemberBundle | null> {
  const member = await getMemberById(memberId);
  if (!member) return null;
  const [circle, upcoming, history, creditChf] = await Promise.all([
    getCircle(memberId),
    getUpcoming(memberId),
    getHistory(memberId),
    getCreditChf(memberId),
  ]);
  return { member: toPublicMember(member), circle, upcoming, history, creditChf };
}
