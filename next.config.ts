import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
        ],
      },
    ];
  },
};

export default nextConfig;
