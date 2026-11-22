import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Wallet pass images are read from disk at runtime (lib/wallet/apple/
  // assets.ts) — ship them with that route's serverless function.
  outputFileTracingIncludes: {
    "/api/wallet/pass": ["src/lib/wallet/apple/assets/*.png"],
  },
  // the push service worker must never be served stale
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
