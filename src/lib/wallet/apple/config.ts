// Apple Wallet configuration, read from the environment. None of this is secret
// on its own (the identifiers are public, inside every .pkpass); the private key
// lives in the .p12 file referenced by APPLE_WALLET_CERT_DIR, outside the repo.
//
// Required for signing (Phase 1):
//   APPLE_WALLET_PASS_TYPE_ID   e.g. pass.ch.salon15.member
//   APPLE_WALLET_TEAM_ID        your Apple Developer Team ID, e.g. A1B2C3D4E5
//   APPLE_WALLET_CERT_DIR       folder (outside the repo) holding:
//                                 signerCert.p12   (exported from Keychain)
//                                 wwdr.pem / .cer  (Apple WWDR intermediate)
//   APPLE_WALLET_CERT_PASSWORD  the password set when exporting the .p12
// Optional:
//   APPLE_WALLET_ORG_NAME       defaults to "Salon 15"
//   APPLE_WALLET_WEB_SERVICE_URL  Phase 2 — base URL for automatic updates

export type AppleWalletConfig = {
  passTypeIdentifier: string;
  teamIdentifier: string;
  organizationName: string;
  certDir: string;
  certPassword: string;
  /** Base URL of the pass web service (no trailing slash). Enables auto-update. */
  webServiceURL: string | null;
};

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() ? v.trim() : undefined;
}

/** True when everything needed to sign a pass is present. The route uses this
 *  to return a friendly 503 instead of throwing before the cert is installed. */
export function isAppleWalletConfigured(): boolean {
  return Boolean(
    env("APPLE_WALLET_PASS_TYPE_ID") &&
      env("APPLE_WALLET_TEAM_ID") &&
      env("APPLE_WALLET_CERT_DIR") &&
      env("APPLE_WALLET_CERT_PASSWORD"),
  );
}

/** Resolve and validate the config. Throws a clear error for any missing piece. */
export function appleWalletConfig(): AppleWalletConfig {
  const passTypeIdentifier = env("APPLE_WALLET_PASS_TYPE_ID");
  const teamIdentifier = env("APPLE_WALLET_TEAM_ID");
  const certDir = env("APPLE_WALLET_CERT_DIR");
  const certPassword = env("APPLE_WALLET_CERT_PASSWORD");

  const missing = [
    !passTypeIdentifier && "APPLE_WALLET_PASS_TYPE_ID",
    !teamIdentifier && "APPLE_WALLET_TEAM_ID",
    !certDir && "APPLE_WALLET_CERT_DIR",
    !certPassword && "APPLE_WALLET_CERT_PASSWORD",
  ].filter(Boolean);
  if (missing.length) {
    throw new Error(
      `Apple Wallet env missing: ${missing.join(", ")} — see .env.example`,
    );
  }

  const webServiceURL = env("APPLE_WALLET_WEB_SERVICE_URL");
  return {
    passTypeIdentifier: passTypeIdentifier!,
    teamIdentifier: teamIdentifier!,
    organizationName: env("APPLE_WALLET_ORG_NAME") ?? "Salon 15",
    certDir: certDir!,
    certPassword: certPassword!,
    webServiceURL: webServiceURL ? webServiceURL.replace(/\/+$/, "") : null,
  };
}
