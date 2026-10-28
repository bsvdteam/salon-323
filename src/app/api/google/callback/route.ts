import { exchangeCode } from "@/lib/google/calendar";

/**
 * Google-Callback des Einmal-Logins. Tauscht den `code` gegen Tokens und zeigt
 * den Refresh-Token an, damit er einmalig in .env.local (GOOGLE_REFRESH_TOKEN)
 * eingetragen werden kann. Danach wird dieser Endpunkt nicht mehr gebraucht.
 */
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (!code) {
    return new Response("Fehlender ?code-Parameter.", {
      status: 400,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  try {
    const tokens = await exchangeCode(code);

    if (!tokens.refresh_token) {
      return new Response(
        "Kein refresh_token erhalten. Entferne den Zugriff unter " +
          "https://myaccount.google.com/permissions und rufe /api/google/auth erneut auf.",
        { status: 400, headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }

    // Einfache Seite zum Kopieren. Nur lokal/einmalig – kein Styling nötig.
    const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Google-Kalender verbunden</title>
<style>
  body{font:16px/1.6 system-ui,sans-serif;max-width:640px;margin:48px auto;padding:0 20px;color:#0E141C}
  code{background:#f1f1f1;padding:2px 6px;border-radius:6px}
  .tok{display:block;background:#0E141C;color:#9ef;word-break:break-all;padding:14px;border-radius:10px;margin:12px 0;font-family:ui-monospace,monospace}
  .ok{color:#0a7f32;font-weight:600}
</style></head><body>
  <p class="ok">✓ Kalender verbunden.</p>
  <p>Kopiere diese Zeile in deine <code>.env.local</code>:</p>
  <div class="tok">GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}</div>
  <p>Danach den Dev-Server <strong>neu starten</strong> und
  <code>/api/google/test</code> aufrufen — es sollte ein Test-Termin im Kalender erscheinen.</p>
  <p style="color:#888">Diesen Token wie ein Passwort behandeln: nicht committen, nicht teilen.</p>
</body></html>`;

    return new Response(html, {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    return new Response(String(e), {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}
