/** @type {import('next').NextConfig} */

// CSP for the storefront. Allowlists the pixel/CAPI hosts we actually use
// (Snapchat, Meta, TikTok, WhatsApp redirect). Keep this list narrow — adding
// a host here grants it script execution rights on the page.
const cspDirectives = [
  "default-src 'self'",
  // next/script + framework inline bootstraps need 'unsafe-inline'; the pixel
  // SDKs also inject inline blocks. Keep 'unsafe-eval' off.
  "script-src 'self' 'unsafe-inline' https://sc-static.net https://tr.snapchat.com https://connect.facebook.net https://analytics.tiktok.com https://*.tiktok.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https: ",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://api.keychain.qa https://tr.snapchat.com https://sc-static.net https://www.facebook.com https://connect.facebook.net https://analytics.tiktok.com https://*.tiktok.com",
  "frame-src 'self' https://www.facebook.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://wa.me https://api.whatsapp.com",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: cspDirectives },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Don't leak Next.js version via the X-Powered-By header.
  poweredByHeader: false,
  images: {
    unoptimized: true,
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
