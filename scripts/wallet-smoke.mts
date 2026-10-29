// Dev smoke test: build both pass states end-to-end (fields, images, signing,
// zip) with the TEST certs in APPLE_WALLET_CERT_DIR. Not an Apple-valid pass —
// proves the pipeline only. Run:
//   APPLE_WALLET_* ... pnpm exec tsx scripts/wallet-smoke.mts <outDir>
import { writeFileSync } from "node:fs";
import { buildMemberPass, type MemberPassData } from "@/lib/wallet/apple/pass";

const member: MemberPassData = {
  memberId: "11111111-2222-3333-4444-555555555555",
  memberNo: "0047",
  firstName: "Luca",
  lastName: "Meier",
  cuts: 41,
  memberSince: "2024-02-15",
  appointment: null,
};

const appointment: MemberPassData = {
  ...member,
  appointment: {
    startsAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    services: ["haare", "bart"],
    priceChf: 20,
    durationMin: 30,
  },
};

const out = process.argv[2] ?? ".";
for (const [name, data] of Object.entries({ member, appointment })) {
  const buf = await buildMemberPass(data);
  const p = `${out}/salon15-${name}.pkpass`;
  writeFileSync(p, buf);
  console.log(`${name}: ${buf.length} bytes -> ${p}`);
}
