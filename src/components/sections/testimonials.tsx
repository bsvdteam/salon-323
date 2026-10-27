import { siteConfig } from "@/config/site";

export function Testimonials() {
  // doppelt für nahtlose Endlosschleife
  const items = [...siteConfig.testimonials, ...siteConfig.testimonials];

  return (
    <section className="overflow-hidden bg-[#14110c] py-28 text-[#ece4d8] md:py-40">
      <span className="font-label mb-14 block px-6 text-center text-xs tracking-[0.28em] text-[#ece4d8]/45 uppercase">
        Stimmen
      </span>

      <div className="tm-marquee flex w-max items-center gap-16 whitespace-nowrap">
        {items.map((t, i) => (
          <div key={i} className="flex items-center gap-16">
            <span className="font-display text-[clamp(24px,3.4vw,44px)] font-medium tracking-tight">
              „{t.quote}"
            </span>
            <span className="font-label text-xs tracking-[0.2em] text-[#ece4d8]/40">
              {t.author}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        .tm-marquee { animation: tmScroll 32s linear infinite; }
        @keyframes tmScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .tm-marquee { animation: none; }
        }
      `}</style>
    </section>
  );
}
