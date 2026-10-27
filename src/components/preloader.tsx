"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { siteConfig } from "@/config/site";

gsap.registerPlugin(useGSAP);

export function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const countBoxRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useGSAP(
    () => {
      gsap.set(lineRef.current, { scaleX: 0, transformOrigin: "left center" });
      gsap.set(markRef.current, { autoAlpha: 0, y: 20 });

      const counter = { v: 0 };
      const tl = gsap.timeline({ onComplete: () => setDone(true) });

      tl.to(markRef.current, {
        autoAlpha: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
      })
        .to(
          counter,
          {
            v: 100,
            duration: 2.1,
            ease: "power2.inOut",
            onUpdate: () => {
              if (countRef.current) {
                countRef.current.textContent = String(Math.round(counter.v));
              }
            },
          },
          0.15,
        )
        .to(lineRef.current, { scaleX: 1, duration: 2.1, ease: "power2.inOut" }, 0.15)
        .to({}, { duration: 0.25 })
        .to([markRef.current, countBoxRef.current], {
          autoAlpha: 0,
          y: -20,
          duration: 0.5,
          ease: "power2.in",
        })
        .to(
          rootRef.current,
          { yPercent: -100, duration: 1.1, ease: "power4.inOut" },
          "-=0.2",
        );
    },
    { scope: rootRef },
  );

  if (done) return null;

  return (
    <div ref={rootRef} className="pl-root">
      <div ref={markRef} className="pl-mark">
        <span className="pl-mark-text">{siteConfig.name}</span>
        <span className="pl-line">
          <span ref={lineRef} className="pl-line-fill" />
        </span>
      </div>

      <div ref={countBoxRef} className="pl-count">
        <span ref={countRef}>0</span>
        <span className="pl-pct">%</span>
      </div>

      <style>{`
        .pl-root {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #14110c;
          color: #ece4d8;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .pl-mark {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
        }
        .pl-mark-text {
          font-family: var(--font-geist-sans), system-ui, sans-serif;
          font-weight: 600;
          font-size: clamp(30px, 5vw, 68px);
          letter-spacing: -0.02em;
        }
        .pl-line {
          display: block;
          width: clamp(120px, 18vw, 220px);
          height: 1px;
          background: rgba(236, 228, 216, 0.2);
          overflow: hidden;
        }
        .pl-line-fill {
          display: block;
          width: 100%;
          height: 100%;
          background: #ece4d8;
          transform-origin: left center;
        }
        .pl-count {
          position: absolute;
          right: clamp(22px, 4vw, 52px);
          bottom: clamp(20px, 4vh, 44px);
          display: flex;
          align-items: flex-start;
          font-family: var(--font-geist-mono), ui-monospace, monospace;
          font-size: clamp(44px, 8vw, 104px);
          line-height: 1;
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.03em;
        }
        .pl-pct {
          font-size: 0.32em;
          margin-top: 0.4em;
          margin-left: 4px;
          opacity: 0.55;
        }
      `}</style>
    </div>
  );
}
