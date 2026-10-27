// Zentrale Website-Konfiguration.
// Pro Projekt nur diese Datei anpassen — Name, Inhalte, Kontakt.
export const siteConfig = {
  name: "Salon 323",
  description: "Salon 323 — Haarsalon & Studio.",
  tagline: "Haarsalon & Studio",
  location: "St. Gallen",
  sessionLength: "45–60 Min",
  url: "https://salon-323.example.com",
  locale: "de",
  booking: {
    label: "Termin buchen",
    href: "/booking",
    // Externes Buchungstool hier einbetten (z. B. Treatwell/Shore/Salonkee).
    embedUrl: "",
  },
  nav: [
    { label: "Manifest", href: "/#manifest" },
    { label: "Geschichte", href: "/#geschichte" },
    { label: "Leistungen", href: "/#leistungen" },
    { label: "Studio", href: "/#studio" },
  ],
  manifesto:
    "Haar ist Ausdruck. Wir formen es mit Präzision, Ruhe und einem Blick fürs Wesentliche — bis daraus dein Look wird.",
  history: [
    {
      year: "2019",
      title: "Der Anfang",
      text: "Salon 323 öffnet mit einer klaren Idee: Handwerk und Zeit statt Fließband.",
    },
    {
      year: "2021",
      title: "Das Studio wächst",
      text: "Neuer Raum, größeres Team — dieselbe Haltung zu Qualität und Detail.",
    },
    {
      year: "2023",
      title: "Signature-Stil",
      text: "Unsere Handschrift bei Schnitt und Farbe wird zum Markenzeichen.",
    },
    {
      year: "2026",
      title: "Heute",
      text: "Ein fester Ort für alle, die ihren Look ernst nehmen.",
    },
  ],
  services: [
    {
      title: "Schnitt",
      description: "Präziser Cut, abgestimmt auf Typ und Haarstruktur.",
    },
    {
      title: "Farbe",
      description: "Von natürlichen Nuancen bis zu ausdrucksstarken Tönen.",
    },
    {
      title: "Styling",
      description: "Der perfekte Look für den Alltag oder den großen Auftritt.",
    },
    {
      title: "Beratung",
      description: "Individuelle Beratung zu Schnitt, Farbe und Pflege.",
    },
  ],
  // Echte Cuts — 4K-Fotos ablegen unter public/images/cuts/…
  cuts: [
    { name: "Textured French Crop", client: "Nico", image: "/images/cuts/cut-1.jpg" },
    { name: "Modern Mullet", client: "Luca", image: "/images/cuts/cut-2.jpg" },
    { name: "Classic Taper", client: "Jonas", image: "/images/cuts/cut-3.jpg" },
    { name: "Curly Crop", client: "Elias", image: "/images/cuts/cut-4.jpg" },
    { name: "Buzz Fade", client: "Sam", image: "/images/cuts/cut-5.jpg" },
    { name: "Long Layers", client: "Mara", image: "/images/cuts/cut-6.jpg" },
  ],
  testimonials: [
    { quote: "Der beste Schnitt, den ich je hatte.", author: "M. K." },
    { quote: "Ruhe, Präzision, ehrliche Beratung.", author: "L. B." },
    { quote: "Man fühlt sich sofort verstanden.", author: "S. R." },
    { quote: "Ein Ort, an dem Handwerk zählt.", author: "J. T." },
  ],
  contact: {
    address: "Musterstraße 323, 9000 St. Gallen",
    phone: "+41 00 000 00 00",
    email: "hallo@salon-323.ch",
    hours: [
      { day: "Dienstag – Freitag", time: "09:00 – 19:00" },
      { day: "Samstag", time: "09:00 – 16:00" },
      { day: "Sonntag & Montag", time: "geschlossen" },
    ],
  },
  social: {
    instagram: "",
  },
} as const;

export type SiteConfig = typeof siteConfig;
