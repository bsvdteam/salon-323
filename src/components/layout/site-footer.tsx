import Link from "next/link";

import { siteConfig } from "@/config/site";

export function SiteFooter() {
  const { contact } = siteConfig;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#14110c] text-[#ece4d8]">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <span className="font-label text-xs tracking-[0.28em] text-[#ece4d8]/45 uppercase">
              Kontakt
            </span>
            <div className="mt-5 space-y-1 text-sm text-[#ece4d8]/80">
              <p>{contact.address}</p>
              <p>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="transition-colors hover:text-[#ece4d8]"
                >
                  {contact.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${contact.email}`}
                  className="transition-colors hover:text-[#ece4d8]"
                >
                  {contact.email}
                </a>
              </p>
            </div>
          </div>

          <div>
            <span className="font-label text-xs tracking-[0.28em] text-[#ece4d8]/45 uppercase">
              Öffnungszeiten
            </span>
            <dl className="mt-5 space-y-2 text-sm text-[#ece4d8]/80">
              {contact.hours.map((h) => (
                <div key={h.day} className="flex justify-between gap-6">
                  <dt>{h.day}</dt>
                  <dd className="text-[#ece4d8]/50">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="flex flex-col md:items-end">
            <span className="font-label text-xs tracking-[0.28em] text-[#ece4d8]/45 uppercase">
              Rechtliches
            </span>
            <nav className="mt-5 space-y-2 text-sm text-[#ece4d8]/80 md:text-right">
              <Link href="/impressum" className="block hover:text-[#ece4d8]">
                Impressum
              </Link>
              <Link href="/agb" className="block hover:text-[#ece4d8]">
                AGB
              </Link>
              <Link href="/datenschutz" className="block hover:text-[#ece4d8]">
                Datenschutz
              </Link>
            </nav>
          </div>
        </div>

        <div className="mt-20 border-t border-[#ece4d8]/12 pt-10">
          <div className="font-display text-[clamp(56px,18vw,280px)] leading-[0.8] font-semibold tracking-tight">
            {siteConfig.name}
          </div>
          <p className="font-label mt-8 text-xs tracking-[0.2em] text-[#ece4d8]/40">
            © {year} {siteConfig.name} — {siteConfig.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
