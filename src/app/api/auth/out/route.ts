import { NextResponse } from "next/server";
import { clearSession, getSession } from "@/lib/auth/session";
import { getMemberById } from "@/lib/db/members";

/** A session whose member no longer exists: forget it, back to the landing.
 *  Only ever drops a dead session — a live one is left alone, so a foreign
 *  page can't log anyone out through this link. */
export async function GET(req: Request) {
  const s = await getSession();
  if (s && !(await getMemberById(s.mid))) await clearSession();
  return NextResponse.redirect(new URL("/", req.url));
}
