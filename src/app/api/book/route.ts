import { z } from "zod";
import { createEvent, deleteEvent, wallISO } from "@/lib/google/calendar";
import { durOf, labelOf, type ServiceKey } from "@/lib/data";

/**
 * Legt aus einer Buchung einen Termin im Salon-Kalender an.
 *
 * POST /api/book
 *   { date: "YYYY-MM-DD", time: "HH:MM", services: ServiceKey[],
 *     cut?, name?, phone?, note? }
 *   -> { ok: true, eventId, link }
 *
 * Dauer kommt aus durOf() (aktuell 30 min, wie im Prototyp) – eine Quelle.
 */
const Body = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date = YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "time = HH:MM"),
  services: z.array(z.enum(["haare", "bart", "brauen", "waschen"])).min(1),
  cut: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  note: z.string().optional(),
});

export async function POST(request: Request) {
  let data: z.infer<typeof Body>;
  try {
    data = Body.parse(await request.json());
  } catch (e) {
    return Response.json(
      { ok: false, error: "Ungültige Eingabe", detail: String(e) },
      { status: 400 },
    );
  }

  const [y, m, d] = data.date.split("-").map(Number);
  const [hh, mm] = data.time.split(":").map(Number);
  const startMin = hh * 60 + mm;
  const services = data.services as ServiceKey[];
  const dur = durOf(services) || 30;

  const who = data.name?.trim() || "Buchung";
  const descLines = [
    `Leistung: ${labelOf(services, data.cut)}`,
    data.phone ? `Telefon: ${data.phone}` : null,
    data.note ? `Notiz: ${data.note}` : null,
    "Preis: CHF 20 (vor Ort)",
    "— angelegt vom Salon-323-Buchungssystem",
  ].filter(Boolean);

  try {
    const ev = await createEvent({
      summary: `✂️ Termin — ${who}`,
      description: descLines.join("\n"),
      startISO: wallISO(y, m, d, startMin),
      endISO: wallISO(y, m, d, startMin + dur),
      attendeeEmail: data.email,
    });
    return Response.json({ ok: true, eventId: ev.id, link: ev.htmlLink });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

/** Nimmt eine Buchung zurück: löscht den Kalendertermin per eventId. */
export async function DELETE(request: Request) {
  const eventId = new URL(request.url).searchParams.get("eventId");
  if (!eventId) {
    return Response.json({ ok: false, error: "eventId nötig" }, { status: 400 });
  }
  try {
    await deleteEvent(eventId);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
