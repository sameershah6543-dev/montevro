import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Blob uploads + any https image URL pasted in the admin
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    qualities: [75, 85],
  },
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  serverExternalPackages: ["exceljs"],
};

export default nextConfig;
