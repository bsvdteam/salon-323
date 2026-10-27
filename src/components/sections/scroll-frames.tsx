"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// Scroll-Weg pro Frame (px). Höher = langsameres, bedächtigeres Scrubbing.
const PX_PER_FRAME = 16;

type Manifest = {
  count: number;
  prefix: string;
  pad: number;
  ext: string;
};

type ScrollFramesProps = {
  /**
   * Ein oder mehrere Frame-Ordner unter /public. Mehrere Quellen werden zu
   * EINER durchgehenden Sequenz verkettet (Ende von Quelle A -> Anfang von B).
   */
  sources: string[];
};

function frameUrl(src: string, m: Manifest, oneBasedIndex: number) {
  return `${src}/${m.prefix}${String(oneBasedIndex).padStart(m.pad, "0")}.${m.ext}`;
}

export function ScrollFrames({ sources }: ScrollFramesProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const totalRef = useRef(0);
  const frameRef = useRef({ i: 0 });

  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [missing, setMissing] = useState(false);
  const [active, setActive] = useState(false);

  // Stabiler Key, damit der Effekt nicht bei jedem Render neu läuft.
  const srcKey = sources.join("|");

  // Lazy: Frames erst vorladen, wenn die Sektion in die Nähe kommt.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          io.disconnect();
        }
      },
      { rootMargin: "150% 0px 150% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Manifeste laden + ALLE Frames in Reihenfolge zu einer Sequenz vorladen
  useEffect(() => {
    if (!active) return;
    const srcs = srcKey.split("|");
    let cancelled = false;

    (async () => {
      try {
        // 1) Manifeste aller Quellen laden
        const manifests = await Promise.all(
          srcs.map(async (src) => {
            const res = await fetch(`${src}/manifest.json`, {
              cache: "no-store",
            });
            if (!res.ok) throw new Error(`kein manifest: ${src}`);
            return { src, m: (await res.json()) as Manifest };
          }),
        );
        if (cancelled) return;

        // 2) Alle Frame-URLs in Reihenfolge sammeln (Quelle A komplett, dann B …)
        const urls: string[] = [];
        for (const { src, m } of manifests) {
          for (let i = 1; i <= m.count; i++) urls.push(frameUrl(src, m, i));
        }
        const total = urls.length;
        totalRef.current = total;

        // 3) Vorladen
        const imgs: HTMLImageElement[] = new Array(total);
        let loaded = 0;
        await new Promise<void>((done) => {
          urls.forEach((url, idx) => {
            const img = new Image();
            img.onload = img.onerror = () => {
              loaded++;
              if (!cancelled) setProgress(loaded / total);
              if (loaded === total) done();
            };
            img.src = url;
            imgs[idx] = img;
          });
        });
        if (cancelled) return;

        imagesRef.current = imgs;
        setReady(true);
      } catch {
        if (!cancelled) setMissing(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [srcKey, active]);

  function render(index: number) {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    // "cover"-Fit
    const ir = img.width / img.height;
    const cr = cw / ch;
    let dw: number;
    let dh: number;
    if (ir > cr) {
      dh = ch;
      dw = ch * ir;
    } else {
      dw = cw;
      dh = cw / ir;
    }
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  function resizeCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    render(Math.round(frameRef.current.i));
  }

  useGSAP(
    () => {
      const total = totalRef.current;
      if (!ready || total === 0) return;

      resizeCanvas();
      const onResize = () => resizeCanvas();
      window.addEventListener("resize", onResize);

      // Eine durchgehende Scroll-Länge über ALLE Frames -> ein Pin, ein Scrub.
      const distance = Math.round(total * PX_PER_FRAME);

      const tween = gsap.to(frameRef.current, {
        i: total - 1,
        ease: "none",
        scrollTrigger: {
          trigger: pinRef.current,
          start: "top top",
          end: `+=${distance}`,
          scrub: 1,
          pin: true,
        },
        onUpdate: () => render(Math.round(frameRef.current.i)),
      });

      return () => {
        window.removeEventListener("resize", onResize);
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    },
    { scope: rootRef, dependencies: [ready] },
  );

  return (
    <section ref={rootRef} className="sf-root">
      <div ref={pinRef} className="sf-pin">
        <canvas ref={canvasRef} className="sf-canvas" />

        {!ready && !missing && (
          <div className="sf-overlay">
            Laden … {Math.round(progress * 100)}%
          </div>
        )}
        {missing && (
          <div className="sf-overlay sf-overlay-hint">
            Keine Frames gefunden. Erzeugen mit{" "}
            <code>pnpm frames &lt;video&gt; &lt;name&gt;</code>.
          </div>
        )}
      </div>

      <style>{`
        .sf-pin {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          background: #0b0a09;
        }
        .sf-canvas {
          display: block;
          width: 100%;
          height: 100%;
        }
        .sf-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 24px;
          text-align: center;
          font-family: var(--font-geist-mono), ui-monospace, monospace;
          font-size: 12px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.6);
        }
        .sf-overlay-hint {
          letter-spacing: 0.05em;
          text-transform: none;
        }
        .sf-overlay code {
          color: rgba(255, 255, 255, 0.9);
        }
      `}</style>
    </section>
  );
}
