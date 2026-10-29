// SERVER-ONLY appointment data access (service_role). Supabase is the system of
// record; the matching Google Calendar event id is stored in google_event_id.
import { supabaseAdmin } from "@/lib/supabase/server";
import type {
  AppointmentRow,
  PayMethod,
  ServiceKey,
} from "@/lib/supabase/types";

/** A cut counts once its appointment is over: flip every past 'booked' appointment
 *  to 'done' and bump the members' cuts (atomic, idempotent). Called lazily
 *  before anything reads cuts or revenue, so a forgotten tick never loses one. */
export async function settlePastAppointments(): Promise<void> {
  const { error } = await supabaseAdmin().rpc("settle_past_appointments");
  if (error) throw error;
}

/** Barber marks one appointment done (also before its time); never twice. */
export async function markAppointmentDone(id: string): Promise<void> {
  const { error } = await supabaseAdmin().rpc("mark_appointment_done", {
    p_id: id,
  });
  if (error) throw error;
}

/** Soonest upcoming booked appointment, or null. */
export async function getUpcoming(
  memberId: string,
): Promise<AppointmentRow | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("appointments")
    .select("*")
    .eq("member_id", memberId)
    .eq("status", "booked")
    .gt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Past / completed appointments, newest first. */
export async function getHistory(
  memberId: string,
  limit = 10,
): Promise<AppointmentRow[]> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("appointments")
    .select("*")
    .eq("member_id", memberId)
    .in("status", ["done", "booked", "no_show"])
    .lt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export type NewAppointment = {
  memberId: string;
  startsAt: string; // ISO
  durationMin?: number;
  services: ServiceKey[];
  cut?: string | null;
  priceChf?: number;
  payMethod?: PayMethod;
  googleEventId?: string | null;
  note?: string | null;
};

export async function createAppointment(
  a: NewAppointment,
): Promise<AppointmentRow> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("appointments")
    .insert({
      member_id: a.memberId,
      starts_at: a.startsAt,
      duration_min: a.durationMin ?? 30,
      services: a.services,
      cut: a.cut ?? null,
      price_chf: a.priceChf ?? 20,
      pay_method: a.payMethod ?? "ort",
      google_event_id: a.googleEventId ?? null,
      note: a.note ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function cancelAppointment(id: string): Promise<void> {
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) throw error;
}
