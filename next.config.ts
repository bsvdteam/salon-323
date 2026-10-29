import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Wallet pass images are read from disk at runtime (lib/wallet/apple/
  // assets.ts) — ship them with that route's serverless function.
  outputFileTracingIncludes: {
    "/api/wallet/pass": ["src/lib/wallet/apple/assets/*.png"],
  },
};

export default nextConfig;
