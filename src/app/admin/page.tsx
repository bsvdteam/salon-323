import { SalonApp } from "@/components/salon/salon-app";
import { barberStart } from "@/lib/auth/guards";

// The barber portal. Without a barber session this shows the barber login
// (username + password); after signing in the portal opens on the same URL.
export default async function AdminPage() {
  return <SalonApp start={await barberStart()} />;
}
