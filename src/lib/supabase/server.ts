// SERVER-ONLY Supabase client. Uses the service_role key, which bypasses RLS,
// so it must never reach the browser. Import this only from server actions and
// route handlers (files that run on the server). The runtime guard below throws
// if it is ever bundled into client code.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

if (typeof window !== "undefined") {
  throw new Error("supabase/server.ts must never be imported in the browser");
}

let cached: SupabaseClient<Database> | null = null;

/** The admin (service_role) client. Reused across invocations in one process. */
export function supabaseAdmin(): SupabaseClient<Database> {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase env missing — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }
  cached = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
