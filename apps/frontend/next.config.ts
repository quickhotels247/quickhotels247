import type { NextConfig } from "next";

const config: NextConfig = {
  // Shared workspace packages ship TypeScript source.
  transpilePackages: ["@quickhotels/types"],
  images: {
    // Photos load straight from their source (Unsplash, TripJack): resizing
    // on Cloudflare Workers would need the paid Cloudflare Images service.
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default config;
