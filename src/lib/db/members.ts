// SERVER-ONLY member data access (service_role). Returns DB-shaped rows; the
// mapping to the client's SalonUser shape happens in the wiring layer.
import { supabaseAdmin } from "@/lib/supabase/server";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
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

/** Store a member's PIN (hashed) and lift any login lock. */
export async function setPin(id: string, pin: string): Promise<void> {
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("members")
    .update({
      pin_hash: hashPassword(pin),
      login_failed: 0,
      login_locked_until: null,
    })
    .eq("id", id);
  if (error) throw error;
}

/** Check a PIN or password against its hash, with the lockout: 5 misses →
 *  15 minutes locked. A success resets the counter. */
export async function checkSecret(
  m: MemberRow,
  secret: string,
  hash: string | null,
): Promise<"ok" | "wrong" | "locked"> {
  if (m.login_locked_until && new Date(m.login_locked_until) > new Date())
    return "locked";
  const sb = supabaseAdmin();
  if (hash && verifyPassword(secret, hash)) {
    if (m.login_failed || m.login_locked_until)
      await sb
        .from("members")
        .update({ login_failed: 0, login_locked_until: null })
        .eq("id", m.id);
    return "ok";
  }
  const { data, error } = await sb.rpc("register_login_failure", {
    p_id: m.id,
  });
  if (error) throw error;
  return data ? "locked" : "wrong";
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

export async function setContactEmail(id: string, email: string): Promise<void> {
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("members")
    .update({ contact_email: email.trim() || null })
    .eq("id", id);
  if (error) throw error;
}
