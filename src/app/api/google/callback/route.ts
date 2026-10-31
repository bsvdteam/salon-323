import {
  exchangeCode,
  accessToken,
  accountEmail,
  saveConnection,
} from "@/lib/google/calendar";
import { getSession } from "@/lib/auth/session";

/**
 * Google-Callback von "Mit Google verbinden" (/admin → /api/google/auth).
 * Tauscht den `code` gegen Tokens und speichert den Refresh-Token in der DB
 * (google_connection) — ab sofort laufen alle Buchungen über dieses Konto,
 * ohne Env-Änderung oder Redeploy. Der Token wird nie angezeigt.
 */
function page(ok: boolean, title: string, text: string): Response {
  const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  body{font:16px/1.6 system-ui,sans-serif;max-width:560px;margin:64px auto;padding:0 22px;color:#0E141C;background:#f4f7fa}
  .t{font-weight:600;color:${ok ? "#0a7f32" : "#b3261e"}}
  a{display:inline-block;margin-top:18px;padding:12px 20px;border-radius:999px;background:#0E141C;color:#fff;text-decoration:none}
</style></head><body>
  <p class="t">${title}</p>
  <p>${text}</p>
  <a href="/admin">Zurück zum Admin</a>
</body></html>`;
  return new Response(html, {
    status: ok ? 200 : 400,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

export async function GET(request: Request) {
  const s = await getSession();
  if (s?.role !== "barber")
    return new Response("Nur mit Barber-Login.", { status: 403 });
  const sp = new URL(request.url).searchParams;
  const code = sp.get("code");
  if (!code)
    return page(
      false,
      "Nicht verbunden",
      sp.get("error") === "access_denied"
        ? "Der Zugriff wurde bei Google abgelehnt."
        : "Google hat keinen Code zurückgegeben.",
    );

  try {
    const tokens = await exchangeCode(code);
    if (!tokens.refresh_token)
      return page(
        false,
        "Kein dauerhafter Zugang erhalten",
        "Unter myaccount.google.com/permissions den Zugriff von Salon 15 " +
          "entfernen und in /admin erneut verbinden.",
      );
    const email = await accountEmail(await accessToken(tokens.refresh_token));
    await saveConnection(tokens.refresh_token, email);
    return page(
      true,
      "✓ Google Kalender verbunden",
      `Buchungen landen ab jetzt im Kalender von <b>${esc(email ?? "diesem Konto")}</b>.`,
    );
  } catch (e) {
    return page(false, "Verbinden fehlgeschlagen", esc(String(e)));
  }
}
