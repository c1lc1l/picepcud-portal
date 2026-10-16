import path from "node:path";
import type { NextConfig } from "next";

// Baseline hardening for every response. Framing is blocked outright (the
// login and payment forms must never be embeddable for clickjacking), MIME
// sniffing is off, and referrers don't leak full URLs to other sites. A full
// script CSP is left for later: Next's inline bootstrap scripts need nonces.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

// Only the public highlight-photos bucket is optimized by next/image; every
// other remote URL is refused by the image optimizer.
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Pin the workspace root so a stray lockfile in a parent folder isn't
  // mistaken for it.
  turbopack: { root: path.join(__dirname) },
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/highlight-photos/**",
            search: "",
          },
        ]
      : [],
    // Remote images shouldn't send the optimizer through redirects.
    maximumRedirects: 0,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
