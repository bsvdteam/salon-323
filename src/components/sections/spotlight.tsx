"use client";

import { useEffect, useRef, useState } from "react";

// Poetische Momente + atmosphärische Bilder (aktuell aus dem Video-Material).
const moments = [
  { label: "Das Handwerk", img: "/images/stills/still-1.jpg" },
  { label: "Die Textur", img: "/images/stills/still-2.jpg" },
  { label: "Der Raum", img: "/images/stills/still-3.jpg" },
  { label: "Die Ruhe", img: "/images/stills/still-4.jpg" },
  { label: "Das Detail", img: "/images/stills/still-5.jpg" },
  { label: "Die Verwandlung", img: "/images/stills/still-6.jpg" },
];

export function Spotlight() {
  const sectionRef = useRef<HTMLElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const rafId = useRef(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const loop = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.14;
      pos.current.y += (target.current.y - pos.current.y) * 0.14;
      if (floatRef.current) {
        floatRef.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) translate(-50%, -50%)`;
      }
      rafId.current = requestAnimationFrame(loop);
    };
    rafId.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId.current);
  }, []);

  function handleMove(e: React.MouseEvent) {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    target.current.x = e.clientX - rect.left;
    target.current.y = e.clientY - rect.top;
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMove}
      onMouseLeave={() => setActive(null)}
      className="relative overflow-hidden bg-[#0a0908] text-[#ece4d8]"
    >
      <div className="mx-auto max-w-6xl px-6 py-28 md:py-44">
        <span className="font-label block text-xs tracking-[0.28em] text-[#ece4d8]/45 uppercase">
          Impressionen
        </span>

        <ul className="mt-14 border-t border-[#ece4d8]/12">
          {moments.map((m, i) => (
            <li
              key={i}
              onMouseEnter={() => setActive(i)}
              className="group flex items-center justify-between gap-6 border-b border-[#ece4d8]/12 py-6 md:py-9"
            >
              <div className="flex items-baseline gap-6 md:gap-10">
                <span className="font-label text-xs text-[#ece4d8]/35">
                  0{i + 1}
                </span>
                <h3
                  className={`font-display text-[clamp(30px,5.5vw,74px)] leading-none font-medium tracking-tight transition-all duration-500 group-hover:translate-x-3 ${
                    active === null || active === i
                      ? "opacity-100"
                      : "opacity-25"
                  }`}
                >
                  {m.label}
                </h3>
              </div>
              <span className="font-label hidden text-xs tracking-[0.18em] text-[#ece4d8]/35 uppercase md:block">
                {String(i + 1).padStart(2, "0")} / 06
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Der Maus folgendes Bild */}
      <div
        ref={floatRef}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 z-20 hidden aspect-[3/4] w-[24vw] max-w-[360px] overflow-hidden md:block"
        style={{
          opacity: active !== null ? 1 : 0,
          transition: "opacity 0.45s ease",
        }}
      >
        {moments.map((m, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={m.img}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-all duration-500"
            style={{
              opacity: active === i ? 1 : 0,
              transform: active === i ? "scale(1)" : "scale(1.08)",
            }}
          />
        ))}
      </div>
    </section>
  );
}
