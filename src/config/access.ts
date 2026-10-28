// ───────────────────────────────────────────────────────────────────────────
// SALON 323 · ZUGANGSCODES (Einladungscodes)
// ───────────────────────────────────────────────────────────────────────────
//
// Hier trägst du die gültigen Einladungscodes ein. Wer auf der Landing
// "Mitglied werden" wählt und einen dieser Codes eingibt, kommt ins
// Onboarding. Der Vorname wird vom Code vorgegeben und ist für die Person
// fix (sie kann ihn im Onboarding NICHT ändern).
//
// So fügst du einen Code hinzu — eine neue Zeile im Array unten:
//
//   { code: "AB12CD", firstName: "Jonas", invitedBy: "Luca M." },
//
//   code       6 Zeichen, A–Z und 0–9 (Gross-/Kleinschreibung egal,
//              wird automatisch gross geschrieben). Jeder Code nur einmal.
//   firstName  Vorname, der im Onboarding fix erscheint.
//   invitedBy  Wer eingeladen hat — erscheint als "Von … · für …".
//
// Hinweis: Das ist die Übergangslösung, bis Supabase angebunden ist. Danach
// kommen die Codes aus der Datenbank (Tabelle invites) statt aus dieser Datei.
// ───────────────────────────────────────────────────────────────────────────

export type InviteCode = {
  code: string;
  firstName: string;
  invitedBy: string;
};

export const inviteCodes: InviteCode[] = [
  // ↓ Deine Codes hier einfügen:
  { code: "NH4K2P", firstName: "Noah", invitedBy: "Marco R." },
];

/** Normalises user input the same way the code field does. */
export function normalizeCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

/** Returns the matching invite, or null if the code is not valid. */
export function findInviteCode(raw: string): InviteCode | null {
  const v = normalizeCode(raw);
  if (v.length < 6) return null;
  return inviteCodes.find((c) => normalizeCode(c.code) === v) ?? null;
}
