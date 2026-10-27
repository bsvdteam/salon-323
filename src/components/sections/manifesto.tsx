"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { siteConfig } from "@/config/site";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function Manifesto() {
  const rootRef = useRef<HTMLElement>(null);
  const words = siteConfig.manifesto.split(" ");

  useGSAP(
    () => {
      gsap.fromTo(
        ".mf-word",
        { opacity: 0.14 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.5,
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 72%",
            end: "bottom 62%",
            scrub: true,
          },
        },
      );
    },
    { scope: rootRef },
  );

  return (
    <section id="manifest" ref={rootRef} className="bg-[#14110c] text-[#ece4d8]">
      <div className="mx-auto max-w-5xl px-6 py-32 md:py-52">
        <span className="font-label mb-12 block text-xs tracking-[0.28em] text-[#ece4d8]/45 uppercase">
          Manifest
        </span>
        <p className="font-display text-[clamp(28px,4.4vw,60px)] leading-[1.26] font-medium tracking-tight">
          {words.map((word, i) => (
            <span key={i} className="mf-word">
              {word}{" "}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
