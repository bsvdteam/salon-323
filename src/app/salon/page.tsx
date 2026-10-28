import { SalonApp } from "@/components/salon/salon-app";

export default function SalonPage() {
  return <SalonApp start={{ screen: "login", overlay: "salon" }} />;
}
