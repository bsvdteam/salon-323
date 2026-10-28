/**
 * Google-Kalender-Anbindung (serverseitig).
 *
 * Bewusst ohne externe Bibliothek: nur `fetch` gegen Googles OAuth- und
 * Calendar-REST-API. Verbindet EUREN eigenen Google-Kalender per OAuth
 * (Refresh-Token) — kein Dienstkonto-Schlüssel nötig (von der Org-Richtlinie
 * blockiert). Alle Secrets kommen aus .env.local, werden nie an den Browser
 * ausgeliefert und nur hier (in Route Handlers) verwendet.
 *
 * Nötige Env-Variablen (siehe .env.example):
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI,
 *   GOOGLE_REFRESH_TOKEN (nach dem Einmal-Login), GOOGLE_CALENDAR_ID, GOOGLE_TZ
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CAL_BASE = "https://www.googleapis.com/calendar/v3";

/** Voller Kalender-Zugriff: deckt Termine anlegen UND Frei/Belegt-Abfrage ab. */
export const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Fehlende Env-Variable: ${name} (siehe .env.local)`);
  return v;
}

function calendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID || "primary";
}

function timeZone(): string {
  return process.env.GOOGLE_TZ || "Europe/Zurich";
}

/** Zustimmungs-URL für den EINMALIGEN Login, der den Refresh-Token liefert. */
export function authUrl(): string {
  const p = new URLSearchParams({
    client_id: env("GOOGLE_CLIENT_ID"),
    redirect_uri: env("GOOGLE_OAUTH_REDIRECT_URI"),
    response_type: "code",
    scope: GOOGLE_SCOPE,
    access_type: "offline", // nötig, damit Google einen Refresh-Token ausgibt
    prompt: "consent", // erzwingt den Refresh-Token auch bei erneutem Login
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`;
}

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
};

/** Tauscht den `code` aus dem Callback gegen Tokens (inkl. Refresh-Token). */
export async function exchangeCode(code: string): Promise<TokenResponse> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env("GOOGLE_CLIENT_ID"),
      client_secret: env("GOOGLE_CLIENT_SECRET"),
      redirect_uri: env("GOOGLE_OAUTH_REDIRECT_URI"),
      grant_type: "authorization_code",
    }).toString(),
  });
  if (!res.ok) throw new Error(`Token-Tausch fehlgeschlagen: ${await res.text()}`);
  return (await res.json()) as TokenResponse;
}

/** Holt mit dem gespeicherten Refresh-Token ein frisches Access-Token. */
async function accessToken(): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env("GOOGLE_CLIENT_ID"),
      client_secret: env("GOOGLE_CLIENT_SECRET"),
      refresh_token: env("GOOGLE_REFRESH_TOKEN"),
      grant_type: "refresh_token",
    }).toString(),
  });
  if (!res.ok) throw new Error(`Token-Refresh fehlgeschlagen: ${await res.text()}`);
  const j = (await res.json()) as TokenResponse;
  return j.access_token;
}

/** Wandelt Wanduhrzeit-Teile in einen lokalen ISO-String (ohne Zeitzonen-Suffix). */
export function wallISO(
  year: number,
  month: number,
  day: number,
  minutes: number,
): string {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  const MM = String(month).padStart(2, "0");
  const DD = String(day).padStart(2, "0");
  return `${year}-${MM}-${DD}T${hh}:${mm}:00`;
}

export type EventInput = {
  summary: string;
  description?: string;
  /** Lokale Wanduhrzeit, z.B. "2026-11-03T09:00:00" (wird in GOOGLE_TZ interpretiert). */
  startISO: string;
  endISO: string;
  /** Kunden-E-Mail: als Gast eingeladen -> Google mailt Bestätigung & Updates. */
  attendeeEmail?: string;
};

/** Legt einen Termin im verbundenen Kalender an. */
export async function createEvent(input: EventInput): Promise<{
  id: string;
  htmlLink: string;
}> {
  const token = await accessToken();
  // Mit Gast -> Google verschickt automatisch Einladung/Updates (sendUpdates=all).
  const sendUpdates = input.attendeeEmail ? "all" : "none";
  const res = await fetch(
    `${CAL_BASE}/calendars/${encodeURIComponent(calendarId())}/events?sendUpdates=${sendUpdates}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: input.summary,
        description: input.description,
        start: { dateTime: input.startISO, timeZone: timeZone() },
        end: { dateTime: input.endISO, timeZone: timeZone() },
        attendees: input.attendeeEmail
          ? [{ email: input.attendeeEmail }]
          : undefined,
      }),
    },
  );
  if (!res.ok) throw new Error(`Termin anlegen fehlgeschlagen: ${await res.text()}`);
  const j = await res.json();
  return { id: j.id, htmlLink: j.htmlLink };
}

export type BusyRange = { start: string; end: string };

/** Belegte Zeitfenster im Kalender zwischen zwei Zeitpunkten (ISO mit Offset/Z). */
export async function busyRanges(
  timeMinISO: string,
  timeMaxISO: string,
): Promise<BusyRange[]> {
  const token = await accessToken();
  const id = calendarId();
  const res = await fetch(`${CAL_BASE}/freeBusy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: timeMinISO,
      timeMax: timeMaxISO,
      timeZone: timeZone(),
      items: [{ id }],
    }),
  });
  if (!res.ok) throw new Error(`Frei/Belegt-Abfrage fehlgeschlagen: ${await res.text()}`);
  const j = await res.json();
  return (j.calendars?.[id]?.busy ?? []) as BusyRange[];
}

/** Löscht einen Termin (z.B. wenn ein Mitglied seine Buchung zurücknimmt). */
export async function deleteEvent(eventId: string): Promise<void> {
  const token = await accessToken();
  const res = await fetch(
    `${CAL_BASE}/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
  );
  // 404/410 = schon weg -> als Erfolg behandeln.
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`Termin löschen fehlgeschlagen: ${await res.text()}`);
  }
}
