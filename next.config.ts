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

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
