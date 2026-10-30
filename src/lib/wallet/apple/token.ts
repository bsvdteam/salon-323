// SERVER-ONLY: the pass's authenticationToken. Wallet sends it back as
// "Authorization: ApplePass <token>" on every web-service call for that pass.
// Stable per member, derived from SESSION_SECRET — nothing to store.
import { createHmac, timingSafeEqual } from "node:crypto";

export function authToken(memberId: string): string {
  const secret = process.env.SESSION_SECRET ?? "";
  return createHmac("sha256", secret)
    .update(`wallet:${memberId}`)
    .digest("base64url");
}

/** True when the request carries this member's pass token. */
export function hasPassAuth(req: Request, memberId: string): boolean {
  const m = /^ApplePass (.+)$/.exec(req.headers.get("authorization") ?? "");
  if (!m) return false;
  const a = Buffer.from(m[1]);
  const b = Buffer.from(authToken(memberId));
  return a.length === b.length && timingSafeEqual(a, b);
}
