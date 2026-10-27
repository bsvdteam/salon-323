# Salon 323 – Tech Stack & Architektur

## Stack (fix)
| Bereich | Wahl | Warum |
|---|---|---|
| Sprache | **TypeScript** (strict) | vorgegeben |
| Framework | **Next.js 15, App Router**, React Server Components, Server Actions | vorgegeben |
| Hosting | **Vercel** (Region `fra1`, nah an CH), Cron Jobs | vorgegeben |
| Datenbank / Auth | **Supabase** (Postgres, Auth, RLS, Realtime), Region **eu-central-1 (Frankfurt)** | vorgegeben; EU-Hosting für DSG |
| Styling | **Tailwind CSS v4** + CSS-Variablen für Tokens; Glas-Oberflächen als Utility-Klassen (`.glass-dark`, `.glass-light`) | Inline-Werte aus dem Prototyp 1:1 übertragbar |
| Animation | **Motion** (`motion/react`) für Gesten (Slider, Halten, Story-Swipe, Card-Tilt); CSS-Keyframes für Loops (float, shimmer, ping, breathe) | Gesten-Physik + exakte Easings |
| Fonts | `next/font/google`: Urbanist, Geist Mono, Nunito; Wortmarke als SVG | kein Layout-Shift |
| Validierung | **Zod** (Server Actions, Webhooks, Env) | |
| Daten-Fetching Client | **TanStack Query** (nur für Slots / Live-Teile) | Caching + Optimistic Updates |
| Datum/Zeit | **date-fns** + `date-fns-tz`, Zeitzone immer `Europe/Zurich` | Sommerzeit sicher |
| Kalender | **Calendly API v2** (Personal Access Token, Paid Plan nötig) | vorhandenes Tool, Barber pflegt dort |
| SMS | **Twilio Verify** (via Supabase Phone Auth) | zuverlässig in CH |
| E-Mail (optional) | Resend | Bestätigungen an Barber |
| Monitoring | Sentry + Vercel Analytics (cookieless) | kein Tracking-Banner nötig |
| Tests | Vitest (Logik), Playwright (Flows auf 375 px + Desktop, WebKit!) | Safari ist Hauptgerät |
| Paketmanager | pnpm | |
| Qualität | ESLint, Prettier, `supabase gen types` → `types/db.ts` | |

## Projektstruktur
```
app/
  (public)/page.tsx            Start / Login + Intro
  (public)/story/              Story-Overlay (parallel route @modal)
  (public)/salon/              Salon-Info
  (public)/cuts/               Galerie
  (public)/rechtliches/[doc]/  impressum | agb | datenschutz
  (member)/layout.tsx          Auth-Guard, Tab-Bar
  (member)/home/  book/  card/  circle/
  (member)/willkommen/         Welcome + Vers
  (member)/onboarding/
  (barber)/admin/  heute/ mitglieder/ verfuegbarkeit/ umsatz/
  api/webhooks/calendly/route.ts
  api/cron/sync-calendly/route.ts
components/  ui/ (Glass, Pill, Kicker, Toast, Veil, HoldButton, SlideToBook, CodeBoxes)
lib/  supabase/ (server.ts, client.ts, admin.ts)  calendly.ts  slots.ts  tiers.ts  time.ts
supabase/  migrations/  seed.sql
```

## Auth
- **Supabase Phone Auth (OTP per SMS) mit Twilio Verify.** Kein Passwort.
- **Code-Länge:** Das Design zeigt 4 Kästchen. Supabase-SMS-OTPs sind standardmässig 6-stellig. → In Supabase *Auth → Providers → Phone* die OTP-Länge prüfen; falls 4 nicht erlaubt ist, **CodeBoxes-Komponente generisch (n Kästchen)** bauen und 6 nutzen. Einzige erlaubte Abweichung vom Design – vorher mit Inhaber bestätigen.
- **Einladungscode-Login (Neumitglied):** 6-stelliger Code → Server Action prüft `invites` → Telefon eingeben → OTP → `members`-Zeile wird angelegt (`invited_by`) → Onboarding.
- **Rollen:** `members.role` = `member` | `barber`. Barber-Routen per Middleware + RLS geschützt.
- Session: Supabase SSR-Cookies (`@supabase/ssr`), nur technisch notwendig → kein Cookie-Banner.

## Calendly – so wird verbunden
**Prinzip:** Calendly ist die **Quelle für Zeiten & Termine**, Supabase ist die **Quelle für Mitglieder & alles andere**. Jeder Termin existiert in beiden – verknüpft über `calendly_event_uri`.

**Einrichtung (einmalig, im Calendly-Konto des Barbers):**
1. Paid Plan (Standard reicht) – nötig für die Scheduling API.
2. Ein Event-Typ **«Salon 323 · 30 Min»**, Dauer 30, Ort = «Steineggasse 4, 9113 Degersheim», keine Zahlung, Puffer 0, Vorlauf min. 2 h, Fenster 14 Tage.
3. Personal Access Token erzeugen → `CALENDLY_TOKEN` in Vercel.
4. Webhook-Abo (`POST /webhook_subscriptions`) auf `https://<domain>/api/webhooks/calendly`, Events `invitee.created`, `invitee.canceled`, Scope `user`. Signing Key → `CALENDLY_WEBHOOK_SECRET`.

**Flows:**
| Aktion | Ablauf |
|---|---|
| Slots anzeigen | Server: `GET /event_type_available_times` (max. 7 Tage pro Call → 2 Calls für 14 Tage). Cache 60 s (`unstable_cache`, Tag `slots`). Client zeigt nur diese Zeiten. |
| Buchen (Slider) | Server Action → `POST /invitees` (event_type, start_time UTC, invitee name, timezone `Europe/Zurich`, Telefon als Text-Reminder) → Antwort speichern in `appointments` (status `confirmed`) → `revalidateTag('slots')`. Bei 409/Slot weg: sanfter Hinweis + Slots neu laden. |
| Absagen (Halten) | Server Action → `POST /scheduled_events/{uuid}/cancellation` (reason «Im Portal freigegeben») → `appointments.status = 'canceled'`. Optimistic UI. |
| Verschieben | Neuen Termin buchen → erst wenn erfolgreich, alten absagen (nie umgekehrt). |
| Barber sagt in Calendly ab / bucht dort | Webhook → Signatur prüfen → `appointments` upsert per `calendly_event_uri` → Supabase Realtime pusht ins Portal. |
| Öffnungszeiten (Admin) | Lesen: `GET /user_availability_schedules`; Schreiben: `PUT /event_types/{uuid}/availability_schedule`. Bei API-Fehler: Admin zeigt «In Calendly ändern» mit Deep-Link. |
| Abwesenheiten | Primär in Calendly bzw. verbundenem Google/iCloud-Kalender (blockt automatisch). «HIER» erfasste Abwesenheiten = Supabase `absences` + Blocker-Termin im verbundenen Kalender. Herkunft-Badge `HIER` / `CALENDLY`. |
| Sicherheitsnetz | Vercel Cron alle 15 min: `GET /scheduled_events` (nächste 14 Tage) ↔ `appointments` abgleichen. |

**E-Mail-Pflichtfeld:** Calendly verlangt für Invitees eine E-Mail. Mitglieder haben nur Telefon → pro Mitglied interne Adresse `m-<id>@members.salon323.ch` (Catch-all, keine Zustellung an Kunden) **oder** E-Mail optional im Onboarding. Calendly-Benachrichtigungen an Invitees **deaktivieren** – das Portal ist der Kanal.

**Fallback ohne Paid Plan:** Kein API-Booking möglich → nicht einbetten. Dann Supabase als alleiniges Kalender-System (Tabelle `availability`, gleiche Slot-Logik) + Google-Calendar-Sync. Architektur so bauen, dass `lib/calendar/` ein Interface hat (`CalendarProvider`: `getSlots`, `book`, `cancel`) mit Implementierung `calendly` und `native`.

## Datenmodell (Kurz) – siehe `supabase/0001_init.sql`
- `members` – id (=auth.uid), first/last name, phone, role, tier (berechnet), invited_by, template (text[]), cut, note, created_at
- `invites` – code (6, unique), inviter_id, invitee_id, status (`open`/`pending`/`accepted`), created_at
- `appointments` – member_id, starts_at, ends_at (=+30 min), services (text[]), cut, is_first_visit, price_chf, credit_chf, status (`confirmed`/`canceled`/`done`/`no_show`), calendly_event_uri, calendly_invitee_uri, source (`portal`/`calendly`)
- `absences` – from_date, to_date, reason, source
- `credits` – Ledger: member_id, amount (+5 / −x), reason, appointment_id
- `settings` – Preis (20), Absage-Frist (24 h), Adresse, Telefon

**Regeln in der DB, nicht im Client:**
- Tier = Anzahl `done`-Termine (0/10/25/50) → View `member_stats`.
- Max. 3 Einladungen → Check in Server Action + Trigger.
- `is_first_visit` = kein früherer `done`-Termin → beim Buchen gesetzt.
- Guthaben max. CHF 20 pro Buchung.
- **RLS:** Mitglied sieht nur eigene Zeilen; Barber (`role='barber'`) sieht alles. Service-Role-Key nur serverseitig (Webhook, Cron).

## Zahlung
**Keine.** Bezahlt wird vor Ort (bar oder TWINT). Keine Zahlungsmittel hinterlegen, kein Stripe. Feature-Flag `NEXT_PUBLIC_PAY_ONLINE=false` – UI-Zweig existiert im Design (Tweak `payOnline`), wird aber nicht gebaut, bis entschieden.

## Env-Variablen
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CALENDLY_TOKEN=
CALENDLY_EVENT_TYPE_URI=
CALENDLY_USER_URI=
CALENDLY_WEBHOOK_SECRET=
CRON_SECRET=
TWILIO_* (in Supabase hinterlegt, nicht in Vercel)
SENTRY_DSN=
NEXT_PUBLIC_PAY_ONLINE=false
```

## Performance & Qualität
- Hintergrundfoto: `next/image` priority + AVIF, Hochformat-Variante per `<picture>`/media.
- Keine Layout-Shifts: Fonts via `next/font`, feste Höhen für Slots/Kacheln.
- Lighthouse Mobile ≥ 90, CLS < 0.05.
- `backdrop-filter` sparsam bei vielen Elementen (Safari-Performance); Fallback-Hintergrund ohne Blur für `@supports not (backdrop-filter: blur(1px))`.
- Echtgeräte-Test: iPhone Safari (Haupt), Android Chrome.

## Reihenfolge für Claude Code
1. Next.js + Tailwind + Tokens + Fonts + `Glass`-Komponenten; Login-Screen 1:1 inkl. Intro-Cards & Veil.
2. Supabase: Schema, RLS, Phone Auth, Einladungscode-Flow, Onboarding, Welcome.
3. Home + Termin-Card + Halten-zum-Freigeben.
4. Buchen inkl. SlideToBook – zuerst mit `native`-Provider, dann `calendly`.
5. Calendly: Slots, Booking, Cancel, Webhook, Cron.
6. Karte, Circle, Tiers, Guthaben.
7. Barber-Portal.
8. Story, Salon, Cuts, Rechtliches.
9. Playwright-Flows, Echtgeräte-Test, Go-live (Domain, Calendly-Webhook auf Prod).
