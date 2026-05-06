/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com" },
      { hostname: "images.clerk.dev" },
    ],
  },
  serverExternalPackages: ["@prisma/client", "prisma"],

  // ✅ ADD THIS
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;