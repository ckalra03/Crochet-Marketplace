import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Local development
      { protocol: 'http', hostname: 'localhost', port: '4000' },
      // Google images (product/category images from Stitch)
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      // Render backend (production)
      { protocol: 'https', hostname: '*.onrender.com' },
      // Cloudinary CDN (product images)
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  // Note: do NOT use output: 'standalone' on Vercel — Vercel handles this natively
};

export default nextConfig;
