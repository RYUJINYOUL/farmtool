/** @type {import('next').NextConfig} */
const nextConfig = {
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
