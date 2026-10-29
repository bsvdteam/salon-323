// Builds one signed .pkpass for a member, in the layout the requesting iPhone
// can show (the route picks it from the iOS version):
//  · poster (iOS 27+): posterGeneric — the member's card design photo
//    full-bleed behind the whole pass face, logo, tier, name and N° laid over
//    it like the dashboard card (src/components/salon/screens/tabs/card.tsx) —
//    plus the plain `generic` fallback Apple recommends next to it.
//  · otherwise: a storeCard only, the photo as a strip with the same fields —
//    the proven format; no new keys an older Wallet could reject. With an upcoming
// appointment both read as the appointment card and surface on the lock
// screen shortly before via relevantDate.
// A true card-shaped face without Apple's pass layout exists only for Apple
// Pay payment cards (card issuers), not for membership passes.
import { createHmac } from "node:crypto";
import { PKPass, PassType } from "passkit-generator";
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
type Field = PassType<"storeCard">["primaryFields"][number];

export async function buildMemberPass(
  data: MemberPassData,
  opts: { siteUrl: string; poster: boolean },
): Promise<Buffer> {
  const cfg = appleWalletConfig();
  const tier = tierOf(data.cuts);
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const since = formatInTimeZone(new Date(data.memberSince), TZ, "MMM yyyy", {
    locale: de,
  });
  // the card's own "SEIT 10·26"
  const sinceShort = formatInTimeZone(new Date(data.memberSince), TZ, "MM·yy");

  const design = cardStyles[data.card] ?? cardStyles[0];

  const pass = new PKPass(
    passImages(data.card, opts.poster),
    appleCertificates(),
    {
      passTypeIdentifier: cfg.passTypeIdentifier,
      teamIdentifier: cfg.teamIdentifier,
      organizationName: cfg.organizationName,
      serialNumber: data.memberId,
      description: "Salon 15 Karte",
      sharingProhibited: true, // a personal membership card
      backgroundColor: rgb(design.base),
      foregroundColor: rgb(design.text),
      // coral like the card's TERMIN badge; otherwise the card's muted white
      labelColor: data.appointment
        ? "rgb(244, 166, 158)"
        : "rgb(200, 208, 218)",
      // Phase 2: only emit a web service when it's actually configured, so the
      // device registers for push updates instead of staying static.
      ...(cfg.webServiceURL
        ? {
            webServiceURL: `${cfg.webServiceURL}/api/wallet/v1`,
            authenticationToken: authToken(data.memberId),
          }
        : {}),
    },
  );

  // No barcode: the front is the card. `store` carries the classic layout —
  // the storeCard itself, or on iOS 27 the generic fallback next to the poster.
  const poster = new PassType("posterGeneric");
  const store = new PassType(opts.poster ? "generic" : "storeCard");
  if (opts.poster) {
    pass.types.push(poster, store);
    // iOS 27: a button under the pass
    pass.featuredActions = [
      {
        identifier: "book",
        type: "bookAppointment",
        url: `${opts.siteUrl}/book`,
      },
    ];
  } else {
    pass.types.push(store);
  }

  const back: Field[] = [
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
  ];

  if (data.appointment) {
    const start = new Date(data.appointment.startsAt);
    const dateShort = formatInTimeZone(start, TZ, "EEE d. MMM", { locale: de });
    const dateLong = formatInTimeZone(start, TZ, "EEEE, d. MMMM", {
      locale: de,
    });
    const time = formatInTimeZone(start, TZ, "HH:mm", { locale: de });
    const service = serviceLabel(data.appointment.services);
    const date: Field = { key: "date", label: "TERMIN", value: dateShort };
    back.push(
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

    // poster: TERMIN top right, the time as the big title, place below
    poster.headerFields.push(date);
    poster.primaryFields.push(
      { key: "time", value: time, changeMessage: "Neuer Termin: %@" },
      { key: "service", label: "LEISTUNG", value: service },
    );
    poster.footerFields.push({
      key: "ort",
      value: `${salon.a1} · CHF ${data.appointment.priceChf}`.toUpperCase(),
    });

    store.headerFields.push(date);
    store.primaryFields.push({
      key: "time",
      label: dateLong,
      value: time,
      changeMessage: "Neuer Termin: %@",
    });
    store.secondaryFields.push(
      { key: "service", label: "LEISTUNG", value: service },
      {
        key: "no",
        label: "N°",
        value: data.memberNo,
        textAlignment: "PKTextAlignmentRight",
      },
    );
    store.auxiliaryFields.push(
      { key: "ort", label: "ORT", value: salon.a1 },
      {
        key: "preis",
        label: "PREIS",
        value: `CHF ${data.appointment.priceChf}`,
        textAlignment: "PKTextAlignmentRight",
      },
    );

    // Bring the pass to the lock screen around the appointment.
    pass.setRelevantDate(start);
  } else {
    back.unshift({ key: "cuts", label: "Cuts", value: String(data.cuts) });
    back.push({
      key: "hinweis",
      label: "Hinweis",
      value: "Beim Eintreten vorzeigen.",
    });
    const rank: Field = { key: "rank", label: "STUFE", value: tier.r };

    // poster = the card front: tier top right, name as the title, then
    // "N° 0001 · GUEST · SEIT 10·26" in the footer
    poster.headerFields.push(rank);
    poster.primaryFields.push({ key: "member", value: fullName });
    poster.footerFields.push({
      key: "no",
      value:
        `N° ${data.memberNo} · ${tier.n} · seit ${sinceShort}`.toUpperCase(),
    });

    store.headerFields.push(rank);
    store.primaryFields.push({
      key: "member",
      label: "MEMBER",
      value: fullName,
    });
    store.secondaryFields.push(
      { key: "no", label: "N°", value: data.memberNo },
      { key: "tier", label: "STUFE", value: tier.n },
      {
        key: "since",
        label: "SEIT",
        value: since,
        textAlignment: "PKTextAlignmentRight",
      },
    );
  }

  poster.backFields.push(...back);
  store.backFields.push(...back);

  return pass.getAsBuffer();
}
