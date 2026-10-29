// Builds one signed .pkpass for a member. It's a single storeCard that morphs:
// with no upcoming appointment it reads as a membership card (N°, tier, cuts);
// with one, it becomes the appointment card (time, service, place) and surfaces
// on the lock screen shortly before via relevantDate — mirroring the dashboard
// card in src/components/salon/screens/tabs/card.tsx.
import { createHmac } from "node:crypto";
import { PKPass } from "passkit-generator";
import { formatInTimeZone } from "date-fns-tz";
import { de } from "date-fns/locale";
import { salon, tiers, svcName, type ServiceKey } from "@/lib/data";
import { appleWalletConfig } from "./config";
import { appleCertificates } from "./certificates";
import { passImages } from "./assets";

const TZ = process.env.GOOGLE_TZ || "Europe/Zurich";

export type ApptInfo = {
  startsAt: string; // ISO timestamp
  services: ServiceKey[];
  priceChf: number;
  durationMin: number;
};

export type MemberPassData = {
  memberId: string; // serialNumber — stable, one pass per member
  memberNo: string; // "0047"
  firstName: string;
  lastName: string;
  cuts: number;
  memberSince: string; // ISO date
  appointment: ApptInfo | null;
};

function tierOf(cuts: number) {
  return tiers.reduce((best, t) => (cuts >= t.min ? t : best), tiers[0]);
}

function serviceLabel(services: ServiceKey[]): string {
  const names = services.map(svcName).filter(Boolean);
  return names.length ? names.join(" · ") : "Haare";
}

/** Phase-2 web-service token: stable per member, verifiable server-side. */
function authToken(memberId: string): string {
  const secret = process.env.SESSION_SECRET ?? "";
  return createHmac("sha256", secret)
    .update(`wallet:${memberId}`)
    .digest("base64url");
}

/** Signed .pkpass bytes for this member, ready to stream to the device. */
export async function buildMemberPass(data: MemberPassData): Promise<Buffer> {
  const cfg = appleWalletConfig();
  const tier = tierOf(data.cuts);
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const since = formatInTimeZone(
    new Date(data.memberSince),
    TZ,
    "MMM yyyy",
    { locale: de },
  );

  const pass = new PKPass(passImages(), appleCertificates(), {
    passTypeIdentifier: cfg.passTypeIdentifier,
    teamIdentifier: cfg.teamIdentifier,
    organizationName: cfg.organizationName,
    serialNumber: data.memberId,
    description: "Salon 15 Karte",
    logoText: cfg.organizationName,
    sharingProhibited: true, // a personal membership card
    foregroundColor: "rgb(244, 247, 250)",
    ...(data.appointment
      ? { backgroundColor: "rgb(20, 27, 39)", labelColor: "rgb(244, 166, 158)" }
      : { backgroundColor: "rgb(26, 34, 48)", labelColor: "rgb(150, 163, 179)" }),
    // Phase 2: only emit a web service when it's actually configured, so the
    // device registers for push updates instead of staying static.
    ...(cfg.webServiceURL
      ? {
          webServiceURL: `${cfg.webServiceURL}/api/wallet/v1`,
          authenticationToken: authToken(data.memberId),
        }
      : {}),
  });

  pass.type = "storeCard";

  // The QR the barber scans at the chair — the member id, N° shown as fallback.
  pass.setBarcodes({
    format: "PKBarcodeFormatQR",
    message: data.memberId,
    altText: `N° ${data.memberNo}`,
    messageEncoding: "iso-8859-1",
  });

  if (data.appointment) {
    const start = new Date(data.appointment.startsAt);
    const dateShort = formatInTimeZone(start, TZ, "EEE d. MMM", { locale: de });
    const dateLong = formatInTimeZone(start, TZ, "EEEE, d. MMMM", { locale: de });
    const time = formatInTimeZone(start, TZ, "HH:mm", { locale: de });

    pass.headerFields.push({ key: "date", label: "TERMIN", value: dateShort });
    pass.primaryFields.push({
      key: "time",
      label: dateLong,
      value: time,
      changeMessage: "Neuer Termin: %@",
    });
    pass.secondaryFields.push(
      { key: "service", label: "LEISTUNG", value: serviceLabel(data.appointment.services) },
      { key: "no", label: "N°", value: data.memberNo, textAlignment: "PKTextAlignmentRight" },
    );
    pass.auxiliaryFields.push(
      { key: "ort", label: "ORT", value: salon.a1 },
      {
        key: "preis",
        label: "PREIS",
        value: `CHF ${data.appointment.priceChf}`,
        textAlignment: "PKTextAlignmentRight",
      },
    );
    pass.backFields.push(
      {
        key: "adresse",
        label: "Adresse",
        value: `${salon.a1}, ${salon.a2}`,
        dataDetectorTypes: ["PKDataDetectorTypeAddress"],
      },
      {
        key: "telefon",
        label: "Telefon",
        value: salon.phone,
        dataDetectorTypes: ["PKDataDetectorTypePhoneNumber"],
      },
      { key: "absage", label: "Absage", value: "Bis 24 h vor dem Termin kostenlos im Portal absagen oder verschieben." },
      { key: "mitglied", label: "Mitglied", value: `${fullName} · N° ${data.memberNo}` },
    );

    // Bring the pass to the lock screen around the appointment.
    pass.setRelevantDate(start);
  } else {
    pass.headerFields.push({ key: "rank", label: "STUFE", value: tier.r });
    pass.primaryFields.push({ key: "member", label: "MITGLIED", value: fullName });
    pass.secondaryFields.push(
      { key: "no", label: "N°", value: data.memberNo },
      { key: "since", label: "SEIT", value: since, textAlignment: "PKTextAlignmentRight" },
    );
    pass.auxiliaryFields.push(
      { key: "cuts", label: "CUTS", value: String(data.cuts) },
      { key: "tier", label: "STUFE", value: tier.n, textAlignment: "PKTextAlignmentRight" },
    );
    pass.backFields.push(
      {
        key: "adresse",
        label: "Adresse",
        value: `${salon.a1}, ${salon.a2}`,
        dataDetectorTypes: ["PKDataDetectorTypeAddress"],
      },
      {
        key: "telefon",
        label: "Telefon",
        value: salon.phone,
        dataDetectorTypes: ["PKDataDetectorTypePhoneNumber"],
      },
      { key: "hinweis", label: "Hinweis", value: "Beim Eintreten vorzeigen." },
    );
  }

  return pass.getAsBuffer();
}
