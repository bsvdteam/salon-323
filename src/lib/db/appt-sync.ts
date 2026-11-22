// SERVER-ONLY: Laurin may cancel or move a booking directly in Google Calendar.
// Before a member sees their appointment, mirror that back into Supabase.
import {
  getUpcoming,
  cancelAppointment,
  updateAppointment,
} from "./appointments";
import { eventState } from "@/lib/google/calendar";
import { notifyPassChanged } from "@/lib/wallet/apple/push";
import { wdS, monS } from "@/lib/data";

const TZ = process.env.GOOGLE_TZ || "Europe/Zurich";

/** true if the member's upcoming appointment changed (reload the bundle). */
export async function syncUpcomingWithCalendar(
  memberId: string,
): Promise<boolean> {
  try {
    const up = await getUpcoming(memberId);
    if (!up?.google_event_id) return false;
    const ev = await eventState(up.google_event_id);
    if (!ev) {
      await cancelAppointment(up.id);
    } else {
      const s = new Date(ev.start).getTime();
      const dur = Math.round((new Date(ev.end).getTime() - s) / 60000);
      if (s === new Date(up.starts_at).getTime() && dur === up.duration_min)
        return false;
      await updateAppointment(up.id, {
        startsAt: new Date(s).toISOString(),
        durationMin: dur > 0 ? dur : up.duration_min,
      });
    }
    notifyPassChanged(memberId).catch(() => {});
    return true;
  } catch {
    return false; // Google unreachable — show what we have
  }
}

/** "Fr 28. Nov · 14:30" in salon time — for Laurin's push messages. */
export function whenLabel(iso: string): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      weekday: "short",
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    p.weekday,
  );
  return `${wdS[wd]} ${p.day}. ${monS[Number(p.month) - 1]} · ${p.hour}:${p.minute}`;
}
