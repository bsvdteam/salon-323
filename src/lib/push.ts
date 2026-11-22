// SERVER-ONLY: Web-Push an Laurin (Barber) — neue Buchung, Absage, Verschiebung.
// Funktioniert auf dem iPhone, sobald die App auf dem Home-Bildschirm liegt
// und er in Admin → Zeiten „Mitteilungen“ aktiviert hat.
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase/server";

const SUBJECT = "https://www.salon15.ch";

let keys: { publicKey: string; privateKey: string } | null = null;

/** VAPID-Schlüssel: einmal erzeugt, in der DB gehalten (kein Env nötig). */
export async function vapidKeys() {
  if (keys) return keys;
  const sb = supabaseAdmin();
  const read = async () =>
    (
      await sb
        .from("push_keys")
        .select("public_key, private_key")
        .eq("id", 1)
        .maybeSingle()
    ).data;
  let row = await read();
  if (!row) {
    const k = webpush.generateVAPIDKeys();
    // zwei gleichzeitige Erst-Aufrufe: der zweite Insert scheitert still, beide lesen dann dasselbe
    await sb
      .from("push_keys")
      .insert({ id: 1, public_key: k.publicKey, private_key: k.privateKey });
    row = await read();
  }
  if (!row) throw new Error("push keys unavailable");
  keys = { publicKey: row.public_key, privateKey: row.private_key };
  return keys;
}

export type PushSub = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function saveSubscription(memberId: string, s: PushSub) {
  const { error } = await supabaseAdmin().from("push_subscriptions").upsert({
    endpoint: s.endpoint,
    member_id: memberId,
    p256dh: s.keys.p256dh,
    auth: s.keys.auth,
  });
  if (error) throw error;
}

export async function removeSubscription(memberId: string, endpoint: string) {
  await supabaseAdmin()
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .eq("member_id", memberId);
}

/** Mitteilung an alle Geräte aller Barber. Fehler schlucken — eine Buchung
 *  darf nie an einer Mitteilung scheitern. Tote Abos werden aufgeräumt. */
export async function notifyBarber(msg: {
  title: string;
  body: string;
  url?: string;
}) {
  try {
    const sb = supabaseAdmin();
    const { data: subs } = await sb
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth, members!inner(is_barber)")
      .eq("members.is_barber", true);
    if (!subs?.length) return;
    const k = await vapidKeys();
    const payload = JSON.stringify({ ...msg, url: msg.url ?? "/admin" });
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            {
              vapidDetails: {
                subject: SUBJECT,
                publicKey: k.publicKey,
                privateKey: k.privateKey,
              },
              TTL: 60 * 60 * 24,
              urgency: "high",
            },
          );
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410)
            await sb
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", s.endpoint);
        }
      }),
    );
  } catch {
    // no keys / DB hiccup — the booking itself already stands
  }
}
