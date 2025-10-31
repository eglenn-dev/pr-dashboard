import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable Cache Components for explicit caching control
  // Moved to root level as required by Next.js 16.0.1
  cacheComponents: true,
};

export default nextConfig;
