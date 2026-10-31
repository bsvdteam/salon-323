import { BUSINESS, SITE_URL } from "@/lib/seo";

// Server-rendered SEO layer for the public door. Two jobs:
//  1. JSON-LD (HairSalon) — invisible by design, the strongest local + AI
//     signal; works even for crawlers that don't run JavaScript.
//  2. A concise, accurate, screen-reader-accessible description of the
//     business so text-only crawlers have real content to read. It mirrors
//     what the brand is — not keyword stuffing — and doubles as an a11y win.
// This component must stay a Server Component (no "use client"): its markup
// has to be in the initial HTML response.

const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export function PublicSeo() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "@id": `${SITE_URL}/#salon`,
    name: BUSINESS.name,
    description: BUSINESS.description,
    url: SITE_URL,
    telephone: BUSINESS.phoneE164,
    email: BUSINESS.email,
    image: `${SITE_URL}/og.jpg`,
    priceRange: BUSINESS.priceRange,
    currenciesAccepted: "CHF",
    founder: { "@type": "Person", name: BUSINESS.owner },
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.street,
      postalCode: BUSINESS.postalCode,
      addressLocality: BUSINESS.city,
      addressRegion: BUSINESS.region,
      addressCountry: BUSINESS.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: BUSINESS.geo.lat,
      longitude: BUSINESS.geo.lng,
    },
    areaServed: { "@type": "City", name: BUSINESS.city },
    makesOffer: BUSINESS.services.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s },
    })),
    ...(BUSINESS.hours.length
      ? {
          openingHoursSpecification: BUSINESS.hours.map((h) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: h.days,
            opens: h.opens,
            closes: h.closes,
          })),
        }
      : {}),
    ...(BUSINESS.sameAs.length ? { sameAs: BUSINESS.sameAs } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section style={srOnly}>
        <h1>Salon 15 — Coiffeur &amp; Barber in Degersheim</h1>
        <p>{BUSINESS.description}</p>
        <p>
          Adresse: {BUSINESS.street}, {BUSINESS.postalCode} {BUSINESS.city} (
          {BUSINESS.region}). Telefon: {BUSINESS.phone}.
        </p>
        <p>Leistungen: {BUSINESS.services.join(", ")}.</p>
      </section>
    </>
  );
}
