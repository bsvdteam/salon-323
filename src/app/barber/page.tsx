import { redirect } from "next/navigation";

// Old address of the barber portal — it lives at /admin now.
export default function BarberPage() {
  redirect("/admin");
}
