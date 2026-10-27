import { siteConfig } from "@/config/site";
import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Datenschutz" };

export default function DatenschutzPage() {
  const { contact } = siteConfig;

  return (
    <LegalPage
      eyebrow="Datenschutz"
      statement={["Deine Daten.", "Unser Umgang", "damit."]}
      intro="Transparenz darüber, welche Daten wir verarbeiten und warum."
      sections={[
        {
          title: "Verantwortlicher",
          body: (
            <p>
              {siteConfig.name}
              <br />
              {contact.address}
              <br />
              {contact.email}
            </p>
          ),
        },
        {
          title: "Verarbeitung",
          body: (
            <p>
              Wir verarbeiten personenbezogene Daten nur, soweit dies zur
              Bereitstellung der Website und unserer Leistungen erforderlich
              ist. [Konkrete Verarbeitungszwecke einsetzen.]
            </p>
          ),
        },
        {
          title: "Hosting & Dienstleister",
          body: (
            <p>
              Diese Website wird bei einem Dienstleister gehostet; für Datenbank
              und Authentifizierung kommt ein Backend-Dienst zum Einsatz.
              [Auftragsverarbeiter und Serverstandorte benennen.]
            </p>
          ),
        },
        {
          title: "Terminbuchung",
          body: (
            <p>
              Bei der Online-Terminbuchung werden die angegebenen Daten zur
              Bearbeitung der Buchung verarbeitet. [Eingesetztes Buchungstool
              benennen.]
            </p>
          ),
        },
        {
          title: "Cookies",
          body: (
            <p>
              Wir verwenden nur technisch notwendige Cookies. [Bei Analyse-/
              Marketing-Cookies: Einwilligungslösung ergänzen.]
            </p>
          ),
        },
        {
          title: "Deine Rechte",
          body: (
            <ul className="list-disc space-y-1 pl-5">
              <li>Auskunft, Berichtigung und Löschung</li>
              <li>Einschränkung und Datenübertragbarkeit</li>
              <li>Widerspruch gegen die Verarbeitung</li>
              <li>Beschwerde bei einer Aufsichtsbehörde</li>
            </ul>
          ),
        },
      ]}
    />
  );
}
