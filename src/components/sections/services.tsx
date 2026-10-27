"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { siteConfig } from "@/config/site";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function Services() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".sv-row", {
        yPercent: 40,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 68%" },
      });
    },
    { scope: rootRef },
  );

  return (
    <section id="leistungen" ref={rootRef} className="bg-[#ece4d8] text-[#1a1712]">
      <div className="mx-auto max-w-6xl px-6 py-28 md:py-40">
        <span className="font-label block text-xs tracking-[0.28em] text-[#1a1712]/50 uppercase">
          Leistungen
        </span>

        <div className="mt-12 border-t border-[#1a1712]/15">
          {siteConfig.services.map((service, i) => (
            <div
              key={service.title}
              className="sv-row group flex items-baseline justify-between gap-6 border-b border-[#1a1712]/15 py-8 md:py-10"
            >
              <div className="flex items-baseline gap-6 md:gap-10">
                <span className="font-label text-xs text-[#1a1712]/40">
                  0{i + 1}
                </span>
                <h3 className="font-display text-[clamp(28px,4.5vw,56px)] leading-none font-medium tracking-tight transition-transform duration-500 group-hover:translate-x-2">
                  {service.title}
                </h3>
              </div>
              <p className="hidden max-w-xs text-right text-sm text-[#1a1712]/55 md:block">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
