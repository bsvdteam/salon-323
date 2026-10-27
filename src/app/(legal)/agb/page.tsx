import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "AGB" };

export default function AgbPage() {
  return (
    <LegalPage
      eyebrow="Regeln am Stuhl"
      statement={["Klare Regeln.", "Ruhiges Vertrauen.", "Keine Überraschungen."]}
      intro="Alles, was du vor deinem Termin wissen musst."
      effective="Gültig ab 14. August 2026"
      sections={[
        {
          title: "Buchung",
          body: (
            <p>
              Termine können telefonisch, per E-Mail oder über das
              Online-Buchungstool vereinbart werden. Der Vertrag kommt mit
              Bestätigung des Termins zustande. [Details einsetzen.]
            </p>
          ),
        },
        {
          title: "Stornierung",
          body: (
            <p>
              Termine können bis [Frist] kostenfrei storniert werden. [Regelung
              zu Ausfallgebühren einsetzen.]
            </p>
          ),
        },
        {
          title: "Verspätung",
          body: (
            <p>
              Bei Verspätung kann die Behandlungszeit entsprechend verkürzt
              werden. [Details einsetzen.]
            </p>
          ),
        },
        {
          title: "Zahlung",
          body: (
            <p>
              Es gelten die zum Zeitpunkt der Leistung gültigen Preise. Die
              Zahlung erfolgt direkt nach der Dienstleistung. [Zahlungsarten
              einsetzen.]
            </p>
          ),
        },
        {
          title: "Haftung",
          body: (
            <p>
              Wir haften nach den gesetzlichen Bestimmungen. [Haftungsumfang und
              -ausschlüsse präzisieren.]
            </p>
          ),
        },
        {
          title: "Schlussbestimmungen",
          body: (
            <p>
              Sollte eine Bestimmung unwirksam sein, bleibt die Wirksamkeit der
              übrigen unberührt.
            </p>
          ),
        },
      ]}
    />
  );
}
