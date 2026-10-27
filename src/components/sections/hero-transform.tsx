"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import { siteConfig } from "@/config/site";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Kopfbild — Platzhalter. Ersetzen durch das echte Porträt (gleicher Pfad).
const HEAD_SRC = "/images/hero-head.svg";

export function HeroTransform() {
  const rootRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Grundzustand: Kopf mittig, Titel versteckt links.
      gsap.set(headRef.current, { xPercent: -50, yPercent: -50 });
      gsap.set(titleRef.current, { yPercent: -50, autoAlpha: 0, x: -60 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinRef.current,
          start: "top top",
          end: "+=170%",
          scrub: 1,
          pin: true,
        },
      });

      // Kopf wandert nach rechts (+ leicht größer), Titel erscheint links.
      tl.to(
        headRef.current,
        { x: "23vw", scale: 1.06, ease: "none" },
        0,
      ).to(titleRef.current, { autoAlpha: 1, x: 0, ease: "none" }, 0);

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
      };
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} className="ht-root">
      <div ref={pinRef} className="ht-pin">
        <div className="ht-bg" aria-hidden />
        <div className="ht-vignette" aria-hidden />
        <div className="ht-grain" aria-hidden />

        {/* Kopfzeile */}
        <header className="ht-nav">
          <span className="ht-mark">{siteConfig.name}</span>
          <a href={siteConfig.booking.href} className="ht-cta">
            <span>{siteConfig.booking.label}</span>
            <ArrowUpRight className="ht-cta-arrow" strokeWidth={1.5} />
          </a>
        </header>

        {/* Vertikaler Index */}
        <div className="ht-index">03&nbsp;/&nbsp;08</div>

        {/* Titel (baut sich links auf) */}
        <div ref={titleRef} className="ht-title">
          <h1>{siteConfig.name}</h1>
          <p>{siteConfig.tagline}</p>
        </div>

        {/* Kopf (startet mittig, wandert nach rechts) */}
        <div ref={headRef} className="ht-head">
          <div className="ht-head-glow" aria-hidden />
          <Image
            src={HEAD_SRC}
            alt=""
            width={640}
            height={860}
            priority
            unoptimized
            className="ht-head-img"
          />
        </div>

        {/* Scroll-Hinweis */}
        <div className="ht-scroll">
          <span>Scroll to transform</span>
          <span className="ht-scroll-line" />
        </div>
      </div>

      <style>{heroTransformStyles}</style>
    </section>
  );
}

const heroTransformStyles = `
.ht-pin {
  --ink: #1a1712;
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 640px;
  overflow: hidden;
  background-color: #ece4d8;
  color: var(--ink);
  font-family: var(--font-geist-mono), ui-monospace, monospace;
  isolation: isolate;
}
.ht-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(38% 46% at 50% 42%, rgba(255,253,248,0.85) 0%, rgba(255,253,248,0) 70%),
    radial-gradient(118% 96% at 50% 34%, #f5f0e8 0%, #eae2d5 50%, #ddd2c1 100%);
}
.ht-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(128% 112% at 50% 42%, transparent 56%, rgba(74,58,38,0.14) 100%);
}
.ht-grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.05;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 120px 120px;
}

.ht-nav {
  position: absolute;
  inset: 0 0 auto 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(20px, 3.2vw, 44px) clamp(20px, 3.4vw, 52px);
}
.ht-mark {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(15px, 1.3vw, 19px);
  letter-spacing: 0.14em;
  color: #14110c;
}
.ht-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--ink);
  text-decoration: none;
}
.ht-cta span { position: relative; }
.ht-cta span::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -3px;
  width: 100%;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.ht-cta:hover span::after { transform: scaleX(1); }
.ht-cta-arrow { width: 13px; height: 13px; transition: transform 0.4s cubic-bezier(0.2,0.7,0.2,1); }
.ht-cta:hover .ht-cta-arrow { transform: translate(2px, -2px); }

.ht-index {
  position: absolute;
  left: clamp(14px, 2vw, 34px);
  top: 50%;
  z-index: 4;
  transform: translateY(-50%) rotate(-90deg);
  font-size: 11px;
  letter-spacing: 0.28em;
  color: var(--ink);
}

.ht-title {
  position: absolute;
  left: clamp(24px, 8vw, 130px);
  top: 50%;
  z-index: 3;
  max-width: 46vw;
}
.ht-title h1 {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-weight: 600;
  font-size: clamp(44px, 8.5vw, 128px);
  line-height: 0.95;
  letter-spacing: -0.02em;
  color: #14110c;
}
.ht-title p {
  margin-top: 18px;
  font-size: 12px;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: rgba(26, 23, 18, 0.6);
}

.ht-head {
  position: absolute;
  left: 50%;
  top: 56%;
  z-index: 2;
  height: min(84vh, 92vw);
  will-change: transform;
}
.ht-head-img {
  height: 100%;
  width: auto;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
}
.ht-head-glow {
  position: absolute;
  inset: -8% -22%;
  z-index: -1;
  background: radial-gradient(closest-side, rgba(255,254,250,0.85), rgba(255,254,250,0) 72%);
  filter: blur(8px);
}

.ht-scroll {
  position: absolute;
  left: 50%;
  bottom: clamp(22px, 3vh, 40px);
  z-index: 4;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.ht-scroll span:first-child {
  font-size: 11px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--ink);
}
.ht-scroll-line {
  position: relative;
  width: 1px;
  height: 48px;
  background: rgba(26, 23, 18, 0.16);
  overflow: hidden;
}
.ht-scroll-line::after {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 1px;
  height: 40%;
  background: var(--ink);
  animation: htScroll 2.4s cubic-bezier(0.7, 0, 0.3, 1) infinite;
}
@keyframes htScroll {
  0% { transform: translateY(-100%); opacity: 0; }
  25% { opacity: 1; }
  75% { opacity: 1; }
  100% { transform: translateY(220%); opacity: 0; }
}

@media (max-width: 640px) {
  .ht-title { max-width: 80vw; }
}
`;
