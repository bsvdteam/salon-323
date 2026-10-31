import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// Only public, crawlable URLs belong here — not the gated app screens.
// Right now the homepage is the one public, server-rendered ranking surface.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
      images: [`${SITE_URL}/og.jpg`],
    },
  ];
}
