// SERVER-ONLY barber availability (service_role): weekly hours, per-date
// overrides, absences and the booking settings. One shape for load and save,
// so the barber portal and the member booking read the same source.
import { toZonedTime } from "date-fns-tz";
import { supabaseAdmin } from "@/lib/supabase/server";

/** Today's date (YYYY-MM-DD) in the salon's time zone (server may run in UTC). */
export function salonToday(): string {
  const z = toZonedTime(new Date(), process.env.GOOGLE_TZ || "Europe/Zurich");
  return `${z.getFullYear()}-${String(z.getMonth() + 1).padStart(2, "0")}-${String(z.getDate()).padStart(2, "0")}`;
}

export type DayRule = { on: boolean; s: number; e: number };
export type AvailConfig = {
  week: Record<number, DayRule>; // 0 = Sonntag … 6 = Samstag
  pause: { s: number; e: number };
  bufferMin: number;
  leadHours: number;
  overrides: ({ date: string } & DayRule)[]; // YYYY-MM-DD, ab heute
  absences: {
    start: string;
    end: string;
    why: string;
    src: "HIER" | "GOOGLE";
  }[];
};

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const mins = (v: number) => Math.max(0, Math.min(1440, Math.round(v)));
/** DB requires close > open; a closed day keeps a valid placeholder range. */
function rule(r: DayRule): DayRule {
  const s = mins(r.s);
  const e = mins(r.e);
  return { on: !!r.on, s, e: e > s ? e : Math.min(1440, s + 30) };
}

export async function getAvailability(today: string): Promise<AvailConfig> {
  const sb = supabaseAdmin();
  const [hours, settings, ovr, abs] = await Promise.all([
    sb.from("barber_hours").select("*"),
    sb.from("barber_settings").select("*").maybeSingle(),
    sb.from("barber_date_overrides").select("*").gte("override_date", today),
    sb
      .from("barber_absences")
      .select("*")
      .gte("end_date", today)
      .order("start_date"),
  ]);
  for (const r of [hours, settings, ovr, abs]) if (r.error) throw r.error;

  const week: Record<number, DayRule> = {};
  for (let d = 0; d < 7; d++) week[d] = { on: false, s: 1140, e: 1320 };
  for (const h of hours.data ?? [])
    week[h.weekday] = { on: h.is_open, s: h.open_min, e: h.close_min };
  const st = settings.data;
  return {
    week,
    pause: { s: st?.pause_start_min ?? 720, e: st?.pause_end_min ?? 780 },
    bufferMin: st?.buffer_min ?? 0,
    leadHours: st?.lead_hours ?? 2,
    overrides: (ovr.data ?? []).map((o) => ({
      date: o.override_date,
      on: o.is_open,
      s: o.open_min,
      e: o.close_min,
    })),
    absences: (abs.data ?? []).map((a) => ({
      start: a.start_date,
      end: a.end_date,
      why: a.reason,
      src: a.source === "GOOGLE" ? "GOOGLE" : "HIER",
    })),
  };
}

/** Full replace of everything from `today` on; past rows stay untouched. */
export async function saveAvailability(
  c: AvailConfig,
  today: string,
): Promise<void> {
  const sb = supabaseAdmin();
  const hours = Object.entries(c.week)
    .filter(([d]) => /^[0-6]$/.test(d))
    .map(([d, r]) => {
      const v = rule(r);
      return {
        weekday: Number(d),
        is_open: v.on,
        open_min: v.s,
        close_min: v.e,
      };
    });
  const pause = rule({ on: true, ...c.pause });
  const overrides = c.overrides
    .filter((o) => DAY.test(o.date) && o.date >= today)
    .map((o) => {
      const v = rule(o);
      return {
        override_date: o.date,
        is_open: v.on,
        open_min: v.s,
        close_min: v.e,
      };
    });
  const absences = c.absences
    .filter((a) => DAY.test(a.start) && DAY.test(a.end) && a.end >= today)
    .map((a) => ({
      start_date: a.start <= a.end ? a.start : a.end,
      end_date: a.start <= a.end ? a.end : a.start,
      reason: a.why.trim().slice(0, 40) || "Ferien",
      source: a.src,
    }));

  const checks = await Promise.all([
    sb.from("barber_hours").upsert(hours),
    sb
      .from("barber_settings")
      .update({
        pause_start_min: pause.s,
        pause_end_min: pause.e,
        buffer_min: Math.max(0, Math.min(120, Math.round(c.bufferMin))),
        lead_hours: Math.max(0, Math.min(72, Math.round(c.leadHours))),
      })
      .eq("id", true),
    sb.from("barber_date_overrides").delete().gte("override_date", today),
    sb.from("barber_absences").delete().gte("end_date", today),
  ]);
  for (const r of checks) if (r.error) throw r.error;

  const inserts = await Promise.all([
    overrides.length
      ? sb.from("barber_date_overrides").insert(overrides)
      : Promise.resolve({ error: null }),
    absences.length
      ? sb.from("barber_absences").insert(absences)
      : Promise.resolve({ error: null }),
  ]);
  for (const r of inserts) if (r.error) throw r.error;
}
