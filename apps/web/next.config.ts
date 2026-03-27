import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Local development
      { protocol: 'http', hostname: 'localhost', port: '4000' },
      // Google images (product/category images from Stitch)
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Render backend (production — update hostname after deployment)
      { protocol: 'https', hostname: '*.onrender.com' },
    ],
  },
  // Output standalone build for production (smaller, self-contained)
  output: 'standalone',
};

export default nextConfig;
