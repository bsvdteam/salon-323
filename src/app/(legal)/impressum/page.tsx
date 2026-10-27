import { siteConfig } from "@/config/site";
import { LegalPage } from "@/components/legal-page";

export const metadata = { title: "Impressum" };

export default function ImpressumPage() {
  const { contact } = siteConfig;

  return (
    <LegalPage
      eyebrow="Impressum"
      statement={["Wer hinter", `${siteConfig.name} steht.`]}
      intro="Angaben gemäß den gesetzlichen Vorgaben."
      sections={[
        {
          title: "Anbieter",
          body: (
            <p>
              {siteConfig.name}
              <br />
              {contact.address}
            </p>
          ),
        },
        {
          title: "Kontakt",
          body: (
            <p>
              Telefon: {contact.phone}
              <br />
              E-Mail: {contact.email}
            </p>
          ),
        },
        {
          title: "Vertreten durch",
          body: <p>[Name der vertretungsberechtigten Person]</p>,
        },
        {
          title: "Handelsregister / UID",
          body: <p>[Handelsregister-/UID-Nummer, falls vorhanden]</p>,
        },
        {
          title: "Verantwortlich für den Inhalt",
          body: (
            <p>
              [Name]
              <br />
              {contact.address}
            </p>
          ),
        },
        {
          title: "Streitschlichtung",
          body: (
            <p>
              Wir sind nicht verpflichtet und nicht bereit, an
              Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
              teilzunehmen.
            </p>
          ),
        },
      ]}
    />
  );
}
