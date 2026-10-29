import { deleteEvent } from "@/lib/google/calendar";
import { getSession } from "@/lib/auth/session";

// Buchen läuft über die Server Action bookAppointmentAction (DB + Kalender).
// Hier bleibt nur das Absagen aus dem Barber-Portal — nur mit Barber-Session.

/** Nimmt eine Buchung zurück: löscht den Kalendertermin per eventId. */
export async function DELETE(request: Request) {
  const s = await getSession();
  if (s?.role !== "barber")
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  const eventId = new URL(request.url).searchParams.get("eventId");
  if (!eventId) {
    return Response.json(
      { ok: false, error: "eventId nötig" },
      { status: 400 },
    );
  }
  try {
    await deleteEvent(eventId);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
