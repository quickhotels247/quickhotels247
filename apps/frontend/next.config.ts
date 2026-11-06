import type { NextConfig } from "next";

const config: NextConfig = {
  // Shared workspace packages ship TypeScript source.
  transpilePackages: ["@quickhotels/types"],
  images: {
    // Sample photos until hotel content comes from TripJack.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default config;
