// SERVER-ONLY session. A signed, httpOnly cookie carries the member id + role.
// Imports next/headers, so it can only run on the server. The signature (HMAC
// with SESSION_SECRET) makes the cookie tamper-proof; it holds no secret, just
// an id the server trusts because the signature verifies.
import { cookies } from "next/headers";
import {
  COOKIE,
  cookieOptions,
  makeToken,
  readToken,
  type Session,
} from "./session-token";

export type { Role, Session } from "./session-token";

export async function setSession(s: Session): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, makeToken(s), cookieOptions);
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  return readToken(jar.get(COOKIE)?.value);
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
