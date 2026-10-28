import { NextResponse } from "next/server";
import { authUrl } from "@/lib/google/calendar";

/**
 * Startet den EINMALIGEN Google-Login. Im Browser http://localhost:3000/api/google/auth
 * aufrufen, mit dem Salon-Google-Konto anmelden -> Google leitet zum Callback.
 */
export async function GET() {
  try {
    return NextResponse.redirect(authUrl());
  } catch (e) {
    return new Response(String(e), {
      status: 500,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}
