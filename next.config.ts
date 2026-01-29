import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Remove 'standalone' output for Vercel deployment
  // Vercel handles the output automatically
  // output: 'standalone',
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.hoaphat.com.vn',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'viglacera.com.vn',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'prime.vn',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.inax.com.vn',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.tondonga.com.vn',
        pathname: '/**',
      }
    ],
    unoptimized: false,
    minimumCacheTTL: 60,
  },
  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(self)'
          },
        ],
      },
    ]
  },
};

import { withSentryConfig } from "@sentry/nextjs";

const sentryConfig = withSentryConfig(nextConfig, {
  silent: true,
  org: "smartbuild-ai",
  project: "javascript-nextjs",
});

export default withPWA(sentryConfig);
