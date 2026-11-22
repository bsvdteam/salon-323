// The session token itself: sign and verify, no request APIs — so both the
// server code (session.ts) and the proxy (src/proxy.ts) can use it.
import { createHmac, timingSafeEqual } from "crypto";

export const COOKIE = "s323";
// Stay signed in: about as long as browsers allow (Chrome caps at 400 days),
// renewed on every visit by the proxy — so it practically never runs out.
export const MAX_AGE = 60 * 60 * 24 * 400;

export type Role = "member" | "barber";
export type Session = { mid: string; role: Role };

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET missing in .env.local");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function makeToken(s: Session): string {
  const payload = Buffer.from(
    JSON.stringify({ mid: s.mid, role: s.role, iat: Date.now() }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readToken(raw: string | undefined): Session | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = raw.slice(0, dot);
  const a = Buffer.from(raw.slice(dot + 1));
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const obj = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof obj.mid !== "string") return null;
    if (obj.role !== "member" && obj.role !== "barber") return null;
    return { mid: obj.mid, role: obj.role };
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};
