import Link from "next/link";

import { siteConfig } from "@/config/site";

export const metadata = { title: "Termin buchen" };

export default function BookingPage() {
  const { booking, contact } = siteConfig;

  return (
    <div className="min-h-screen bg-[#ece4d8] text-[#1a1712]">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <Link
          href="/"
          className="font-display text-lg font-semibold tracking-tight"
        >
          {siteConfig.name}
        </Link>
        <Link
          href="/"
          className="font-label text-xs tracking-[0.2em] text-[#1a1712]/60 uppercase transition-colors hover:text-[#1a1712]"
        >
          ← Zurück
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-6 pt-8 pb-32">
        <span className="font-label text-xs tracking-[0.28em] text-[#1a1712]/50 uppercase">
          Termin
        </span>
        <h1 className="font-display mt-4 text-[clamp(36px,6vw,80px)] leading-none font-semibold tracking-tight">
          Termin buchen
        </h1>

        {booking.embedUrl ? (
          <div className="mt-12 overflow-hidden rounded-lg border border-[#1a1712]/15">
            <iframe
              src={booking.embedUrl}
              title="Online-Terminbuchung"
              className="h-[80vh] w-full"
            />
          </div>
        ) : (
          <div className="mt-12">
            <div className="flex min-h-[46vh] flex-col items-center justify-center rounded-lg border border-dashed border-[#1a1712]/25 p-10 text-center">
              <span className="font-label text-xs tracking-[0.2em] text-[#1a1712]/45 uppercase">
                Buchungstool
              </span>
              <p className="mt-4 max-w-md text-[#1a1712]/60">
                Hier wird euer externes Buchungstool (z. B. Treatwell, Shore,
                Salonkee) eingebettet. Trage die Embed-URL in{" "}
                <code>siteConfig.booking.embedUrl</code> ein.
              </p>
            </div>

            <div className="mt-10 text-[#1a1712]/70">
              <p>Bis dahin direkt buchen:</p>
              <p className="mt-2">
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="underline underline-offset-2 hover:text-[#1a1712]"
                >
                  {contact.phone}
                </a>{" "}
                ·{" "}
                <a
                  href={`mailto:${contact.email}`}
                  className="underline underline-offset-2 hover:text-[#1a1712]"
                >
                  {contact.email}
                </a>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
