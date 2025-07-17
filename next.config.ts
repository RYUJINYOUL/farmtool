import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "*.redwoodhikes.com"
            },
            {
                protocol: "https",
                hostname: "*.unsplash.com",
              },
              {
                protocol: "https",
                hostname: "*.pixabay.com",
              },
              {
                protocol: "http",
                hostname: "*.api.vworld.kr",
              },
              {
                protocol: "https",
                hostname: "firebasestorage.googleapis.com",
              },
        ]
    }
};




export default nextConfig;