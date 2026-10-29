// SERVER-ONLY route guards for the deep-linked app pages. The session cookie
// is checked before anything renders: no member session → back to the landing,
// no barber session → no portal. The page then hands the session's data to the
// client app, so it renders real data at once (no demo seed, no second fetch).
import { redirect } from "next/navigation";
import { getSession } from "./session";
import { loadMemberBundle } from "@/lib/db/bundle";
import { getAvailability, salonToday } from "@/lib/db/availability";
import type { StartConfig, Tab } from "@/components/salon/store";

export async function memberStart(tab: Tab): Promise<StartConfig> {
  const s = await getSession();
  if (s?.role !== "member") redirect("/");
  const [member, avail] = await Promise.all([
    loadMemberBundle(s.mid),
    getAvailability(salonToday()),
  ]);
  if (!member) redirect("/");
  return { screen: "app", tab, member, avail };
}

export async function barberStart(): Promise<StartConfig> {
  const s = await getSession();
  if (s?.role !== "barber") redirect("/");
  const avail = await getAvailability(salonToday());
  return { screen: "admin", barber: true, avail };
}
