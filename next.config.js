/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        alias: {
          ...config.resolve.alias,
          'undici': 'node-fetch'
        }
      };
    }
    return config;
  },
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

module.exports = nextConfig; 