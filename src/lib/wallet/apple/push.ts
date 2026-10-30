// SERVER-ONLY: tell Wallet a member's pass changed. APNs (HTTP/2) with the
// Pass Type ID certificate itself as client certificate, topic = pass type id,
// empty payload — Wallet then asks our web service for the new pass. Wallet
// pass pushes only exist in production (no sandbox).
import http2 from "node:http2";
import { appleCertificates } from "./certificates";
import { appleWalletConfig, isAppleWalletConfigured } from "./config";
import { dropPushToken, pushTokensFor } from "./registrations";

const APNS = "https://api.push.apple.com";

function send(
  session: http2.ClientHttp2Session,
  token: string,
  topic: string,
): Promise<number> {
  return new Promise((resolve) => {
    const req = session.request({
      ":method": "POST",
      ":path": `/3/device/${token}`,
      "apns-topic": topic,
      "content-type": "application/json",
    });
    req.setTimeout(10_000, () => {
      req.close();
      resolve(0);
    });
    req.on("response", (h) => resolve(Number(h[":status"] ?? 0)));
    req.on("error", () => resolve(0));
    req.end("{}");
  });
}

/** Push to every device holding this member's pass. Never throws. */
export async function notifyPassChanged(memberId: string): Promise<void> {
  try {
    if (!isAppleWalletConfigured()) return;
    const tokens = await pushTokensFor(memberId);
    if (!tokens.length) return;
    const { signerCert, signerKey } = appleCertificates();
    const topic = appleWalletConfig().passTypeIdentifier;
    const session = http2.connect(APNS, { cert: signerCert, key: signerKey });
    session.on("error", () => {});
    try {
      const codes = await Promise.all(
        tokens.map((t) => send(session, t, topic)),
      );
      // 410 Unregistered / 400 BadDeviceToken → the device is gone
      await Promise.all(
        codes.map((c, i) =>
          c === 410 || c === 400 ? dropPushToken(tokens[i]) : null,
        ),
      );
      const failed = codes.filter((c) => c !== 200);
      if (failed.length)
        console.warn("[wallet] push statuses", codes.join(","));
    } finally {
      session.close();
    }
  } catch (e) {
    console.error("[wallet] push failed:", e);
  }
}
