"use client";

import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";

import { siteConfig } from "@/config/site";

export function Hero() {
  const ref = useRef<HTMLElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--mx", `${x * 26}px`);
    el.style.setProperty("--my", `${y * 26}px`);
  }

  function handleMouseLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--mx", "0px");
    el.style.setProperty("--my", "0px");
  }

  return (
    <section
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="hero"
      aria-label="NOIR Hero"
    >
      {/* --- Licht & Atmosphäre --- */}
      <div className="hero-bg" aria-hidden />
      <div className="hero-vignette" aria-hidden />

      {/* --- Halo-Ring hinter der Figur --- */}
      <div className="hero-halo-wrap" aria-hidden>
        <svg className="hero-halo" viewBox="0 0 600 600">
          <defs>
            <linearGradient id="haloStroke" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1a1712" stopOpacity="0.22" />
              <stop offset="0.45" stopColor="#1a1712" stopOpacity="0.06" />
              <stop offset="1" stopColor="#1a1712" stopOpacity="0" />
            </linearGradient>
          </defs>
          <circle
            cx="300"
            cy="300"
            r="298"
            fill="none"
            stroke="url(#haloStroke)"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* --- Zentrales Licht + "Transform"-Ghosting (Platz fürs Porträt) --- */}
      <div className="hero-ghost hero-ghost-a" aria-hidden />
      <div className="hero-ghost hero-ghost-b" aria-hidden />
      <div className="hero-corelight" aria-hidden />

      {/* --- Feines Filmkorn --- */}
      <div className="hero-grain" aria-hidden />

      {/* --- Kopfzeile --- */}
      <header className="hero-nav">
        <span className="hero-logo reveal" style={{ animationDelay: "0.05s" }}>
          {siteConfig.name}
        </span>
        <a
          href={siteConfig.booking.href}
          className="hero-cta reveal"
          style={{ animationDelay: "0.15s" }}
        >
          <span>{siteConfig.booking.label}</span>
          <ArrowUpRight className="hero-cta-arrow" strokeWidth={1.5} />
        </a>
      </header>

      {/* --- Vertikaler Index --- */}
      <div className="hero-index reveal" style={{ animationDelay: "0.35s" }}>
        03&nbsp;/&nbsp;08
      </div>

      {/* --- Scroll-Indikator --- */}
      <div className="hero-scroll reveal" style={{ animationDelay: "0.5s" }}>
        <span className="hero-scroll-label">Scroll to transform</span>
        <span className="hero-scroll-line">
          <span className="hero-scroll-dot" />
        </span>
      </div>

      <style>{heroStyles}</style>
    </section>
  );
}

const heroStyles = `
.hero {
  --mx: 0px;
  --my: 0px;
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

/* Grund-Licht: heller warmer Kern, der zu den Rändern in warmes Greige fällt */
.hero-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(38% 46% at 50% 40%, rgba(255,253,248,0.9) 0%, rgba(255,253,248,0) 70%),
    radial-gradient(118% 96% at 50% 34%, #f5f0e8 0%, #eae2d5 50%, #ddd2c1 100%);
}

/* Warme Vignette an den Rändern für Tiefe */
.hero-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(128% 112% at 50% 42%, transparent 56%, rgba(74,58,38,0.14) 100%);
}

/* Halo */
.hero-halo-wrap {
  position: absolute;
  left: 50%;
  top: 42%;
  width: min(64vh, 88vw);
  height: min(64vh, 88vw);
  transform: translate(-50%, -50%)
    translate(calc(var(--mx) * 0.4), calc(var(--my) * 0.4));
  will-change: transform;
}
.hero-halo {
  width: 100%;
  height: 100%;
  animation: haloSpin 90s linear infinite;
}
@keyframes haloSpin {
  to { transform: rotate(360deg); }
}

/* Zentrales Licht (dort steht später das Porträt) */
.hero-corelight {
  position: absolute;
  left: 50%;
  top: 44%;
  width: min(42vh, 60vw);
  height: min(72vh, 92vw);
  transform: translate(-50%, -50%)
    translate(calc(var(--mx) * 1), calc(var(--my) * 1));
  background: radial-gradient(closest-side, rgba(255,254,250,0.92), rgba(255,254,250,0) 72%);
  filter: blur(6px);
  will-change: transform;
}

/* Ghosting: zwei sehr zarte, driftende Nebel für die "Transformation" */
.hero-ghost {
  position: absolute;
  left: 50%;
  top: 42%;
  width: min(40vh, 66vw);
  height: min(64vh, 90vw);
  transform: translate(-50%, -50%);
  border-radius: 50%;
  filter: blur(34px);
  mix-blend-mode: multiply;
  opacity: 0.5;
}
.hero-ghost-a {
  background: radial-gradient(48% 52% at 50% 42%, rgba(120,108,90,0.16), transparent 70%);
  animation: ghostA 15s ease-in-out infinite alternate;
}
.hero-ghost-b {
  background: radial-gradient(46% 50% at 50% 44%, rgba(90,80,66,0.12), transparent 72%);
  animation: ghostB 19s ease-in-out infinite alternate;
}
@keyframes ghostA {
  from { transform: translate(-54%, -50%) scale(0.98); }
  to   { transform: translate(-46%, -52%) scale(1.05); }
}
@keyframes ghostB {
  from { transform: translate(-46%, -49%) scale(1.04); }
  to   { transform: translate(-53%, -51%) scale(0.97); }
}

/* Filmkorn */
.hero-grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.05;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 120px 120px;
}

/* Kopfzeile */
.hero-nav {
  position: absolute;
  inset: 0 0 auto 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: clamp(20px, 3.2vw, 44px) clamp(20px, 3.4vw, 52px);
  z-index: 3;
}
.hero-logo {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(17px, 1.5vw, 22px);
  letter-spacing: 0.14em;
  color: #14110c;
}
.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--ink);
  text-decoration: none;
  padding: 6px 2px;
  transition: opacity 0.3s ease;
}
.hero-cta span {
  position: relative;
}
.hero-cta span::after {
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
.hero-cta:hover span::after { transform: scaleX(1); }
.hero-cta-arrow {
  width: 13px;
  height: 13px;
  transition: transform 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.hero-cta:hover .hero-cta-arrow {
  transform: translate(2px, -2px);
}

/* Vertikaler Index */
.hero-index {
  position: absolute;
  left: clamp(14px, 2vw, 34px);
  top: 50%;
  transform: translateY(-50%) rotate(-90deg);
  transform-origin: center;
  font-size: 11px;
  letter-spacing: 0.28em;
  color: var(--ink);
  z-index: 3;
}

/* Scroll-Indikator */
.hero-scroll {
  position: absolute;
  left: 50%;
  bottom: clamp(22px, 3vh, 40px);
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  z-index: 3;
}
.hero-scroll-label {
  font-size: 11px;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--ink);
}
.hero-scroll-line {
  position: relative;
  width: 1px;
  height: 54px;
  background: rgba(26, 23, 18, 0.16);
  overflow: hidden;
}
.hero-scroll-dot {
  position: absolute;
  left: 0;
  top: 0;
  width: 1px;
  height: 40%;
  background: var(--ink);
  animation: scrollDown 2.4s cubic-bezier(0.7, 0, 0.3, 1) infinite;
}
@keyframes scrollDown {
  0%   { transform: translateY(-100%); opacity: 0; }
  25%  { opacity: 1; }
  75%  { opacity: 1; }
  100% { transform: translateY(250%); opacity: 0; }
}

/* Entrance */
.reveal {
  animation: fadeUp 1s cubic-bezier(0.2, 0.7, 0.2, 1) both;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: none; }
}
.hero-index.reveal {
  animation: fadeUpIndex 1s cubic-bezier(0.2, 0.7, 0.2, 1) both;
}
@keyframes fadeUpIndex {
  from { opacity: 0; transform: translateY(-50%) rotate(-90deg) translateX(12px); }
  to   { opacity: 1; transform: translateY(-50%) rotate(-90deg); }
}

@media (prefers-reduced-motion: reduce) {
  .hero-halo, .hero-ghost-a, .hero-ghost-b, .hero-scroll-dot, .reveal {
    animation: none;
  }
}
`;
