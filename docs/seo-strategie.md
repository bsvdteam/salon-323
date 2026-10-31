# SEO-Strategie — Salon 15

> Profi-Research & Umsetzungsplan · Stand 2026-10-31
> Domain: `www.salon15.ch` · Markt: Schweiz (de-CH, Europe/Zurich) · Modell: **invite-only Members-Barber**

---

## 0. Der ehrliche Kern zuerst

Salon 15 ist **absichtlich exklusiv** — „Ein Raum, ein Stuhl, ein Barber. Rein kommt, wer eingeladen wird." Das ist ein starkes Markenversprechen und steht in direktem Widerspruch zu „maximale Sichtbarkeit". **Gutes SEO heisst hier nicht „viel Traffic", sondern „die richtigen 50 Leute im Quartier finden uns, der Rest sieht eine saubere, begehrliche Tür".**

Daraus folgen genau **drei realistische SEO-Ziele** — alles andere ist Lärm:

1. **Marken-/Lokalsuche gewinnen.** Wer „Salon 15 Zürich", „Barber [Quartier]", „Coiffeur in der Nähe" googelt, findet uns sofort und richtig — über das **Google-Unternehmensprofil** und eine **crawlbare öffentliche Landing-Page**.
2. **Die App NICHT indexieren.** Mitglieder-, Admin-, Barber-Screens gehören nicht in Google. Das ist bewusst gewollt und muss technisch sauber abgesichert sein.
3. **Zitierbar für KI-Antworten sein (GEO/AEO).** „Guter Barber in [Stadt]?" in ChatGPT/Perplexity/Google AI Overviews — wir wollen als Entität existieren und erwähnt werden können.

Für ein invite-only-Business ist **Local SEO der mit Abstand grösste Hebel** und klassisches Keyword-/Content-SEO der kleinste. Die folgende Research priorisiert entsprechend.

---

## 1. ⚠️ Der #1-Blocker: die App ist (noch) unsichtbar für Google

Das ist der wichtigste Befund der ganzen Analyse.

**Fast jede Route rendert dieselbe Client-Komponente.** `/`, `/story`, `/legal`, `/salon`, `/book`, `/cuts`, `/circle`, `/welcome`, `/onboarding` liefern alle `<SalonApp />` mit `"use client"` und unterschiedlichen `start`-Props. Beispiel `src/app/story/page.tsx`:

```tsx
export default function StoryPage() {
  return <SalonApp start={{ screen: "login", overlay: "story" }} />;
}
```

**Konsequenz:** Der erste HTML-Response jeder Seite ist eine **leere Hülle + JavaScript**. Es gibt pro Route **keinen eindeutigen, serverseitig gerenderten Text**, keine Überschriften, keine Adresse, keine Öffnungszeiten im HTML. Googlebot rendert zwar JS, aber:
- gerendert wird überall derselbe Inhalt (der Login-Screen) → keine rankbaren, einzigartigen Seiten,
- Öffnungszeiten/Adresse/„Story" liegen in Client-State (`@/lib/data`), nicht im crawlbaren HTML,
- KI-Crawler (GPTBot, ClaudeBot, PerplexityBot) rendern **kein** JS → sie sehen effektiv **nichts**.

**Das heisst konkret: Es gibt aktuell quasi nichts zu ranken und nichts zu zitieren.** Jede weitere SEO-Massnahme (Schema, Sitemap, GEO) ist wirkungslos, solange es keine echte, serverseitig gerenderte, öffentliche Inhaltsfläche gibt. Das ist Baustein Nr. 1.

**Lösung (Architektur, nicht Kosmetik):** Eine **öffentliche, serverseitig gerenderte Landing-/Visitenkarten-Seite**, die vom Mitglieder-SPA getrennt ist. Inhalt: Name, was Salon 15 ist, Adresse, Anfahrt, Öffnungszeiten, Kontakt, „auf Einladung" — alles als echtes HTML (Server Component, kein `"use client"`). Das SPA bleibt wie es ist; es braucht nur **eine** gut gemachte öffentliche Tür. Details in §4.

---

## 2. Ist-Zustand — Audit (aus dem Code)

| Bereich | Status | Befund |
|---|---|---|
| **Brand/Domain** | ⚠️ | Code sagt durchgängig **„Salon 15" / `salon15.ch`**. Ordner & Memory sagen „Salon 323". **Welcher Name ist öffentlich?** Marken-/NAP-Konsistenz ist Fundament — das muss *vor* allem anderen fix sein. |
| **`metadataBase`** | ✅ | gesetzt (`https://www.salon15.ch`) — gut, macht OG-/Canonical-URLs absolut. |
| **Default-Metadata** | ✅ | Title, Description, OG, Twitter-Card, `locale: de_CH` in `layout.tsx`. Solide Basis. |
| **`lang`** | ✅ | `<html lang="de-CH">` korrekt. |
| **Fonts** | ✅ | `next/font` mit `display: swap` — kein Render-Blocking, gut für Core Web Vitals. |
| **OG-Image** | ✅ | `public/og.jpg` (1200×630) vorhanden, zentral in `lib/site.ts`. |
| **Icons/Favicon** | ✅ | `favicon.ico`, `icon.svg`, `apple-icon.png` vorhanden. |
| **Invite-Route-Metadata** | ✅ | `i/[code]` nutzt `generateMetadata` dynamisch (Inviter-Name im Preview) — sauber gemacht. |
| **`robots.txt`** | ❌ | **fehlt.** |
| **`sitemap.xml`** | ❌ | **fehlt.** |
| **`manifest`** (PWA) | ❌ | fehlt (`themeColor`/Icons da, aber kein Manifest). |
| **JSON-LD / Schema** | ❌ | **keine strukturierten Daten.** Kein `LocalBusiness`/`HairSalon`. |
| **Per-Route-Content (SSR)** | ❌ | siehe §1 — der Kernblocker. |
| **Canonical-Tags** | ❌ | nicht gesetzt (unkritisch, solange es nur eine öffentliche Seite gibt). |
| **NAP im HTML** | ❌ | Adresse/Telefon stehen nur als Platzhalter in `salon.tsx` (`[Haltestelle X]`, `a1/a2` aus `lib/data`) und nur client-seitig. Echte Daten fehlen noch. |

**Fazit:** Das *Metadata-Handwerk* ist überdurchschnittlich sauber. Was fehlt, ist die **crawlbare Substanz** (SSR-Inhalt, Schema, Sitemap/Robots) und die **lokale Präsenz** ausserhalb der Website (GBP, Verzeichnisse).

---

## 3. Strategie-Leitplanken (was wir tun / was wir lassen)

**Tun:**
- Eine exzellente öffentliche Landing-Page + Google-Unternehmensprofil als Zentrum.
- NAP (Name, Adresse, Telefon) überall **byte-identisch**.
- Schema `HairSalon`, Sitemap, Robots, Manifest.
- KI-Crawler gezielt auf die öffentliche Seite lassen, von der App fernhalten.

**Lassen (bewusst):**
- Kein Blog/Content-Marathon „10 Haarschnitt-Trends 2026" — passt nicht zur Marke, bindet Pflegeaufwand.
- Keine aggressive Keyword-Jagd auf generische Terme — wir wollen nicht „der billigste Coiffeur" sein.
- **Keine erfundenen Bewertungen / kein `aggregateRating`-Markup ohne echte, sichtbare Reviews** — Google hat selbstbediente Review-Markups auf der eigenen Seite stark eingeschränkt; echte Bewertungen gehören ins GBP, nicht ins Schema der eigenen Domain.
- App-Screens nicht öffentlich „SEO-optimieren" — sie sollen `noindex` sein.

---

## 4. Technischer Umsetzungsplan (Next.js 16)

Reihenfolge = Priorität. API-Details gegen die lokalen Next-16-Docs geprüft (`node_modules/next/dist/docs/...`), nicht aus dem Gedächtnis.

### 4.1 Öffentliche SSR-Landing-Page (Fundament)
- Eine Server Component (kein `"use client"`) als öffentliche Tür — entweder die Startseite oder z. B. `/salon` als echte Marketing-/Visitenkarten-Seite, getrennt vom SPA.
- Muss als **echtes HTML** enthalten: `<h1>Salon 15</h1>`, 1–2 Sätze Positionierung, Adresse, Öffnungszeiten (als Text **und** als `<time>`/Schema), Anfahrt (ÖV/Parken), Kontakt (Tel./Mail/WhatsApp), Hinweis „Zutritt auf Einladung", Link zum Einladungs-Flow.
- Darunter/daneben darf das SPA weiterleben; crawlbar muss nur dieser statische Teil sein.

### 4.2 `app/robots.ts`
Öffentliche Seite erlauben, App-Interna sperren, Sitemap referenzieren. Next-16 unterstützt Pro-Agent-Regeln (`v16.3.0`: Feld `other`).
```ts
// app/robots.ts
import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/barber", "/book", "/card", "/circle", "/cuts", "/onboarding", "/welcome", "/api/"] },
    ],
    sitemap: "https://www.salon15.ch/sitemap.xml",
    host: "https://www.salon15.ch",
  };
}
```
> KI-Crawler (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) hier **bewusst erlauben** für die öffentliche Seite — das ist die Voraussetzung für GEO/AEO (§6).

### 4.3 `app/sitemap.ts`
Nur die wenigen **öffentlichen** URLs (nicht die App-Screens):
```ts
import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://www.salon15.ch", lastModified: new Date(), changeFrequency: "monthly", priority: 1 },
    // ggf. /legal als eigene öffentliche Seite
  ];
}
```

### 4.4 JSON-LD `HairSalon` auf der Landing-Page
Als `<script type="application/ld+json">` **serverseitig** gerendert, Werte deckungsgleich mit GBP (§5/§7).

### 4.5 `noindex` für die App-Hülle
Da App-Routen dieselbe Hülle liefern: entweder per `robots.ts`-Disallow (oben) und/oder Per-Route-Metadata `robots: { index: false }` auf den gegateten Routen, damit versehentlich gecrawlte Screens nicht indexieren.

### 4.6 Nice-to-have
- `app/manifest.ts` (PWA, Name, Theme-Color — Icons sind schon da).
- `alternates.canonical` auf der Landing-Page.
- Core Web Vitals messen (die `mist.jpg`-Hintergründe gewichten LCP — prüfen, ob sie `priority`/korrekt dimensioniert geladen werden).

---

## 5. Local SEO — der grösste Hebel (Research)

Google dokumentiert offiziell nur **drei** lokale Faktoren: **Relevanz, Distanz, Prominenz**. Prozent-Gewichtungen aus Agentur-Blogs/Whitespark-Umfragen sind Schätzungen, nicht Google-Fakten — entsprechend vorsichtig behandeln. Was praktisch zählt:

**Google-Unternehmensprofil (höchste Priorität).** Google hält in der Schweiz ~81,6 % Suchanteil (Mai 2026), also ist das Profil die wichtigste einzelne Massnahme. Hebel, die wir steuern können (Adresse lässt sich nicht verschieben):
- **Primärkategorie korrekt** — „Barbier"/„Herrenfriseur" statt generisch „Coiffeur". Die Primärkategorie gilt in Umfragen als stärkster Pack-Faktor.
- **Vollständiges Profil**: Öffnungszeiten (inkl. Feiertage), Fotos, Beschreibung, Telefon, Website-Link auf die neue Landing-Page, Attribute.
- **Bewertungen**: Anzahl + Qualität sind ein Kernfaktor der „Prominenz". Für ein invite-only-Haus: **wenige, aber echte** Reviews von Mitgliedern aktiv einholen. Das passt zur Marke (kurated) und ist der ehrlichste Weg zu `aggregateRating`-Signalen — über GBP, nicht über Fake-Markup.
- Erste GBP-Effekte oft in **2–6 Wochen** sichtbar.

**NAP-Konsistenz (Fundament).** Name, Adresse, Telefon **byte-identisch** auf: Website-Landing-Page, GBP, local.ch, search.ch. Abweichende Schreibweisen „zerstreuen Signale und verwirren Google". → Erst Brand-Name final klären (Salon 15 vs 323!), dann überall gleich.

**Schweizer Verzeichnisse (Citations).** Die zentralen:
- **local.ch** und **search.ch** — gehören beide zu *localsearch*; ein Eintrag wird i. d. R. in allen deren Verzeichnissen ausgespielt. Pflicht.
- **Bing Places** — internationale Ergänzung (auch Basis für Apple Maps / teils ChatGPT via Bing).
- **Apple Maps** (Apple Business Connect) — relevant für iPhone-Nutzer, passt zur Wallet-Pass-Zielgruppe des Projekts.
- Branchen-/Buchungsplattformen (z. B. Treatwell u. ä.) nur, wenn sie zum invite-only-Modell passen — eher zurückhaltend.

> Kostenschätzungen aus Agentur-Seiten (Setup CHF 2–5k, laufend CHF 0.5–2k/Mt.) sind grobe Marketing-Zahlen — als Grössenordnung, nicht als Fakt lesen.

---

## 6. GEO / AEO — zitierbar für KI-Antworten (Research, 2026)

GEO (Generative Engine Optimization) und AEO (Answer Engine Optimization) werden meist synonym genutzt. Konsens vs. Unsicherheit aus der Research:

**Konsens (lohnt sich):**
- **Answer-first-Struktur**: nach jeder Überschrift 1–2 fettgedruckte, in sich geschlossene Sätze, die die Frage direkt beantworten. Für uns: „Salon 15 ist ein Barber in [Stadt], Zutritt auf Einladung. Adresse: … Öffnungszeiten: …"
- **Entitäts-Konsistenz + Schema** (§7) — hilft KI, uns als Entität zu erkennen.
- **Crawl-Zugang sicherstellen**: KI-Bots dürfen in `robots.txt` nicht blockiert sein (§4.2 erlaubt sie bewusst für die öffentliche Seite).
- **Klassisches Ranking zählt weiter**: Berichte nennen, dass ~92 % der AI-Overview-Zitate aus Top-10-Seiten stammen → eine saubere, rankende Landing-Page ist Voraussetzung.

**Umstritten (niedrig priorisieren):**
- **`llms.txt`**: von manchen als Best Practice verkauft, aber Log-Analysen 2026 zeigen, dass die grossen Crawler es heute weitgehend ignorieren. **Günstig, aber unbewiesen** — optional, nicht Pflicht.
- Freshness-Gewichtung: Quellen widersprechen sich. Nicht überoptimieren.

> Fast alle GEO-Zahlen stammen aus Vendor-Blogs und sind nicht unabhängig verifiziert. Pragmatisch: saubere SSR-Seite + Schema + echte NAP-Daten = 90 % des GEO-Nutzens. Danach: 10–20 reale Suchanfragen („Barber [Stadt]", „Coiffeur Einladung …") in ChatGPT/Perplexity/Google AI Overviews manuell testen und beobachten, ob/wie Salon 15 auftaucht.

---

## 7. Konkretes Schema (`HairSalon` JSON-LD)

Serverseitig auf die öffentliche Landing-Page, Werte = GBP. `BarberShop` existiert **nicht** als Schema.org-Typ → **`HairSalon`** ist der spezifischste gültige Typ. Platzhalter ersetzen:

```json
{
  "@context": "https://schema.org",
  "@type": "HairSalon",
  "@id": "https://www.salon15.ch/#salon",
  "name": "Salon 15",
  "description": "Ein Raum, ein Stuhl, ein Barber. Zutritt auf Einladung.",
  "url": "https://www.salon15.ch",
  "telephone": "+41 …",
  "email": "cuts@salon15.ch",
  "image": "https://www.salon15.ch/og.jpg",
  "priceRange": "$$$",
  "currenciesAccepted": "CHF",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "…",
    "postalCode": "…",
    "addressLocality": "…",
    "addressCountry": "CH"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": 0, "longitude": 0 },
  "openingHoursSpecification": [
    { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Tuesday","Wednesday","Thursday","Friday"], "opens": "…", "closes": "…" }
  ],
  "areaServed": { "@type": "City", "name": "…" },
  "sameAs": ["https://www.instagram.com/…", "https://local.ch/…"]
}
```
Validieren mit **Google Rich Results Test** + **Schema.org Validator**. `geo`/`address` müssen exakt zum GBP passen (sonst widersprüchliche Standortsignale). **Kein `aggregateRating`**, solange keine echten, auf der Seite sichtbaren Reviews existieren.

---

## 8. Priorisierter Aktionsplan (Impact × Aufwand)

| # | Massnahme | Impact | Aufwand | Wann |
|---|---|---|---|---|
| 1 | **Brand-Name final klären** (Salon 15 vs 323) + überall byte-identisch | 🔴 kritisch | S | sofort |
| 2 | **Echte NAP-Daten** (Adresse, Tel., Öffnungszeiten) eintragen | 🔴 kritisch | S | sofort |
| 3 | **Google-Unternehmensprofil** anlegen/verifizieren, voll ausfüllen, Primärkategorie „Barbier" | 🔴 hoch | M | Woche 1 |
| 4 | **Öffentliche SSR-Landing-Page** (§4.1) — echtes HTML, NAP, „auf Einladung" | 🔴 hoch | L | Woche 1–2 |
| 5 | **`robots.ts` + `sitemap.ts`** (§4.2/4.3) | 🟠 mittel | S | mit #4 |
| 6 | **`HairSalon` JSON-LD** auf der Landing-Page (§7) | 🟠 mittel | S | mit #4 |
| 7 | **local.ch + search.ch + Bing/Apple** Einträge, NAP-konsistent | 🟠 mittel | M | Woche 2–3 |
| 8 | **`noindex`/Disallow** für App-Screens absichern (§4.5) | 🟡 niedrig | S | mit #5 |
| 9 | **Echte Mitglieder-Reviews** im GBP einholen (laufend) | 🟠 mittel | laufend | ab Woche 2 |
| 10 | **GEO-Test** (manuelle KI-Abfragen) + optional `llms.txt` | 🟡 niedrig | S | Monat 2 |
| 11 | **Core Web Vitals** prüfen (LCP-Bilder) + `manifest.ts` | 🟡 niedrig | S | Monat 2 |

Die ersten **vier** Punkte bringen ~80 % des Ergebnisses. Alles davor (Schema, Sitemap, GEO) ist ohne #1–#4 wirkungslos.

---

## 9. Mapping zum Inspirations-Repo (`seoskillsai/seo-skills-ai`)

Das Repo ist eine umfassende SEO-Agent-Suite (27 Sub-Skills, lokale Python-Engines, MIT). Was davon **auf Salon 15 passt** — und was bewusst nicht:

| Repo-Skill | Für uns relevant? |
|---|---|
| `/seo local` (GBP-Checks, NAP-Konsistenz) | ✅ **Kern** — exakt unser Hebel §5 |
| `/seo maps` (Geo-Grid, Proximity, Reviews) | ✅ passend für lokalen Barber |
| `/seo schema` (JSON-LD `@graph`, deprecated-Typen flaggen) | ✅ §7 |
| `/seo technical` (Core Web Vitals, Canonicals, Redirects, **SPA-Hydration**) | ✅ adressiert genau unseren §1-Blocker |
| `/seo geo` + `/seo robots-ai` (Citability, KI-Crawler) | ✅ §6/§4.2 |
| `/seo content`, `/seo cluster`, `/seo info-gain`, `/seo programmatic` | ⚪ eher nicht — wir machen bewusst kein Content-Marketing (§3) |
| `/seo ecommerce`, `/seo hreflang`, `/seo discover` | ⚪ nicht relevant (kein Shop, einsprachig de-CH, kein News) |

Takeaway: Die *Methodik* des Repos (SSR-Substanz → Schema → lokale Prominenz → KI-Zitierbarkeit, mit „erfinde keine Zahlen") deckt sich mit diesem Plan. Für ein invite-only-Haus nutzen wir nur den lokalen + technischen Teil, nicht die Content-/Programmatic-Schiene.

---

## Quellen

Local Pack / GBP:
- [Google Local Pack Ranking Factors 2026 — bgrreview](https://bgrreview.com/insights/local-pack-ranking-factors-2026)
- [Google Business Profile Optimization 2026 — crawl2web](https://crawl2web.com/blog/google-business-profile-optimization-guide/)
- [Local Pack vs Organic 2026 — flashcrafter](https://www.flashcrafter.ai/guides/local-pack-vs-organic-2026)
- [Google Business Profile Statistics 2026 — searchlab](https://searchlab.nl/en/statistics/google-business-profile-statistics-2026)

Local SEO Schweiz:
- [Complete Guide for Local SEO in Switzerland — ranktracker](https://www.ranktracker.com/blog/a-complete-guide-for-doing-local-seo-in-switzerland/)
- [Local SEO Switzerland Specifics — blckalpaca](https://blckalpaca.at/en/knowledge-base/seo-geo/local-seo/local-seo-switzerland-specifics-and-strategies)
- [15 wichtigste Schweizer Verzeichnisse — blckalpaca](https://blckalpaca.at/en/knowledge-base/seo-geo/local-seo/business-directories-switzerland-the-15-most-important-listings)
- [Local SEO Schweiz — bare-creative](https://www.bare-creative.ch/en/blog/local-seo-schweiz)

GEO / AEO:
- [GEO Complete 2026 Guide — toponseek](https://www.toponseek.com/en/blogs/generative-engine-optimization/)
- [AEO Guide 2026 — loudface](https://www.loudface.co/blog/answer-engine-optimization-guide-2026)
- [AEO/GEO for ChatGPT, Gemini, Perplexity — anjubatta](https://anjubatta.github.io/blog/aeo-geo-ai-search-optimization)

Schema:
- [Local Business Schema Guide — schemavalidator](https://schemavalidator.pages.dev/guides/local-business-schema-guide)
- [Schema Markup JSON-LD for Local Businesses — dev.to](https://dev.to/sabrielagency/schema-markup-json-ld-for-local-businesses-a-practical-implementation-guide-2n25)

Next.js 16 (lokale Docs): `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/{robots,sitemap}.md`

Inspiration: [github.com/seoskillsai/seo-skills-ai](https://github.com/seoskillsai/seo-skills-ai)
