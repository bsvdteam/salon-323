// Single source of truth for public SEO / structured data.
// NAP (Name, Adresse, Telefon) is reused from lib/data so it can never drift
// from what the app itself shows. Everything here must match the Google
// Unternehmensprofil byte-for-byte (same spelling, same number, same hours).

import { salon } from "@/lib/data";

/** Absolute site origin, no trailing slash. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.salon15.ch"
).replace(/\/$/, "");

type OpeningHours = { days: string[]; opens: string; closes: string };

export const BUSINESS = {
  name: "Salon 15",
  owner: "Laurin Girardet",
  /** Degersheim-first — this is what people actually search for. */
  tagline: "Coiffeur & Barber in Degersheim",
  description:
    "Salon 15 ist der Coiffeur und Barber von Laurin Girardet in Degersheim — " +
    "Haarschnitt, Bart und Augenbrauen. Ein Raum, ein Stuhl, ein Barber. " +
    "Zutritt auf Einladung.",

  // Address (from lib/data — Steineggasse 4, 9113 Degersheim)
  street: salon.a1,
  postalCode: "9113",
  city: "Degersheim",
  region: "St. Gallen",
  country: "CH",

  // Contact
  phone: salon.phone, // "+41 79 912 91 24" (display)
  phoneE164: "+41799129124",
  whatsapp: salon.wa,
  email: "cuts@salon15.ch",

  priceRange: "$$$",

  // Leistungen (fürs Angebot im Schema)
  services: ["Haarschnitt", "Bartpflege & Kontur", "Augenbrauen", "Haarwäsche"],

  // TODO(seo): durch die EXAKTEN Koordinaten aus dem Google-Unternehmensprofil
  // ersetzen (Profil öffnen → Pin → Koordinaten). Grobe Ortsmitte Degersheim:
  geo: { lat: 47.3897, lng: 9.2017 },

  // TODO(seo): echte Öffnungszeiten eintragen — müssen mit dem GBP übereinstimmen.
  // Sobald hier Einträge stehen, werden sie automatisch als
  // openingHoursSpecification ins Schema ausgegeben. dayOfWeek auf Englisch:
  // z. B. { days: ["Tuesday","Wednesday","Thursday","Friday"], opens: "09:00", closes: "18:00" }
  hours: [] as OpeningHours[],

  // TODO(seo): echte Profile eintragen — Instagram, local.ch, search.ch, GBP.
  // Das sind die `sameAs`-Verweise, die Google/KI die Entität bestätigen.
  sameAs: [] as string[],
} as const;
