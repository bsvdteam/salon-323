import { accessToken, accountEmail } from "@/lib/google/calendar";
import { getSession } from "@/lib/auth/session";

/**
 * Für /admin: ist der Kalender wirklich erreichbar, und mit welchem Konto?
 * GET /api/google/status -> { ok: true, email } | { ok: false }
 */
export async function GET() {
  const s = await getSession();
  if (s?.role !== "barber")
    return Response.json({ ok: false }, { status: 403 });
  try {
    const email = await accountEmail(await accessToken());
    return Response.json({ ok: !!email, email });
  } catch {
    return Response.json({ ok: false });
  }
}
