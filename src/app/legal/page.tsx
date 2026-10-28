import { SalonApp } from "@/components/salon/salon-app";

export default function LegalPage() {
  return <SalonApp start={{ screen: "login", overlay: "legal" }} />;
}
