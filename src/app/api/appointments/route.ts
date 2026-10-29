import { fromZonedTime } from "date-fns-tz";
import { listEvents } from "@/lib/google/calendar";
import { getSession } from "@/lib/auth/session";

/**
 * Listet echte Termine aus dem Salon-Kalender (nur Barber-Session).
 * GET /api/appointments?from=YYYY-MM-DD&to=YYYY-MM-DD -> { ok, items: CalEvent[] }
 */
export async function GET(request: Request) {
  const s = await getSession();
  if (s?.role !== "barber")
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  const sp = new URL(request.url).searchParams;
  const from = sp.get("from");
  const to = sp.get("to");
  if (
    !from ||
    !to ||
    !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(to)
  ) {
    return Response.json(
      { ok: false, error: "from & to als YYYY-MM-DD nötig" },
      { status: 400 },
    );
  }

  const tz = process.env.GOOGLE_TZ || "Europe/Zurich";
  try {
    const timeMin = fromZonedTime(`${from}T00:00:00`, tz).toISOString();
    const timeMax = fromZonedTime(`${to}T23:59:59`, tz).toISOString();
    const items = await listEvents(timeMin, timeMax);
    return Response.json({ ok: true, items });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
