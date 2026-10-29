import { redirect } from "next/navigation";

// Onboarding only exists right after a valid invite code was entered; a reload
// or a direct link starts again at the code entry.
export default function OnboardingPage() {
  redirect("/invite");
}
