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
        ]
    }
};

export default nextConfig;
