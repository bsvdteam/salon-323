// Apple Wallet configuration, read from the environment. None of this is secret
// on its own (the identifiers are public, inside every .pkpass); the private key
// lives in the .p12 — a file in APPLE_WALLET_CERT_DIR for local dev, or the
// base64 APPLE_WALLET_SIGNER_P12_BASE64 for serverless/Vercel (no filesystem).
//
// Required for signing:
//   APPLE_WALLET_PASS_TYPE_ID   e.g. pass.ch.salon15.member
//   APPLE_WALLET_TEAM_ID        your Apple Developer Team ID, e.g. YTDAV7L64P
//   APPLE_WALLET_CERT_PASSWORD  the password set when exporting the .p12
//   plus the certificate material, EITHER:
//     (local) APPLE_WALLET_CERT_DIR -> folder with signerCert.p12 + wwdr.cer
//     (prod)  APPLE_WALLET_SIGNER_P12_BASE64 + APPLE_WALLET_WWDR_BASE64
// Optional:
//   APPLE_WALLET_ORG_NAME          defaults to "Salon 15"
//   APPLE_WALLET_WEB_SERVICE_URL   Phase 2 — base URL for automatic updates

export type AppleWalletConfig = {
  passTypeIdentifier: string;
  teamIdentifier: string;
  organizationName: string;
  certPassword: string;
  // Local dev: a folder outside the repo. Null in serverless (base64 is used).
  certDir: string | null;
  // Serverless: the .p12 and WWDR cert as base64. Null when a dir is used.
  signerP12Base64: string | null;
  wwdrBase64: string | null;
  /** Base URL of the pass web service (no trailing slash). Enables auto-update. */
  webServiceURL: string | null;
};

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

/** True when the identifiers, password, and one cert source are all present.
 *  The route uses this to return a friendly 503 before certs are installed. */
export function isAppleWalletConfigured(): boolean {
  const hasMaterial =
    Boolean(env("APPLE_WALLET_CERT_DIR")) ||
    Boolean(
      env("APPLE_WALLET_SIGNER_P12_BASE64") && env("APPLE_WALLET_WWDR_BASE64"),
    );
  return Boolean(
    env("APPLE_WALLET_PASS_TYPE_ID") &&
      env("APPLE_WALLET_TEAM_ID") &&
      env("APPLE_WALLET_CERT_PASSWORD") &&
      hasMaterial,
  );
}

/** Resolve and validate the config. Throws a clear error for any missing piece. */
export function appleWalletConfig(): AppleWalletConfig {
  const passTypeIdentifier = env("APPLE_WALLET_PASS_TYPE_ID");
  const teamIdentifier = env("APPLE_WALLET_TEAM_ID");
  const certPassword = env("APPLE_WALLET_CERT_PASSWORD");
  const certDir = env("APPLE_WALLET_CERT_DIR") ?? null;
  const signerP12Base64 = env("APPLE_WALLET_SIGNER_P12_BASE64") ?? null;
  const wwdrBase64 = env("APPLE_WALLET_WWDR_BASE64") ?? null;

  const missing = [
    !passTypeIdentifier && "APPLE_WALLET_PASS_TYPE_ID",
    !teamIdentifier && "APPLE_WALLET_TEAM_ID",
    !certPassword && "APPLE_WALLET_CERT_PASSWORD",
  ].filter(Boolean);
  if (missing.length) {
    throw new Error(
      `Apple Wallet env missing: ${missing.join(", ")} — see .env.example`,
    );
  }

  if (!certDir && !(signerP12Base64 && wwdrBase64)) {
    throw new Error(
      "Apple Wallet certs missing: set APPLE_WALLET_CERT_DIR (local) or " +
        "APPLE_WALLET_SIGNER_P12_BASE64 + APPLE_WALLET_WWDR_BASE64 (serverless) — see .env.example",
    );
  }

  const webServiceURL = env("APPLE_WALLET_WEB_SERVICE_URL");
  return {
    passTypeIdentifier: passTypeIdentifier!,
    teamIdentifier: teamIdentifier!,
    organizationName: env("APPLE_WALLET_ORG_NAME") ?? "Salon 15",
    certPassword: certPassword!,
    certDir,
    signerP12Base64,
    wwdrBase64,
    webServiceURL: webServiceURL ? webServiceURL.replace(/\/+$/, "") : null,
  };
}
