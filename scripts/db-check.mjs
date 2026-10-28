// Quick end-to-end check: tables exist + service_role key works.
// Run: node --env-file=.env.local scripts/db-check.mjs
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const tables = [
  "members",
  "invites",
  "appointments",
  "barber_hours",
  "barber_date_overrides",
  "barber_absences",
  "barber_settings",
];

let ok = true;
for (const t of tables) {
  const { count, error } = await sb
    .from(t)
    .select("*", { count: "exact", head: true });
  if (error) {
    ok = false;
    console.log(`✗ ${t}: ${error.message}`);
  } else {
    console.log(`✓ ${t}: ${count} rows`);
  }
}
console.log(ok ? "\nAll tables reachable." : "\nSome tables failed.");
process.exit(ok ? 0 : 1);
