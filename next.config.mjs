/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // NEDEN remotePatterns: Google OAuth avatar URL'leri bu domain'lerden gelir.
    // Next.js Image optimization için whitelist gerekli.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google profile photos
        pathname: "/**",
      },
    ],
  },
  // NEDEN experimental.serverActions: Next.js 14'te Server Actions stable.
  // Ama Vercel deployment için explicit tanımlamak önerilir.
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
};

export default nextConfig;
