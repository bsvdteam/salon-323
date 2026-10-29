// Loads the Apple signing material and hands passkit-generator the three PEMs
// it needs: the WWDR intermediate, the Pass Type ID certificate, and its private
// key. The signer cert + key are extracted from a single .p12 (as exported from
// Keychain) with node-forge, so there are no manual openssl steps. The raw bytes
// come either from APPLE_WALLET_CERT_DIR (local dev) or from base64 env vars
// (serverless/Vercel). Cached per process.
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import forge from "node-forge";
import { appleWalletConfig, type AppleWalletConfig } from "./config";

// Matches passkit-generator's CertificatesSchema (not exported from the package);
// structurally compatible with what `new PKPass(_, certificates, _)` expects.
export type AppleCerts = {
  wwdr: string;
  signerCert: string;
  signerKey: string;
  signerKeyPassphrase?: string;
};

let cached: AppleCerts | null = null;

/** Find a file in dir by preferred name, else the first with one of the exts. */
function pick(dir: string, names: string[], exts: string[]): string {
  for (const n of names) {
    const p = join(dir, n);
    if (existsSync(p)) return p;
  }
  const hit = readdirSync(dir).find((f) =>
    exts.some((e) => f.toLowerCase().endsWith(e)),
  );
  if (hit) return join(dir, hit);
  throw new Error(
    `No ${exts.join("/")} found in APPLE_WALLET_CERT_DIR (${dir}); expected one of ${names.join(", ")}`,
  );
}

/** Raw .p12 and WWDR bytes — from base64 env (serverless) or the cert dir. */
function loadMaterial(cfg: AppleWalletConfig): { p12: Buffer; wwdr: Buffer } {
  if (cfg.signerP12Base64 && cfg.wwdrBase64) {
    return {
      p12: Buffer.from(cfg.signerP12Base64, "base64"),
      wwdr: Buffer.from(cfg.wwdrBase64, "base64"),
    };
  }
  const dir = cfg.certDir!;
  return {
    p12: readFileSync(pick(dir, ["signerCert.p12", "signer.p12"], [".p12"])),
    wwdr: readFileSync(pick(dir, ["wwdr.pem", "wwdr.cer"], [".pem", ".cer"])),
  };
}

/** Split a Keychain-exported .p12 into leaf-cert PEM + private-key PEM. */
function splitP12(
  der: Buffer,
  password: string,
): { signerCert: string; signerKey: string } {
  const p12 = forge.pkcs12.pkcs12FromAsn1(
    forge.asn1.fromDer(der.toString("binary")),
    password,
  );

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[
    forge.pki.oids.certBag
  ];
  const keyBags = [
    ...(p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
      forge.pki.oids.pkcs8ShroudedKeyBag
    ] ?? []),
    ...(p12.getBags({ bagType: forge.pki.oids.keyBag })[
      forge.pki.oids.keyBag
    ] ?? []),
  ];

  const key = keyBags.find((b) => b.key)?.key;
  if (!key) throw new Error("No private key in .p12 — wrong password or export?");

  // The signer is the leaf: the cert whose public key matches the private key.
  const certs = (certBags ?? []).map((b) => b.cert).filter(Boolean);
  if (!certs.length) throw new Error("No certificate found in .p12");
  const keyPub = forge.pki.setRsaPublicKey(
    (key as forge.pki.rsa.PrivateKey).n,
    (key as forge.pki.rsa.PrivateKey).e,
  );
  const wantN = keyPub.n.toString(16);
  const leaf =
    certs.find(
      (c) => (c!.publicKey as forge.pki.rsa.PublicKey).n?.toString(16) === wantN,
    ) ?? certs[0];

  return {
    signerCert: forge.pki.certificateToPem(leaf!),
    signerKey: forge.pki.privateKeyToPem(key),
  };
}

/** Normalize the WWDR cert to PEM; accept PEM as-is, convert DER (.cer). */
function wwdrToPem(buf: Buffer): string {
  const text = buf.toString("utf8");
  if (text.includes("BEGIN CERTIFICATE")) return text;
  const cert = forge.pki.certificateFromAsn1(
    forge.asn1.fromDer(buf.toString("binary")),
  );
  return forge.pki.certificateToPem(cert);
}

/** The signing material for passkit-generator, loaded once and reused. */
export function appleCertificates(): AppleCerts {
  if (cached) return cached;
  const cfg = appleWalletConfig();
  const { p12, wwdr } = loadMaterial(cfg);
  const { signerCert, signerKey } = splitP12(p12, cfg.certPassword);
  cached = { wwdr: wwdrToPem(wwdr), signerCert, signerKey };
  return cached;
}
