// One-off after switching the Google account (Mit Google verbinden in /admin):
// copies every upcoming booked appointment into the newly connected calendar
// so the slots stay blocked there, and points the booking at the new event.
// Silent — no guest invite, so members get no extra mail. The old events stay
// untouched in the previous account's calendar.
//   pnpm exec tsx --env-file=.env.local scripts/move-bookings-to-calendar.mts          (dry run)
//   pnpm exec tsx --env-file=.env.local scripts/move-bookings-to-calendar.mts --apply
import { toZonedTime } from "date-fns-tz";
import { supabaseAdmin } from "@/lib/supabase/server";
import { accessToken, createEvent, wallISO } from "@/lib/google/calendar";
import { labelOf } from "@/lib/data";
import type { ServiceKey } from "@/lib/supabase/types";

const apply = process.argv.includes("--apply");
const TZ = process.env.GOOGLE_TZ || "Europe/Zurich";
const cal = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || "primary");
const sb = supabaseAdmin();
const token = await accessToken();

const { data: appts, error } = await sb
  .from("appointments")
  .select("id, starts_at, duration_min, services, cut, google_event_id, member_id")
  .eq("status", "booked")
  .gt("starts_at", new Date().toISOString())
  .order("starts_at");
if (error) throw error;

for (const a of appts ?? []) {
  const { data: m } = await sb
    .from("members")
    .select("first_name, last_name, username, member_no, phone")
    .eq("id", a.member_id)
    .single();
  const name = `${m?.first_name ?? ""} ${m?.last_name ?? ""}`.trim();
  const when = toZonedTime(new Date(a.starts_at), TZ);

  // already in the connected calendar → nothing to do
  if (a.google_event_id) {
    const r = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${cal}/events/${a.google_event_id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (r.ok && (await r.json()).status !== "cancelled") {
      console.log(`= ${a.starts_at} ${name}: schon im Kalender`);
      continue;
    }
  }
  console.log(`${apply ? "+" : "~"} ${a.starts_at} ${name}`);
  if (!apply) continue;

  const startMin = when.getHours() * 60 + when.getMinutes();
  const y = when.getFullYear(), mo = when.getMonth() + 1, d = when.getDate();
  const ev = await createEvent({
    summary: `Salon 15 — ${name}`,
    description: [
      `Leistung: ${labelOf(a.services as ServiceKey[], a.cut ?? undefined)}`,
      m?.phone ? `Telefon: ${m.phone}` : null,
      `Mitglied: @${m?.username} (N° ${m?.member_no})`,
    ]
      .filter(Boolean)
      .join("\n"),
    startISO: wallISO(y, mo, d, startMin),
    endISO: wallISO(y, mo, d, startMin + a.duration_min),
  });
  const { error: upErr } = await sb
    .from("appointments")
    .update({ google_event_id: ev.id })
    .eq("id", a.id);
  if (upErr) throw upErr;
}
if (!apply) console.log("\nDry run — mit --apply wirklich übertragen.");
