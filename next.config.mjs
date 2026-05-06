/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      { hostname: "images.clerk.dev" },
    ],
  },
  serverExternalPackages: ["@prisma/client", "prisma"],

}

export default nextConfig;