import { redirect } from "next/navigation";

// The welcome verse is a moment inside the login flow; a reload goes straight
// to the member app (which itself requires a member session).
export default function WelcomePage() {
  redirect("/home");
}
