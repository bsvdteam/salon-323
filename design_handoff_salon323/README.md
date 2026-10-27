# Handoff: Salon 323 – Members Platform

## Overview
Salon 323 ist ein Barber mit einem Stuhl in **Steineggasse 4, 9113 Degersheim**. Reinkommen kann nur, wer von einem Mitglied eingeladen wird. Die Plattform enthält:
- **Mitglieder-Portal:** Login per SMS oder Einladungscode, Onboarding, Buchen, Termin-Karte, Circle (Einladungen und Stufen)
- **Barber-Portal (Admin):** Heute, Mitglieder, Verfügbarkeit mit Calendly-Sync, Umsatz
- **Öffentliche Ansichten:** Story, Salon-Info, Cuts-Galerie, Rechtliches

Sprache: **Deutsch (Schweiz)**, also immer «ss» statt «ß» und CHF-Format `CHF 20.–`.

## About the Design Files
Die Dateien in `design/` sind **Design-Referenzen in HTML**. Sie sind Prototypen, die Aussehen und Verhalten exakt zeigen, aber **kein Produktionscode zum Kopieren**. Aufgabe ist, sie **1:1 in Next.js / TypeScript nachzubauen** (Stack siehe `TECH_STACK.md`).

- `design/Salon 323 – Referenz.html` → Öffnet sich offline im Browser. Das ist die **Wahrheit** für Look & Feel. Im Zweifel gilt immer diese Datei.
- `design/source/Salon 323 v2.dc.html` → Lesbarer Quellcode des Prototyps. Alle Styles sind **inline**: Jeder Wert (px, rgba, Easing, Dauer) kann direkt übernommen werden. Die Logik steht unten in `class Component` (Zustände, Texte, Daten, Berechnungen).
  - Lokal ansehen: Ordner `design/source/` mit einem statischen Server öffnen (z. B. `npx serve design/source`).
  - Tweaks (nur im Prototyp): `showBarber` zeigt den Zugang zum Barber-Portal, `cutsView`, `payOnline` (Online-Zahlung, **standardmässig aus**).

## Fidelity
**High-fidelity.** Farben, Typografie, Abstände, Radien, Glas-Effekte, Animationen und Texte sind final. Nachbau **pixelgenau**. Jede Bewegung soll fliessen und «atmen». Es gibt keine harten Schnitte, kein Weiss-Aufblitzen zwischen Screens und kein Layout-Springen.

Vorgehen: Zuerst jeden Screen in der Referenz öffnen und alle States durchspielen. Danach die Inline-Styles aus `source/` in Komponenten übertragen und mit der Referenz vergleichen (gleicher Viewport, nebeneinander). Getestet werden muss auf **375 px (iPhone SE/mini)**, 390 px, 430 px, 768 px und 1440 px.

---

## Design Tokens

### Farben
| Token | Wert | Verwendung |
|---|---|---|
| `ink` | `#0E141C` | Text auf hell, dunkle Buttons |
| `paper` | `#F4F7FA` | Text auf dunkel, helle Pill-Buttons |
| `page` | `#DFE6EE` | Body-Hintergrund hinter dem Foto |
| `veil` | `#5D6B7C` | Übergangs-Schleier (statt Weiss) |
| `coral` | `#F4A69E` | Akzent: Status-Punkte, Guthaben, «Bestätigt» |
| `coral-deep` | `#E5776C` | Akzent auf hell (Abwesenheit, nächster Tier-Punkt) |
| `ink-62` | `rgba(14,20,28,.62)` | Kicker/Label auf hell |
| `ink-60` | `rgba(14,20,28,.6)` | Sekundärtext auf hell |
| `paper-62` | `rgba(244,247,250,.62)` | Kicker auf dunkel |
| `paper-55` | `rgba(244,247,250,.55)` | Sekundärtext auf dunkel |
| `hair-dark` | `rgba(255,255,255,.1)` | Trennlinien auf dunklem Glas |
| `ping` | `rgba(244,150,140,.6)` | Puls-Ring |

### Glas-Oberflächen (exakt übernehmen)
**Dunkles Glas** (Termin-Card, Booking-Leiste, Menüs, Toast):
```css
background: linear-gradient(115deg, rgba(9,13,22,.82), rgba(22,30,44,.66) 52%, rgba(30,40,58,.52));
backdrop-filter: blur(22px) saturate(160%);
box-shadow: inset 0 0 0 1px rgba(255,255,255,.09), inset 0 1px 0 rgba(255,255,255,.12), 0 30px 60px -30px rgba(10,20,40,.5);
color: #F4F7FA;
```
**Helles Glas** (Service-Kacheln, Vorlage, Tage, Slots):
```css
background: linear-gradient(160deg, rgba(255,255,255,.6), rgba(255,255,255,.28));
backdrop-filter: blur(26px) saturate(170%);
box-shadow: inset 0 0 0 .5px rgba(255,255,255,.55), 0 24px 50px -34px rgba(20,32,52,.4);
```
**Ausgewählt (dunkel massiv):** `linear-gradient(115deg,#151c28,#2c3646 60%,#3a4556)` + `inset 0 0 0 1px rgba(255,255,255,.08), 0 24px 40px -24px rgba(10,20,40,.5)`

**Intro-Cards (Linsen-Glas):** `backdrop-filter: url(#lens2) blur(1.2px) saturate(135%) brightness(1.04)` mit SVG-Displacement-Filter (`lensMap()` im Quellcode). Safari und iOS können keine SVG-Filter in `backdrop-filter`. Fallback dort ist `-webkit-backdrop-filter: blur(5px) saturate(140%)`, also Milchglas. Das ist **so gewollt**. Feature-Detection: `CSS.supports('backdrop-filter','url(#x)')`, und auf WebKit den Fallback erzwingen.

### Typografie
- **Urbanist** 200/300/400/500/600: gesamte UI. Headlines in 200–300, mit Letter-Spacing −.02 bis −.045em.
- **Geist Mono** 300/400: Kicker/Labels (9px, `letter-spacing:.22em`, uppercase), Uhrzeiten in Slots, Jahreszahlen.
- **Nunito** 400–600: nur wo im Quellcode gesetzt.
- Wortmarke «salon 323»: eigene Schrift (geometrisch, spitz), **keine Animation**. Exakt so aus der Referenz übernehmen und als SVG exportieren.

| Rolle | Grösse | Gewicht |
|---|---|---|
| Termin-Uhrzeit | `clamp(66px,10vw,88px)`, lh .88, ls −.045em | 200 |
| H1 Seite | `clamp(28px,4.4vw,40px)`, lh 1.1, ls −.025em | 300 |
| Card-Titel | 16–18px | 300 |
| Body | 13–15.5px | 400–500 |
| Sekundär | 11–11.5px | 400 |
| Kicker | 9px Geist Mono, .22em, uppercase | 400 |

### Radien
Pills `999px` · grosse Cards `34px` · Panels `30–32px` · Kacheln `28px` · Tage `22px` · Info-Zeilen `24px` · Slots `16px`

### Abstände
Gaps 6 / 8 / 10 / 12 / 14 / 18 / 22 / 26 / 30. Seitenrand `clamp(16px,4vw,40px)`. Max-Breiten: App `1040px`, Admin `640px`, Salon `1380px`.
**Safe-Areas:** Überall `env(safe-area-inset-*)` wie im Quellcode, dazu `viewport-fit=cover`.

### Motion
- **Haupt-Easing:** `cubic-bezier(.22,1,.36,1)` (sanftes Auslaufen). Für Übergänge zwischen Szenen `cubic-bezier(.65,0,.35,1)`.
- **Dauern:** Hover/Farbe .6–.9s · Eintritt 1.0–1.6s · Szenenwechsel .95s · Story-Fenster 1.5s · Intro-Cards 3.4s.
- **Keyframes** (alle in `<helmet><style>` im Quellcode): `up`, `fade`, `wordIn`, `float1/2`, `drift/2`, `ping`, `shimmer`, `ringDraw`, `pop`, `halo`, `breathe`, `knob`, `cardMorph`, `tileIn`, `sheetUp` u. a. 1:1 übernehmen.
- **Bildschirmwechsel:** Ein Schleier `#5D6B7C` mit dem Hintergrundfoto (`blur(48px) brightness(.82)`) blendet über .95s ein und wieder aus. **Nie Weiss.**
- `prefers-reduced-motion` muss Drift, Float und Shimmer abschalten. Die Opacity-Übergänge bleiben.

---

## Screens / Views

### 1. Start / Login (`screen: 'login'`)
- Vollbild-Foto `mist.jpg` (Querformat) bzw. `mist-mobile.jpg` (Hochformat). Blendet weich ein, hartes Laden ist verboten.
- Kopfzeile: `N° 323` links. Rechts erscheint der Barber-Zugang, nur wenn eine Barber-Session besteht.
- **Vier Intro-Cards** aus Linsen-Glas mit Radius 26px: «Kol 3,23» · «Dein Termin 14:30» · «Members only» · Paket-Hinweis. Sie steigen von unten auf (3.4s, gestaffelt) und schweben dann (`float1/2`, 9–11s Loop). Ein Tap überspringt das Intro.
- Peek: Wheel oder Wisch nach oben öffnet die Story.
- **Login-Modi**, nur mit Ziffern und ohne erklärenden Text:
  - **Telefon:** Pill-Input (54px, `+41 79 000 00 00`) mit runder Senden-Taste (42px). Danach folgen **SMS-Code-Kästchen** (4er-Grid) mit blinkendem Caret. Auto-Submit, sobald alle Ziffern drin sind.
  - **Einladungscode:** 6 Kästchen, Grossbuchstaben. Status «prüfe …» (Spinner), dann ein korallfarbener Punkt und OK. Danach wird der Button aktiv.
  - Kästchen-Zustände: leer `rgba(255,255,255,.04)`, gefüllt `.14`, aktiv mit Rand `.55`, komplett mit Rand `rgba(244,166,158,.6)`.

### 2. Onboarding (`screen: 'onboard'`, Schritte 0–3)
Nur für neue Mitglieder: Vorname, Nachname, Vorlage (Leistungen) und Bestätigung. Siehe `ob0–ob3` im Quellcode.

### 3. Welcome
Wörter blenden mit `wordIn` (Blur → scharf) ein. Dazu kommt ein **zufälliger Bibelvers** aus `verses` (7 Stück, Luther-Text, mit Referenz). Ein Tap führt in die App.

### 4. App – Home (`tab: 'home'`)
- **Nächster Termin** auf dunklem Glas, min-height 340px, mit einem atmenden Koral-Blob oben rechts (`breathe 9s`).
  - Kicker «Nächster Termin» und rechts «● Bestätigt» (Ping-Puls).
  - Uhrzeit gross, darunter das Datum lang und `{relativ} · 30 min`.
  - Leistungs-Chips. Danach eine Linie, `CHF 20.–` und darunter «Bezahlung vor Ort».
  - Buttons: **Karte** (hell), **Verschieben** (Outline), **Absagen** (Text).
- **Absagen-Flow** (ersetzt die Button-Zeile, Eintritt mit `up 1s`):
  - Titel «Termin freigeben?», darunter «Bis 24 h vorher kostenlos. Der Slot geht sofort zurück in den Kalender.» Rechts «Behalten» (Outline-Pill, 36px).
  - **Halte-Button** 56px, als Spur wie beim Booking-Slider: links ein heller Knopf (44px) mit ✕ und einem **Fortschrittsring** (r=19, dasharray 119.4). Der Text «Gedrückt halten» schimmert (`shimmer 3.2s`).
  - Halten über 1.3s (ease-out) füllt Spur und Ring. Loslassen läuft weich zurück (.8s). Bei 100 % wird der Text zu «Freigegeben», nach 700ms verschwindet der Termin und der Toast «Termin freigegeben» erscheint.
  - **Keine roten Warnfarben.** Alles bleibt in Blaugrau und Weiss.
- Rhythmus-Leiste (ab 2 Besuchen der Takt, sonst «Noch kein Takt.») und die letzten 3 Besuche.

### 5. App – Buchen (`tab: 'book'`)
- **01 — Paket:** 2×2 Kacheln (Haare, Bart, Augenbrauen, Waschen), Seitenverhältnis 1.3/1. Rechts oben steht «Immer 30 min».
  - Unterzeilen: «Schnitt nach Wahl», «Kontur & Pflege», «In Form», «Vor oder nach».
  - **Jeder Termin dauert 30 min**, egal wie viele Leistungen gewählt sind.
- **Schnitt** (nur wenn «Haare» gewählt ist): Pills, die **umbrechen** (nicht scrollen, nicht abschneiden). Reihenfolge: `Burst · Mid · Low · Skin · Taper · Buzz · Schere`.
- **Beratung inklusive** (nur beim **ersten Besuch**, also ohne bisherigen Verlauf): dunkle Zeile mit Koral-Puls. Titel «Beratung inklusive», darunter «Beim ersten Besuch schauen wir zusammen, was zu dir passt.»
- **Vorlage:** «Speichern» bzw. «Aktiv ✓». Die Vorlage ist immer vorgewählt.
- **02 — Tag:** 7-Spalten-Grid mit 14 Tagen. Jeder Tag zeigt Mini-Balken für die Auslastung. Abwesenheiten sind gedimmt.
- **03 — Zeit:** Slots im 4er-Grid, gruppiert in Vormittag und Nachmittag, alle 30 min. Belegte Slots sind durchgestrichen.
- **Buchungsleiste** (fixed unten, dunkles Glas):
  - Wann, also «Di 4. Nov · 14:30». Was, also «Haare (Mid) · Bart · Beratung · 30 min». Rechts der Preis und ggf. «−5 Guthaben».
  - «Bezahlt wird vor Ort – bar oder TWINT.» (Ohne `payOnline` gibt es **keine Zahlungsauswahl und keine hinterlegten Zahlungsmittel**.)
  - **Slider zum Buchen** (60px Spur, 52px Knopf): Der Text schimmert, die Spur füllt sich hinter dem Finger. Ab 85 % rastet er ein, die Spur zieht sich zum Kreis zusammen und ein Häkchen zeichnet sich (`stroke-dashoffset`, .7s, .45s Delay). Dazu ein Puls (`knob`/`halo`).
  - Danach folgt die **Bestätigung** mit Uhr, Datum, Paket, Dauer und Preis.

### 6. App – Karte (`tab: 'card'`)
Member-Card im Wallet-Look (1.586/1). Sie neigt sich mit der Maus/Neigung (Sheen) und flippt per Tap. Rückseite: Termin, Adresse, `CHF 20 · Vor Ort`.

### 7. App – Circle (`tab: 'circle'`)
Invite-Tree, 3 Einladungen pro Mitglied, Codes erzeugen und kopieren. **Stufen:** I Guest (0) · II Member (10) · III Patron (25) · IV Inner Circle (50 Besuche) mit Fortschrittspunkten. Guthaben: CHF 5 pro angenommener Einladung, maximal CHF 20 pro Buchung.

### 8. Story (Overlay)
6 Meilensteine. Ein scharfes Fenster mit Glasrand gleitet über das verschwommene Foto (1.5s). Die Jahreszahl rollt Ziffer für Ziffer, unten läuft eine Zeitleiste. Navigation per Wisch, Scroll, Pfeiltasten oder Punkte.

### 9. Salon-Info (Overlay)
Fotos (image-slots: Raum, Stuhl, Detail), eine Karten-Card «Hier findest du uns» mit **Steineggasse 4, 9113 Degersheim** und den Buttons Apple Maps und Google Maps. Dazu Öffnungsstatus live, Kontakt (Telefon, WhatsApp) und «Gut zu wissen» (6 Fakten, Bezahlung: «Vor Ort – bar oder TWINT am Stuhl. Keine Zahlungsdaten im Portal.»).

### 10. Cuts-Galerie
Modi: compare (Vorher/Nachher-Slider), detail, index. Clip-Path-Übergänge 1.5s. 6 Looks mit Specs (Dauer überall 30 min).

### 11. Rechtliches
Impressum, AGB und Datenschutz mit Umschalter «Einfach / Juristisch». Die Texte stehen in `legalDocs`. **Platzhalter `[ … ]`** füllt der Inhaber aus.

### 12. Barber-Portal (`screen: 'admin'`)
- **Heute:** Ring «Im Stuhl» mit Restzeit, nächster Termin, Timeline des Tages, Start und Fertig.
- **Mitglieder:** Suche, Filter nach Stufe. Detail mit «eingeladen von», Vorlage und Notiz.
- **Verfügbarkeit:**
  - Wochenzeiten pro Tag (± 30 min) und Mittagspause.
  - Ausnahmen pro Tag für die nächsten 14 Tage.
  - Abwesenheiten mit Herkunft `HIER` oder `CALENDLY`.
  - Karte für Calendly (verbunden, «Jetzt synchronisieren»).
- **Umsatz:** Woche und Monat, Besuche, Ø.

---

## Interactions & Behavior (Regeln)
- **Slots:** fix 30 min, Raster 30 min. Pause und Abwesenheiten blocken Slots. Buchbar ist ein Fenster von 14 Tagen.
- **Absagen:** bis 24 h vorher gratis und ohne Rückfrage. Innerhalb von 24 h ist der Halte-Button trotzdem da, mit dem Hinweis aus den AGB (volle Gebühr möglich). Den Text dafür entscheidet der Inhaber.
- **Verschieben:** geht in den Buchen-Tab mit vorausgefüllten Leistungen. Der Preis bleibt.
- **Erster Besuch:** «Beratung» erscheint im Paket-Hinweis, in der Zusammenfassung und im Admin-Termin (Flag `is_first_visit`).
- **Toasts:** dunkles Glas als Pill unten, 2.6s, mit Fade und translateY.
- **Fehler:** falscher Code → Kästchen schütteln sanft (nicht rot), Rand `paper .55`. Bei SMS-Limit erscheint der Hinweis mit Countdown.
- **Laden:** nie Spinner auf leerem Weiss. Skeletons im Glas-Stil oder der Schleier.
- **Tastatur (Mobil):** Die Eingaben bleiben über der Tastatur (`visualViewport`), die Booking-Leiste versteckt sich bei offener Tastatur.

## State Management
Client-Zustand pro Screen (siehe `state` im Quellcode). Server-Zustand kommt aus Supabase, Slots kommen von Calendly (siehe `TECH_STACK.md`). Zentrale Objekte: `member`, `appointment` (nächster), `history[]`, `invites[]`, `template[]`, `availability`, `absences[]`.

## Assets
- `assets/mist.jpg` (Querformat) und `assets/mist-mobile.jpg` (Hochformat): Hintergrund. Per `next/image` mit `priority` laden, dazu ein Blur-Placeholder.
- **Fotos** für Salon und Cuts: Der Inhaber liefert sie. Im Prototyp sind es Platzhalter-Slots.
- Icons: wenige Inline-SVGs (Pfeil, Häkchen, ✕). Übernehmen, **keine Icon-Library**.

## Files
- `design/Salon 323 – Referenz.html`: offline lauffähige Referenz
- `design/source/Salon 323 v2.dc.html`: Quellcode des Prototyps (Markup, Inline-Styles, Logik, Texte)
- `TECH_STACK.md`: Architektur, Datenmodell, Calendly, SMS, Deployment
- `supabase/0001_init.sql`: Start-Schema inkl. RLS
