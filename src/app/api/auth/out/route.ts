import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth/session";

/** A session whose member no longer exists: forget it, back to the landing. */
export async function GET(req: Request) {
  await clearSession();
  return NextResponse.redirect(new URL("/", req.url));
}
