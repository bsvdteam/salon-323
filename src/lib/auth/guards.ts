// SERVER-ONLY route guards for the deep-linked app pages. The session cookie
// is checked before anything renders: no member session → back to the landing,
// no barber session → no portal. The page then hands the session's data to the
// client app, so it renders real data at once (no demo seed, no second fetch).
import { redirect } from "next/navigation";
import { getSession } from "./session";
import { loadMemberBundle } from "@/lib/db/bundle";
import { countOpenAskFeedback } from "@/lib/db/feedback";
import { syncUpcomingWithCalendar } from "@/lib/db/appt-sync";
import { getAvailability, salonToday } from "@/lib/db/availability";
import type { StartConfig, Tab } from "@/components/salon/store";

export async function memberStart(tab: Tab): Promise<StartConfig> {
  const s = await getSession();
  if (s?.role !== "member") redirect("/");
  const [first, avail, askFeedback, changed] = await Promise.all([
    loadMemberBundle(s.mid),
    getAvailability(salonToday()),
    countOpenAskFeedback(s.mid),
    // Laurin cancelled/moved it right in Google Calendar? mirror that first
    syncUpcomingWithCalendar(s.mid),
  ]);
  const member = changed ? await loadMemberBundle(s.mid) : first;
  // member gone (deleted): drop the cookie, else the proxy would keep
  // sending "/" back here
  if (!member) redirect("/api/auth/out");
  return { screen: "app", tab, member: { ...member, askFeedback }, avail };
}

/** /admin: the portal with a barber session — otherwise the barber login right
 *  there (username + password), never a redirect to the landing. */
export async function barberStart(): Promise<StartConfig> {
  const s = await getSession();
  if (s?.role !== "barber") return { screen: "login", mode: "barber" };
  const avail = await getAvailability(salonToday());
  return { screen: "admin", barber: true, avail };
}
