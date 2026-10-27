import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function LandingHero() {
  return (
    <section className="bg-stone-50">
      <div className="mx-auto flex max-w-6xl flex-col items-start px-6 py-24 md:py-36">
        <span className="mb-5 text-xs tracking-[0.2em] text-stone-500 uppercase">
          {siteConfig.tagline}
        </span>

        <h1 className="max-w-3xl text-4xl leading-[1.05] font-semibold tracking-tight text-stone-900 md:text-6xl">
          Dein Look. Neu definiert bei {siteConfig.name}.
        </h1>

        <p className="mt-6 max-w-xl text-lg text-stone-600">
          Moderner Haarsalon für Schnitt, Farbe und Styling — mit Zeit für dich
          und deinen perfekten Look.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href={siteConfig.booking.href}
            className={cn(buttonVariants(), "h-11 px-6 text-sm")}
          >
            {siteConfig.booking.label}
          </Link>
          <Link
            href="#leistungen"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 px-6 text-sm",
            )}
          >
            Leistungen ansehen
          </Link>
        </div>
      </div>
    </section>
  );
}
