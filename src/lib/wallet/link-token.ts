// SERVER-ONLY: a signed, short-lived link to a member's Wallet pass. Lets the
// "Zur Wallet" button work without the login cookie — in any browser and
// when iOS hands the link over to Safari (which has no session of its own).
import { createHmac, timingSafeEqual } from "node:crypto";

const TTL_MS = 24 * 60 * 60 * 1000; // refreshed on every app load

function sig(body: string): string {
  return createHmac("sha256", process.env.SESSION_SECRET ?? "")
    .update(`walletlink:${body}`)
    .digest("base64url");
}

export function walletLinkToken(memberId: string): string {
  const body = `${memberId}.${Date.now() + TTL_MS}`;
  return `${Buffer.from(body).toString("base64url")}.${sig(body)}`;
}

/** The member id if the token is genuine and not expired, else null. */
export function verifyWalletLinkToken(token: string): string | null {
  const [b64, s] = token.split(".");
  if (!b64 || !s) return null;
  const body = Buffer.from(b64, "base64url").toString();
  const a = Buffer.from(s);
  const b = Buffer.from(sig(body));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [mid, exp] = body.split(".");
  return Number(exp) > Date.now() ? mid : null;
}
