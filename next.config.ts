import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude pdf-parse from bundling to avoid worker file resolution issues
  serverExternalPackages: ['pdf-parse'],
  
  // Empty turbopack config to silence the warning
  // PDF.js worker is loaded from /public/pdf.worker.min.mjs
  turbopack: {},
};

export default nextConfig;
