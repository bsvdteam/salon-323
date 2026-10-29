// One-time: create (or update) the barber/admin account. Asks for username +
// password (hidden), hashes with scrypt (identical params to
// src/lib/auth/password.ts), and inserts a members row with is_barber = true.
// The password is never printed and never stored in plaintext.
//
// Run: node --env-file=.env.local scripts/create-barber.mjs
import { createClient } from "@supabase/supabase-js";
import { randomBytes, scryptSync } from "crypto";
import readline from "readline";

// — scrypt (keep in sync with src/lib/auth/password.ts) —
const KEYLEN = 64;
const PARAMS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
function hashPassword(pw) {
  const salt = randomBytes(16);
  const hash = scryptSync(pw, salt, KEYLEN, PARAMS);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

function ask(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(query, (a) => (rl.close(), res(a.trim()))));
}

function askHidden(query) {
  return new Promise((resolve) => {
    process.stdout.write(query);
    const stdin = process.stdin;
    stdin.resume();
    stdin.setRawMode(true);
    let input = "";
    const onData = (buf) => {
      const ch = buf.toString("utf8");
      if (ch === "\n" || ch === "\r" || ch === "\u0004") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        resolve(input);
      } else if (ch === "\u0003") {
        process.stdout.write("\n");
        process.exit(1);
      } else if (ch === "\u007f" || ch === "\b") {
        if (input.length) {
          input = input.slice(0, -1);
          process.stdout.write("\b \b");
        }
      } else {
        input += ch;
        process.stdout.write("*");
      }
    };
    stdin.on("data", onData);
  });
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

console.log("\nSalon 15 · Barber/Admin anlegen\n");

// Profile can be pre-filled via env vars; otherwise we prompt. The password is
// NEVER taken from env — it is always typed here, hidden, and only hashed.
const name =
  process.env.BARBER_NAME ||
  (await ask("Anzeigename (z. B. dein Vorname) [Barber]: ")) ||
  "Barber";
const username = (
  process.env.BARBER_USERNAME || (await ask("Login-Username (a–z, 0–9, _): "))
).toLowerCase();
if (!/^[a-z0-9_]{2,20}$/.test(username)) {
  console.error("✗ Ungültiger Username (2–20 Zeichen: a–z, 0–9, _).");
  process.exit(1);
}
const email = process.env.BARBER_EMAIL || (await ask("E-Mail (optional): ")) || null;
const phone = process.env.BARBER_PHONE || (await ask("Telefon (optional): ")) || "";
console.log(`\n→ ${name}  ·  @${username}${email ? "  ·  " + email : ""}\n`);
const pw1 = await askHidden("Passwort (min. 8 Zeichen): ");
if (pw1.length < 8) {
  console.error("✗ Passwort zu kurz (min. 8 Zeichen).");
  process.exit(1);
}
const pw2 = await askHidden("Passwort wiederholen: ");
if (pw1 !== pw2) {
  console.error("✗ Passwörter stimmen nicht überein.");
  process.exit(1);
}

// Update if this username already exists as a barber, else insert a new barber.
const { data: existing } = await sb
  .from("members")
  .select("id, is_barber")
  .eq("username", username)
  .maybeSingle();

const password_hash = hashPassword(pw1);

if (existing) {
  if (!existing.is_barber) {
    console.error("✗ Dieser Username gehört schon einem Mitglied. Wähle einen anderen.");
    process.exit(1);
  }
  const { error } = await sb
    .from("members")
    .update({ password_hash, first_name: name, phone, contact_email: email })
    .eq("id", existing.id);
  if (error) {
    console.error("✗ Fehler:", error.message);
    process.exit(1);
  }
  console.log(`\n✓ Barber-Daten + Passwort aktualisiert (Username: ${username}).`);
} else {
  const { error } = await sb.from("members").insert({
    member_no: "0000",
    username,
    first_name: name,
    last_name: "",
    phone,
    contact_email: email,
    is_barber: true,
    password_hash,
  });
  if (error) {
    console.error("✗ Fehler:", error.message);
    process.exit(1);
  }
  console.log(`\n✓ Barber angelegt. Login unter /barber mit Username: ${username}`);
}
process.exit(0);
