import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Vercel's commit SHA gives every release a cache-busting asset identity.
  // This prevents an immutable CSS chunk from a previous design being reused.
  // Custom IDs on Vercel are limited to 32 characters.
  deploymentId: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 32),
  poweredByHeader: false,
  images: { formats: ['image/webp'] },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
