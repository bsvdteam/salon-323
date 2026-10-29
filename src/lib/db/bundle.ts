// SERVER-ONLY: compose everything a logged-in member's UI needs in one shot.
// Returned to the client on login / onboarding; the wiring layer maps it onto
// the SalonState shape. Never includes password_hash.
import { getMemberById } from "./members";
import { getCircle, type CircleNode } from "./invites";
import {
  getUpcoming,
  getHistory,
  settlePastAppointments,
} from "./appointments";
import type { AppointmentRow, MemberRow } from "@/lib/supabase/types";

// Secrets and login bookkeeping never leave the server.
export type PublicMember = Omit<
  MemberRow,
  "password_hash" | "pin_hash" | "login_failed" | "login_locked_until"
>;

export type MemberBundle = {
  member: PublicMember;
  circle: CircleNode[];
  upcoming: AppointmentRow | null;
  history: AppointmentRow[];
  invitedByName: string | null; // display name of who invited this member
};

export function toPublicMember(m: MemberRow): PublicMember {
  const copy: Partial<MemberRow> = { ...m };
  delete copy.password_hash;
  delete copy.pin_hash;
  delete copy.login_failed;
  delete copy.login_locked_until;
  return copy as PublicMember;
}

export async function loadMemberBundle(
  memberId: string,
): Promise<MemberBundle | null> {
  await settlePastAppointments(); // past appointments count as cuts first
  const member = await getMemberById(memberId);
  if (!member) return null;
  const [circle, upcoming, history, inviter] = await Promise.all([
    getCircle(memberId),
    getUpcoming(memberId),
    getHistory(memberId),
    member.invited_by
      ? getMemberById(member.invited_by)
      : Promise.resolve(null),
  ]);
  const invitedByName = inviter
    ? `${inviter.first_name}${inviter.last_name ? " " + inviter.last_name[0] + "." : ""}`
    : null;
  return {
    member: toPublicMember(member),
    circle,
    upcoming,
    history,
    invitedByName,
  };
}
