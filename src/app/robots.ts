import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// The public door (/, /salon, /legal, /i/...) stays crawlable — including for
// AI crawlers (GPTBot, ClaudeBot, PerplexityBot), which only read HTML and need
// the server-rendered content + JSON-LD on the landing page. The member/barber
// app screens and the API are kept out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/barber",
        "/book",
        "/card",
        "/circle",
        "/cuts",
        "/onboarding",
        "/welcome",
        "/api/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
