// SERVER-ONLY member data access (service_role). Returns DB-shaped rows; the
// mapping to the client's SalonUser shape happens in the wiring layer.
import { supabaseAdmin } from "@/lib/supabase/server";
import type { MemberRow, ServiceKey } from "@/lib/supabase/types";

export async function getMemberByUsername(
  username: string,
): Promise<MemberRow | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("members")
    .select("*")
    .eq("username", username.trim().toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getMemberById(id: string): Promise<MemberRow | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("members")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Count of real members (excludes barber/admin accounts). */
export async function getMemberCount(): Promise<number> {
  const sb = supabaseAdmin();
  const { count, error } = await sb
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("is_barber", false);
  if (error) throw error;
  return count ?? 0;
}

export type UpdateResult = { ok: true } | { ok: false; error: string };

/** Change a member's username (lowercased). Fails on bad format or if taken. */
export async function updateUsername(
  id: string,
  username: string,
): Promise<UpdateResult> {
  const u = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{2,20}$/.test(u)) return { ok: false, error: "username_invalid" };
  const sb = supabaseAdmin();
  const { error } = await sb.from("members").update({ username: u }).eq("id", id);
  if (error) {
    if (error.code === "23505") return { ok: false, error: "username_taken" };
    throw error;
  }
  return { ok: true };
}

export async function setTemplate(
  id: string,
  services: ServiceKey[],
): Promise<void> {
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("members")
    .update({ template: services })
    .eq("id", id);
  if (error) throw error;
}

/** Barber's private note about a member. */
export async function setMemberNote(id: string, note: string): Promise<void> {
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("members")
    .update({ note: note.trim() || null })
    .eq("id", id);
  if (error) throw error;
}
