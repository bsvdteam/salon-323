import { SalonApp } from "@/components/salon/salon-app";
import { memberStart } from "@/lib/auth/guards";

// Members only — checked on the server before anything renders.
export default async function HomePage() {
  return <SalonApp start={await memberStart("home")} />;
}
