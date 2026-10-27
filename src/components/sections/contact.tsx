import { siteConfig } from "@/config/site";

export function Contact() {
  const { contact } = siteConfig;

  return (
    <section id="kontakt" className="border-t border-stone-200/70 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
              Termin &amp; Kontakt
            </h2>
            <p className="mt-3 max-w-md text-stone-600">
              Ruf uns an oder schreib uns — wir freuen uns auf dich.
            </p>

            <div className="mt-8 space-y-2 text-stone-700">
              <p>{contact.address}</p>
              <p>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="transition-colors hover:text-stone-900"
                >
                  {contact.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${contact.email}`}
                  className="transition-colors hover:text-stone-900"
                >
                  {contact.email}
                </a>
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium tracking-wider text-stone-500 uppercase">
              Öffnungszeiten
            </h3>
            <dl className="mt-4 divide-y divide-stone-200">
              {contact.hours.map((entry) => (
                <div
                  key={entry.day}
                  className="flex justify-between py-3 text-stone-700"
                >
                  <dt>{entry.day}</dt>
                  <dd className="text-stone-500">{entry.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
