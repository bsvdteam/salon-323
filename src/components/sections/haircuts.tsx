"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { siteConfig } from "@/config/site";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function Haircuts() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const cuts = siteConfig.cuts;
  const total = String(cuts.length).padStart(2, "0");

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;

      const setHeight = () => {
        const distance = Math.max(0, track.scrollWidth - window.innerWidth);
        section.style.height = `${window.innerHeight + distance}px`;
      };
      setHeight();

      const tween = gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const idx = Math.min(
              cuts.length,
              Math.floor(self.progress * cuts.length) + 1,
            );
            if (countRef.current) {
              countRef.current.textContent = String(idx).padStart(2, "0");
            }
          },
        },
      });

      ScrollTrigger.addEventListener("refreshInit", setHeight);
      return () => {
        ScrollTrigger.removeEventListener("refreshInit", setHeight);
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="relative bg-[#0a0908] text-[#ece4d8]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between px-6 py-8 md:px-10">
          <div>
            <p className="font-label text-xs tracking-[0.24em] uppercase">
              Getragen, nicht ausgestellt.
            </p>
            <p className="font-label mt-1 text-[10px] tracking-[0.24em] text-[#ece4d8]/45 uppercase">
              Echte Cuts. Echte Menschen.
            </p>
          </div>
          <p className="font-label text-xs tracking-[0.24em] text-[#ece4d8]/60 uppercase">
            <span ref={countRef}>01</span> / {total}
          </p>
        </div>

        <div
          ref={trackRef}
          className="flex h-screen w-max items-center gap-[4vw] px-[6vw]"
        >
          {cuts.map((cut, i) => (
            <article key={i} className="w-[72vw] shrink-0 sm:w-[44vw] lg:w-[30vw]">
              <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-b from-[#1c1815] to-[#0c0b0a]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cut.image}
                  alt={cut.name}
                  loading="lazy"
                  ref={(el) => {
                    if (el && el.complete && el.naturalWidth > 0)
                      el.style.opacity = "1";
                  }}
                  onLoad={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                  className="h-full w-full object-cover opacity-0 transition-opacity duration-700"
                />
              </div>
              <div className="mt-5">
                <h3 className="font-label text-sm tracking-[0.18em] uppercase">
                  {cut.name}
                </h3>
                <p className="font-label mt-1 text-xs tracking-[0.18em] text-[#ece4d8]/45 uppercase">
                  {cut.client} — {siteConfig.location}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
