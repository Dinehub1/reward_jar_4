import type { NextConfig } from "next";

// Dynamically allow Supabase Storage host for Next/Image
const supabaseHostname = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    return url ? new URL(url).hostname : undefined
  } catch {
    return undefined
  }
})()

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Performance optimizations
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header
  
  experimental: {
    // Performance improvements
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react'],
    turbo: {
      // Faster builds in development
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/v1/create-qr-code/**',
      },
      {
        protocol: 'https',
        hostname: 'developers.google.com',
        port: '',
        pathname: '/static/wallet/images/**',
      },
      // Supabase Storage public/signed objects (business logos, etc.)
      ...(supabaseHostname
        ? [
            {
              protocol: 'https' as const,
              hostname: supabaseHostname,
              port: '',
              pathname: '/storage/v1/object/public/**',
            },
            {
              protocol: 'https' as const,
              hostname: supabaseHostname,
              port: '',
              pathname: '/storage/v1/object/sign/**',
            },
          ]
        : []),
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
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
