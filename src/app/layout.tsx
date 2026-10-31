import type { Metadata, Viewport } from "next";
import { Urbanist, Geist_Mono, Nunito } from "next/font/google";
import "./globals.css";
import { OG_IMAGE } from "@/lib/site";

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
  variable: "--font-urbanist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-geist-mono",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-nunito",
  display: "swap",
});

const title = "Salon 15 — Coiffeur & Barber in Degersheim";
const description =
  "Coiffeur und Barber in Degersheim: Haarschnitt, Bart und Augenbrauen bei " +
  "Salon 15. Ein Raum, ein Stuhl, ein Barber — Zutritt auf Einladung.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.salon15.ch",
  ),
  title,
  description,
  openGraph: {
    type: "website",
    siteName: "Salon 15",
    locale: "de_CH",
    title,
    description,
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // browser chrome tinted like the photo's top edge (portrait / landscape)
  themeColor: [
    { media: "(max-aspect-ratio: 9 / 10)", color: "#afc4d7" },
    { media: "(min-aspect-ratio: 9 / 10)", color: "#ced9e2" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="de-CH"
      className={`${urbanist.variable} ${geistMono.variable} ${nunito.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
