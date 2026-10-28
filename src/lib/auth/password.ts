// SERVER-ONLY password hashing. Uses Node's built-in scrypt (no dependency).
// Stored format: "scrypt$<saltHex>$<hashHex>". Only barber accounts have a
// password for now (see members.password_hash). Never import in the browser.
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEYLEN = 64;
// scrypt cost parameters (OWASP-ish: N=2^15). Tune up later if needed.
const PARAMS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN, PARAMS);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  if (salt.length === 0 || expected.length === 0) return false;
  const actual = scryptSync(password, salt, expected.length, PARAMS);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
