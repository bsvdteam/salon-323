import { NextResponse } from "next/server";
import { authUrl } from "@/lib/google/calendar";
import { getSession } from "@/lib/auth/session";

/**
 * Startet den EINMALIGEN Google-Login. Im Browser http://localhost:3000/api/google/auth
 * aufrufen, mit dem Salon-Google-Konto anmelden -> Google leitet zum Callback.
 */
export async function GET() {
  const s = await getSession();
  if (s?.role !== "barber")
    return new Response("Nur mit Barber-Login.", { status: 403 });
  try {
    return NextResponse.redirect(authUrl());
  } catch (e) {
    return new Response(String(e), {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}
