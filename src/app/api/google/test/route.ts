import { createEvent, wallISO } from "@/lib/google/calendar";

/**
 * Test: legt in 2 Tagen um 10:00 einen 30-Minuten-Termin an, um die komplette
 * Kette (Refresh-Token -> Kalender) zu prüfen. Nach erfolgreichem Test darf
 * dieser Endpunkt gelöscht werden. Aufruf: http://localhost:3000/api/google/test
 */
export async function GET() {
  try {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();

    const ev = await createEvent({
      summary: "✂️ Test-Termin (Salon 323)",
      description: "Automatisch angelegt vom Buchungssystem – Verbindungstest.",
      startISO: wallISO(y, m, day, 10 * 60), // 10:00
      endISO: wallISO(y, m, day, 10 * 60 + 30), // 10:30
    });

    return Response.json({ ok: true, eventId: ev.id, link: ev.htmlLink });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
