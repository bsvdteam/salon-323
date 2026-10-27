import { siteConfig } from "@/config/site";

export function About() {
  return (
    <section id="studio" className="border-t border-stone-200/70 bg-stone-50">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-2 md:py-28">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
            Das Studio
          </h2>
          <p className="mt-4 text-stone-600">
            {siteConfig.name} ist ein moderner Haarsalon, in dem Handwerk und
            Atmosphäre zusammenkommen. Wir nehmen uns Zeit — für Beratung, für
            Präzision und für dein Ergebnis.
          </p>
          <p className="mt-4 text-stone-600">
            Ruhiges Ambiente, ehrliche Beratung und ein Team, das sein Handwerk
            liebt. Komm vorbei und lass dich verwandeln.
          </p>
        </div>

        <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-stone-200/60 text-sm text-stone-400">
          Studio-Bild folgt
        </div>
      </div>
    </section>
  );
}
