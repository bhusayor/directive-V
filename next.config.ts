import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // A local development server must not overwrite production preview chunks.
  distDir: process.env.NODE_ENV === "production" ? ".next-production" : ".next",
  images: {
    qualities: [75, 85, 90],
    deviceSizes: [640, 750, 828, 1080, 1200, 1672, 1920],
  },
};

export default nextConfig;
