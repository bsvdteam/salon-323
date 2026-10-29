import { fromZonedTime } from "date-fns-tz";
import { busyRanges } from "@/lib/google/calendar";
import { getSession } from "@/lib/auth/session";

/**
 * Liefert die belegten Zeitfenster des Salon-Kalenders für ein Datumsfenster.
 * Damit kann das Buchungs-UI echte freie/belegte Slots zeigen (statt Platzhalter).
 *
 * GET /api/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
 *   -> { ok: true, tz, busy: [{ start, end }] }  (start/end als ISO mit Offset)
 */
export async function GET(request: Request) {
  // Nur eingeloggte Member/Barber sehen die Belegung.
  if (!(await getSession()))
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
    // Lokale Tagesgrenzen (in GOOGLE_TZ) in absolute Zeitpunkte umrechnen.
    const timeMin = fromZonedTime(`${from}T00:00:00`, tz).toISOString();
    const timeMax = fromZonedTime(`${to}T23:59:59`, tz).toISOString();
    const busy = await busyRanges(timeMin, timeMax);
    return Response.json({ ok: true, tz, busy });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
