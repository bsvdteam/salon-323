import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BUSINESS.name} — ${BUSINESS.tagline}`,
    short_name: BUSINESS.name,
    description: BUSINESS.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ced9e2",
    theme_color: "#ced9e2",
    lang: "de-CH",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
