import type { ReactNode } from "react";
import Link from "next/link";

import { siteConfig } from "@/config/site";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0908]">
      <header className="border-b border-[#ece4d8]/12">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-[#ece4d8]">
          <Link
            href="/"
            className="font-display text-sm font-semibold tracking-[0.1em]"
          >
            {siteConfig.name}
          </Link>
          <span className="font-label hidden text-xs tracking-[0.24em] text-[#ece4d8]/50 uppercase md:block">
            {siteConfig.location}
          </span>
          <Link
            href="/"
            className="font-label text-xs tracking-[0.2em] text-[#ece4d8]/70 uppercase transition-colors hover:text-[#ece4d8]"
          >
            Zurück zum Studio ↗
          </Link>
        </div>
      </header>

      {children}
    </div>
  );
}
