import { SalonApp } from "@/components/salon/salon-app";

// Barber enters the portal directly via /barber.
export default function BarberPage() {
  return <SalonApp start={{ screen: "admin" }} />;
}
