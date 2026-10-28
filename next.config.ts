import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Artist images returned by Qloo
      { protocol: "https", hostname: "images.qloo.com" },
      // Spotify album art (used once the Spotify client is wired up)
      { protocol: "https", hostname: "i.scdn.co" },
    ],
  },
};

export default nextConfig;
