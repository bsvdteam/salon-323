// App-facing Supabase types. The accurate Database type is generated from the
// live schema in database.types.ts (regenerate after a migration with:
//   pnpm exec supabase gen types typescript --linked > src/lib/supabase/database.types.ts
// via the runtime wrapper). Here we re-export it, derive row aliases, and keep
// the narrow app-level string unions (DB stores these columns as plain text).
import type { Database } from "./database.types";

export type { Database };

// App-level unions (the DB columns are text / text[]).
export type ServiceKey = "haare" | "bart" | "brauen" | "waschen";
export type InviteStatus = "open" | "redeemed" | "revoked" | "expired";
export type ApptStatus = "booked" | "done" | "cancelled" | "no_show";
export type PayMethod = "ort" | "twint" | "apple";
export type AbsenceSource = "HIER" | "CALENDLY" | "GOOGLE";

type Tables = Database["public"]["Tables"];

export type MemberRow = Tables["members"]["Row"];
export type InviteRow = Tables["invites"]["Row"];
export type AppointmentRow = Tables["appointments"]["Row"];
export type BarberHoursRow = Tables["barber_hours"]["Row"];
export type BarberDateOverrideRow = Tables["barber_date_overrides"]["Row"];
export type BarberAbsenceRow = Tables["barber_absences"]["Row"];
export type BarberSettingsRow = Tables["barber_settings"]["Row"];
