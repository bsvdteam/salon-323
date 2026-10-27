"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type ImageBreakProps = {
  src: string;
  eyebrow?: string;
  title: string;
  theme?: "light" | "dark";
};

export function ImageBreak({
  src,
  eyebrow,
  title,
  theme = "dark",
}: ImageBreakProps) {
  const rootRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useGSAP(
    () => {
      // Falls das Bild schon fertig geladen war, bevor onLoad greifen konnte.
      if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
        imgRef.current.style.opacity = "1";
      }

      gsap.fromTo(
        imgRef.current,
        { yPercent: -8 },
        {
          yPercent: 8,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
      gsap.from(".ib-reveal", {
        y: 30,
        opacity: 0,
        duration: 1,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 62%" },
      });
    },
    { scope: rootRef },
  );

  const textColor = theme === "dark" ? "text-[#f2ede4]" : "text-[#14110c]";
  const overlay =
    theme === "dark"
      ? "bg-gradient-to-t from-black/60 via-black/25 to-black/40"
      : "bg-white/5";

  return (
    <section
      ref={rootRef}
      className="relative h-[86vh] overflow-hidden bg-[#0a0908]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt=""
        aria-hidden
        onLoad={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
        style={{ top: "-15%", height: "130%" }}
        className="absolute left-0 w-full object-cover opacity-0 transition-opacity duration-[900ms]"
      />
      <div className={`absolute inset-0 ${overlay}`} />

      <div
        className={`relative flex h-full flex-col items-center justify-center px-6 text-center ${textColor}`}
      >
        {eyebrow && (
          <span className="ib-reveal font-label text-xs tracking-[0.28em] uppercase opacity-80">
            {eyebrow}
          </span>
        )}
        <h2 className="ib-reveal font-display mt-6 max-w-[18ch] text-[clamp(30px,6vw,84px)] leading-[0.98] font-semibold tracking-tight">
          {title}
        </h2>
      </div>
    </section>
  );
}
