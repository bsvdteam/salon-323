import type { ReactNode } from "react";

import { siteConfig } from "@/config/site";
import { LegalNote } from "@/components/legal-note";

type Section = { title: string; body: ReactNode };

type LegalPageProps = {
  eyebrow: string;
  statement: string[];
  intro: string;
  effective?: string;
  sections: Section[];
};

export function LegalPage({
  eyebrow,
  statement,
  intro,
  effective,
  sections,
}: LegalPageProps) {
  return (
    <div className="text-[#ece4d8]">
      {/* Kopf: Statement + Inhaltsverzeichnis (dunkel) */}
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-24 md:pt-24">
        <div className="grid gap-14 md:grid-cols-[1fr_16rem]">
          <div>
            <span className="font-label text-xs tracking-[0.28em] text-[#ece4d8]/45 uppercase">
              {eyebrow}
            </span>
            <h1 className="font-display mt-8 text-[clamp(40px,7vw,96px)] leading-[0.95] font-semibold tracking-tight">
              {statement.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-8 max-w-md text-[#ece4d8]/60">{intro}</p>
            {effective && (
              <p className="font-label mt-10 text-xs tracking-[0.2em] text-[#ece4d8]/40 uppercase">
                {effective} · {siteConfig.location}
              </p>
            )}
          </div>

          <nav className="md:border-l md:border-[#ece4d8]/12 md:pl-10">
            <span className="font-label text-xs tracking-[0.28em] text-[#ece4d8]/45 uppercase">
              Inhalt
            </span>
            <ol className="mt-6 space-y-3">
              {sections.map((s, i) => (
                <li key={i}>
                  <a
                    href={`#s-${i + 1}`}
                    className="font-label flex gap-4 text-xs tracking-[0.14em] text-[#ece4d8]/70 uppercase transition-colors hover:text-[#ece4d8]"
                  >
                    <span className="text-[#ece4d8]/40">0{i + 1}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      {/* Inhalt (hell) */}
      <div className="bg-[#ece4d8] text-[#1a1712]">
        <div className="mx-auto max-w-3xl px-6 py-20 md:py-28">
          <LegalNote />
          {sections.map((s, i) => (
            <section
              key={i}
              id={`s-${i + 1}`}
              className="scroll-mt-24 border-t border-[#1a1712]/12 py-10 first:border-t-0 first:pt-0"
            >
              <span className="font-label text-xs tracking-[0.2em] text-[#1a1712]/45 uppercase">
                0{i + 1} — {s.title}
              </span>
              <div className="mt-4 space-y-3 leading-relaxed text-[#1a1712]/75 [&_a]:underline [&_a]:underline-offset-2">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
