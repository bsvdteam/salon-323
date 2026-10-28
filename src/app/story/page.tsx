import { SalonApp } from "@/components/salon/salon-app";

export default function StoryPage() {
  return <SalonApp start={{ screen: "login", overlay: "story" }} />;
}
