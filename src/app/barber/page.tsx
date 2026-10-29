import { SalonApp } from "@/components/salon/salon-app";
import { barberStart } from "@/lib/auth/guards";

// Barber only — without a barber session this redirects to the landing,
// where the barber signs in (username, then password).
export default async function BarberPage() {
  return <SalonApp start={await barberStart()} />;
}
