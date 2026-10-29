// SERVER-ONLY: gather everything a member's Wallet pass needs from Supabase and
// shape it for the pass builder. Supabase stays the single source of truth; the
// pass is just a projection of it.
import { getMemberById } from "@/lib/db/members";
import { getUpcoming } from "@/lib/db/appointments";
import type { ServiceKey } from "@/lib/supabase/types";
import type { MemberPassData } from "./apple/pass";

/** Pass data for a member id, or null if there's no such (non-barber) member. */
export async function memberPassData(
  memberId: string,
): Promise<MemberPassData | null> {
  const m = await getMemberById(memberId);
  if (!m || m.is_barber) return null;

  const appt = await getUpcoming(memberId);
  return {
    memberId: m.id,
    memberNo: m.member_no,
    firstName: m.first_name,
    lastName: m.last_name,
    cuts: m.cuts,
    memberSince: m.member_since,
    appointment: appt
      ? {
          startsAt: appt.starts_at,
          services: appt.services as ServiceKey[],
          priceChf: appt.price_chf,
          durationMin: appt.duration_min,
        }
      : null,
  };
}
