import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-stone-50/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-stone-900"
        >
          {siteConfig.name}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {siteConfig.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-stone-600 transition-colors hover:text-stone-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href={siteConfig.booking.href}
          className={cn(buttonVariants({ size: "sm" }))}
        >
          {siteConfig.booking.label}
        </Link>
      </div>
    </header>
  );
}
