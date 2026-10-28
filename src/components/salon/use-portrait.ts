"use client";

import { useEffect, useState } from "react";

/** Matches the prototype: portrait when width/height < 0.9. */
export function usePortrait() {
  const [portrait, setPortrait] = useState(true);
  useEffect(() => {
    const check = () =>
      setPortrait(window.innerWidth / window.innerHeight < 0.9);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return portrait;
}

export function bgImg(portrait: boolean) {
  return portrait
    ? {
        url: "/mist-mobile.jpg",
        pos: "50% 50%",
        w: 941,
        h: 1672,
        px: 0.5,
        py: 0.5,
      }
    : { url: "/mist.jpg", pos: "52% 45%", w: 1672, h: 940, px: 0.52, py: 0.45 };
}

/** Intro-card scale = min(1,(vw-24)/400). Computed after mount to avoid SSR mismatch. */
export function useCardScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const calc = () => setScale(Math.min(1, (window.innerWidth - 24) / 400));
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return scale;
}
