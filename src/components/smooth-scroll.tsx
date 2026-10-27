"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ReactLenis, type LenisRef } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Smooth Scroll (Lenis), sauber mit GSAP ScrollTrigger synchronisiert.
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000);
    }
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    const lenis = lenisRef.current?.lenis;
    lenis?.on("scroll", ScrollTrigger.update);

    // Maße erst nach Layout/Fonts final -> ScrollTrigger neu vermessen,
    // damit gepinnte/horizontale Sektionen korrekt Platz reservieren.
    const refresh = () => ScrollTrigger.refresh();
    const timeout = setTimeout(refresh, 300);
    window.addEventListener("load", refresh);
    if (typeof document !== "undefined" && "fonts" in document) {
      document.fonts.ready.then(refresh).catch(() => {});
    }

    return () => {
      gsap.ticker.remove(update);
      lenis?.off("scroll", ScrollTrigger.update);
      window.removeEventListener("load", refresh);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{ autoRaf: false, lerp: 0.1, smoothWheel: true }}
    >
      {children}
    </ReactLenis>
  );
}
