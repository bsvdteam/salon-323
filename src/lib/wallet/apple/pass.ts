// Builds one signed .pkpass for a member. It's a single storeCard whose face is
// the member's chosen card design (strip photo + base colour from cardStyles),
// like the dashboard card in src/components/salon/screens/tabs/card.tsx. With
// no upcoming appointment it reads as the membership card (name, N°, tier);
// with one, the same face shows the appointment (time, service, place) and
// surfaces on the lock screen shortly before via relevantDate.
import { createHmac } from "node:crypto";
import { PKPass } from "passkit-generator";
import { formatInTimeZone } from "date-fns-tz";
import { de } from "date-fns/locale";
import { salon, tiers, svcName, cardStyles, type ServiceKey } from "@/lib/data";
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
  card: number; // chosen card design 0..2 (members.card_index)
  appointment: ApptInfo | null;
};

function tierOf(cuts: number) {
  return tiers.reduce((best, t) => (cuts >= t.min ? t : best), tiers[0]);
}

function serviceLabel(services: ServiceKey[]): string {
  const names = services.map(svcName).filter(Boolean);
  return names.length ? names.join(" · ") : "Haare";
}

/** "#1a2230" → "rgb(26, 34, 48)" — Wallet only takes rgb() colours. */
function rgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
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
  const since = formatInTimeZone(new Date(data.memberSince), TZ, "MMM yyyy", {
    locale: de,
  });

  const design = cardStyles[data.card] ?? cardStyles[0];

  const pass = new PKPass(passImages(data.card), appleCertificates(), {
    passTypeIdentifier: cfg.passTypeIdentifier,
    teamIdentifier: cfg.teamIdentifier,
    organizationName: cfg.organizationName,
    serialNumber: data.memberId,
    description: "Salon 15 Karte",
    sharingProhibited: true, // a personal membership card
    backgroundColor: rgb(design.base),
    foregroundColor: rgb(design.text),
    // coral like the card's TERMIN badge; otherwise the card's muted white
    labelColor: data.appointment ? "rgb(244, 166, 158)" : "rgb(200, 208, 218)",
    // Phase 2: only emit a web service when it's actually configured, so the
    // device registers for push updates instead of staying static.
    ...(cfg.webServiceURL
      ? {
          webServiceURL: `${cfg.webServiceURL}/api/wallet/v1`,
          authenticationToken: authToken(data.memberId),
        }
      : {}),
  });

  // No barcode: the front is the card, like a bank card in Wallet.
  pass.type = "storeCard";

  if (data.appointment) {
    const start = new Date(data.appointment.startsAt);
    const dateShort = formatInTimeZone(start, TZ, "EEE d. MMM", { locale: de });
    const dateLong = formatInTimeZone(start, TZ, "EEEE, d. MMMM", {
      locale: de,
    });
    const time = formatInTimeZone(start, TZ, "HH:mm", { locale: de });

    pass.headerFields.push({ key: "date", label: "TERMIN", value: dateShort });
    pass.primaryFields.push({
      key: "time",
      label: dateLong,
      value: time,
      changeMessage: "Neuer Termin: %@",
    });
    pass.secondaryFields.push(
      {
        key: "service",
        label: "LEISTUNG",
        value: serviceLabel(data.appointment.services),
      },
      {
        key: "no",
        label: "N°",
        value: data.memberNo,
        textAlignment: "PKTextAlignmentRight",
      },
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
      {
        key: "absage",
        label: "Absage",
        value:
          "Bis 24 h vor dem Termin kostenlos im Portal absagen oder verschieben.",
      },
      {
        key: "mitglied",
        label: "Mitglied",
        value: `${fullName} · N° ${data.memberNo}`,
      },
    );

    // Bring the pass to the lock screen around the appointment.
    pass.setRelevantDate(start);
  } else {
    // Same reading order as the card front: tier top right, name over the
    // photo, then N° · tier and SEIT.
    pass.headerFields.push({ key: "rank", label: "STUFE", value: tier.r });
    pass.primaryFields.push({
      key: "member",
      label: "MEMBER",
      value: fullName,
    });
    pass.secondaryFields.push(
      { key: "no", label: "N°", value: data.memberNo },
      { key: "tier", label: "STUFE", value: tier.n },
      {
        key: "since",
        label: "SEIT",
        value: since,
        textAlignment: "PKTextAlignmentRight",
      },
    );
    pass.backFields.push({
      key: "cuts",
      label: "Cuts",
      value: String(data.cuts),
    });
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
