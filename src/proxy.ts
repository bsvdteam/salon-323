import { NextResponse, type NextRequest } from "next/server";
import { COOKIE, cookieOptions, readToken } from "@/lib/auth/session-token";

/**
 * Stay signed in.
 * - Opening salon15.ch (or the home-screen app, whose start_url is "/") with a
 *   valid session goes straight into the app instead of the landing page.
 * - Every visit renews the cookie's lifetime, so an active member is never
 *   logged out.
 * Optimistic only: the pages themselves still check the session.
 */
export function proxy(req: NextRequest) {
  const raw = req.cookies.get(COOKIE)?.value;
  const s = readToken(raw);
  if (!s || !raw) return NextResponse.next();

  const { pathname } = req.nextUrl;
  const res =
    pathname === "/" || pathname === "/login"
      ? NextResponse.redirect(
          new URL(s.role === "barber" ? "/admin" : "/home", req.url),
        )
      : NextResponse.next();
  res.cookies.set(COOKIE, raw, cookieOptions);
  return res;
}

export const config = {
  // app pages only — never assets, API routes or the Wallet web service
  matcher: ["/", "/login", "/home", "/book", "/card", "/circle", "/admin"],
};
