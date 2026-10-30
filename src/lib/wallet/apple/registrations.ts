// SERVER-ONLY: which devices hold which member's pass (PassKit web service).
import { supabaseAdmin } from "@/lib/supabase/server";

/** Register (or refresh the push token of) a device for a pass. True = new. */
export async function registerDevice(
  device: string,
  serial: string,
  pushToken: string,
): Promise<boolean> {
  const sb = supabaseAdmin();
  const { data: existing } = await sb
    .from("wallet_registrations")
    .select("device_library_id")
    .eq("device_library_id", device)
    .eq("serial_number", serial)
    .maybeSingle();
  const { error } = await sb.from("wallet_registrations").upsert({
    device_library_id: device,
    serial_number: serial,
    push_token: pushToken,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return !existing;
}

export async function unregisterDevice(
  device: string,
  serial: string,
): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("wallet_registrations")
    .delete()
    .eq("device_library_id", device)
    .eq("serial_number", serial);
  if (error) throw error;
}

/** Serials on this device changed after `since` (ms epoch tag), and the new
 *  tag (latest change). Null when nothing changed. */
export async function updatedSerials(
  device: string,
  since: number,
): Promise<{ serials: string[]; lastUpdated: number } | null> {
  const sb = supabaseAdmin();
  const { data: regs, error } = await sb
    .from("wallet_registrations")
    .select("serial_number")
    .eq("device_library_id", device);
  if (error) throw error;
  const ids = (regs ?? []).map((r) => r.serial_number);
  if (!ids.length) return null;
  const { data: members, error: e2 } = await sb
    .from("members")
    .select("id, pass_updated_at")
    .in("id", ids);
  if (e2) throw e2;
  const changed = (members ?? []).filter(
    (m) => new Date(m.pass_updated_at).getTime() > since,
  );
  if (!changed.length) return null;
  return {
    serials: changed.map((m) => m.id),
    lastUpdated: Math.max(
      ...changed.map((m) => new Date(m.pass_updated_at).getTime()),
    ),
  };
}

export async function pushTokensFor(serial: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin()
    .from("wallet_registrations")
    .select("push_token")
    .eq("serial_number", serial);
  if (error) throw error;
  return [...new Set((data ?? []).map((r) => r.push_token))];
}

/** APNs says a token is dead → forget every registration using it. */
export async function dropPushToken(token: string): Promise<void> {
  await supabaseAdmin()
    .from("wallet_registrations")
    .delete()
    .eq("push_token", token);
}

/** Remember which layout the member installed (poster or storeCard), so
 *  Wallet's background updates get the same one. */
export async function setPassLayout(
  memberId: string,
  poster: boolean,
): Promise<void> {
  await supabaseAdmin()
    .from("members")
    .update({ pass_poster: poster })
    .eq("id", memberId);
}
