import { SalonApp } from "@/components/salon/salon-app";

export default function InvitePage() {
  return <SalonApp start={{ screen: "login", mode: "invite" }} />;
}
