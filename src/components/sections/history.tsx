"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { siteConfig } from "@/config/site";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function History() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const items = siteConfig.history;

  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = trackRef.current;
      if (!section || !track) return;

      // Sektion so hoch machen, dass der Scrollweg = horizontale Distanz ist.
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
    <section
      id="geschichte"
      ref={sectionRef}
      className="relative bg-[#ece4d8] text-[#1a1712]"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <div ref={trackRef} className="flex h-screen w-max items-center">
          <div className="flex h-screen w-screen shrink-0 flex-col justify-center px-[8vw]">
            <span className="font-label text-xs tracking-[0.28em] text-[#1a1712]/50 uppercase">
              Geschichte
            </span>
            <h2 className="font-display mt-6 max-w-[14ch] text-[clamp(40px,7vw,110px)] leading-[0.95] font-semibold tracking-tight">
              Unser Weg.
            </h2>
            <p className="font-label mt-8 text-xs tracking-[0.2em] text-[#1a1712]/45">
              Scroll →
            </p>
          </div>

          {items.map((item) => (
            <article
              key={item.year}
              className="flex h-screen w-[86vw] shrink-0 flex-col justify-center border-l border-[#1a1712]/12 px-[8vw] md:w-[52vw]"
            >
              <span className="font-display text-[clamp(60px,10vw,180px)] leading-none font-semibold tracking-tight">
                {item.year}
              </span>
              <h3 className="font-display mt-8 text-2xl font-medium md:text-3xl">
                {item.title}
              </h3>
              <p className="mt-4 max-w-md text-[#1a1712]/60">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
