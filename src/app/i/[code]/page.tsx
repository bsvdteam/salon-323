import type { Metadata } from "next";
import { SalonApp } from "@/components/salon/salon-app";
import { validateInvite } from "@/lib/db/invites";
import { OG_IMAGE } from "@/lib/site";

type Props = { params: Promise<{ code: string }> };

const clean = (raw: string) =>
  raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);

// The link preview (WhatsApp, iMessage …) names who invites — read on the
// server from the code, nothing else about the member is exposed.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const code = clean((await params).code);
  const v = code.length === 6 ? await validateInvite(code) : null;
  const title = v
    ? `${v.inviterName} lädt dich zu Salon 15 ein`
    : "Einladung zu Salon 15";
  const description =
    "Ein Raum, ein Stuhl, ein Barber. Rein kommt nur, wer eingeladen wird." +
    (v ? ` Dein Code: ${code}` : "");
  return {
    title,
    description,
    // Crawlable for link previews (WhatsApp, iMessage …) but never indexed —
    // invite codes don't belong in Google.
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      siteName: "Salon 15",
      locale: "de_CH",
      title,
      description,
      url: `/i/${code}`,
      images: [OG_IMAGE],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

// Invite link: opens the code entry with the code filled in and checked.
export default async function InviteLinkPage({ params }: Props) {
  const code = clean((await params).code);
  return <SalonApp start={{ screen: "login", mode: "invite", code }} />;
}
