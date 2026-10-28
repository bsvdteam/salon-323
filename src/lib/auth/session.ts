// SERVER-ONLY session. A signed, httpOnly cookie carries the member id + role.
// Imports next/headers, so it can only run on the server. The signature (HMAC
// with SESSION_SECRET) makes the cookie tamper-proof; it holds no secret, just
// an id the server trusts because the signature verifies.
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "s323";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

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

export async function setSession(s: Session): Promise<void> {
  const payload = Buffer.from(
    JSON.stringify({ mid: s.mid, role: s.role, iat: Date.now() }),
  ).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = raw.slice(0, dot);
  const expected = sign(payload);
  const a = Buffer.from(raw.slice(dot + 1));
  const b = Buffer.from(expected);
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

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
