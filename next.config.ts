import type { NextConfig } from "next";

// The browser only talks to this Next.js origin; /api/* is proxied to FastAPI.
// That keeps the auth cookie first-party (SameSite=Lax works) and avoids CORS.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  // Keeps the verification token in /verify-email?token=... out of Referer headers.
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Hide the Next.js dev tools "N" button shown in the corner during `npm run dev`
  devIndicators: false,
  experimental: {
    // /api/* is proxied to FastAPI; AI customization can take 30s+ (default proxy timeout is 30s).
    proxyTimeout: 180_000,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
