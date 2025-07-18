import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // ⚠️ allowedDevOrigins is not yet supported in production builds (Next.js 15.3.5)
    // Removed to avoid Vercel build failure. Re-enable when officially supported.
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/v1/create-qr-code/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)\\.pkpass",
        headers: [
          {
            key: "Content-Type",
            value: "application/vnd.apple.pkpass",
          },
          {
            key: "Content-Disposition",
            value: "inline",
          },
          {
            key: "Cache-Control",
            value: "no-cache, must-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Requested-With",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
