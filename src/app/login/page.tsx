import { SalonApp } from "@/components/salon/salon-app";

export default function LoginPage() {
  return <SalonApp start={{ screen: "login", mode: "member" }} />;
}
