import type { Metadata, Viewport } from "next";
import { Urbanist, Geist_Mono, Nunito } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Salon 15 — Members only",
  description:
    "Ein Raum, ein Stuhl, ein Barber. Rein kommt, wer eingeladen wird.",
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
