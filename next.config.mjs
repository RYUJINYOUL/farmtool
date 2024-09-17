/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "*.redwoodhikes.com"
            }
        ]
    }
};

export default nextConfig;
