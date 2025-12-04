import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude pdf-parse from bundling to avoid worker file resolution issues
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
