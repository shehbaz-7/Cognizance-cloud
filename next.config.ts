import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { hostname: "ui.aceternity.com" },
      { hostname: "aceternity.com" },
      { hostname: "www.aceternity.com" },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  devIndicators: {
    position: 'top-right',
  },
};

export default nextConfig;
