"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function BookingCta() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f4f1ea] px-6 py-32 text-center text-[#14110c]">
      <span className="font-label text-xs tracking-[0.28em] text-[#14110c]/50 uppercase">
        Dein Stuhl ist bereit
      </span>
      <h2 className="font-display mt-6 max-w-[15ch] text-[clamp(40px,8vw,116px)] leading-[0.92] font-semibold tracking-tight">
        Dein nächster Schnitt beginnt hier.
      </h2>
      <p className="mt-6 text-[#14110c]/60">Präzision, gebaut um dich.</p>

      <Link
        href={siteConfig.booking.href}
        className={cn(buttonVariants(), "mt-10 h-12 gap-2 px-8 text-sm")}
      >
        {siteConfig.booking.label}
        <span aria-hidden>↗</span>
      </Link>

      <p className="font-label mt-6 text-xs tracking-[0.24em] text-[#14110c]/45 uppercase">
        {siteConfig.location} · {siteConfig.sessionLength}
      </p>

      {/* Haar-Boden — 4K-PNG (transparent) unter public/images/footer-hair.png ablegen.
          Erst unsichtbar, blendet sanft ein sobald geladen; fehlt es, bleibt es unsichtbar. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/footer-hair.png"
        alt=""
        aria-hidden
        ref={(el) => {
          if (el && el.complete && el.naturalWidth > 0)
            el.style.opacity = "1";
        }}
        onLoad={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[26vh] w-full object-cover object-bottom opacity-0 transition-opacity duration-700 select-none"
      />
    </section>
  );
}
