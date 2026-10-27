"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { siteConfig } from "@/config/site";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function Studio() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from(".st-reveal", {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 65%" },
      });
    },
    { scope: rootRef },
  );

  return (
    <section id="studio" ref={rootRef} className="bg-[#e6ddce] text-[#1a1712]">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-28 md:grid-cols-2 md:py-40">
        <div>
          <span className="st-reveal font-label block text-xs tracking-[0.28em] text-[#1a1712]/50 uppercase">
            Studio
          </span>
          <h2 className="st-reveal font-display mt-6 text-[clamp(34px,5vw,72px)] leading-[0.98] font-semibold tracking-tight">
            Ein Raum für Verwandlung.
          </h2>
          <p className="st-reveal mt-6 max-w-md text-[#1a1712]/65">
            {siteConfig.name} verbindet Handwerk und Atmosphäre. Wir nehmen uns
            Zeit — für Beratung, Präzision und dein Ergebnis.
          </p>
          <p className="st-reveal mt-4 max-w-md text-[#1a1712]/65">
            Ruhiges Ambiente, ehrliche Beratung und ein Team, das sein Handwerk
            liebt.
          </p>
        </div>

        <div className="st-reveal relative aspect-[4/5] overflow-hidden rounded-sm bg-[#1a1712]/8">
          <span className="font-label absolute inset-0 flex items-center justify-center text-xs tracking-[0.2em] text-[#1a1712]/35 uppercase">
            Studio-Bild folgt
          </span>
          {/* Foto ablegen unter public/images/studio.jpg */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/studio.jpg"
            alt="Studio"
            ref={(el) => {
              if (el && el.complete && el.naturalWidth > 0)
                el.style.opacity = "1";
            }}
            onLoad={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700"
          />
        </div>
      </div>
    </section>
  );
}
