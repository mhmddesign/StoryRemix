import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/:locale(en|fr|ar)",
        destination: "/",
        permanent: false,
      },
      {
        source: "/:locale(en|fr|ar)/:path*",
        destination: "/:path*",
        permanent: false,
      },
      {
        source: "/story/:slug",
        destination: "/stories/:slug",
        permanent: true,
      },
      {
        source: "/stories",
        destination: "/explore",
        permanent: true,
      },
      {
        source: "/auth/login",
        destination: "/login",
        permanent: true,
      },
      {
        source: "/auth/signup",
        destination: "/register",
        permanent: true,
      },
      {
        source: "/active-rounds",
        destination: "/rounds",
        permanent: true,
      },
      {
        source: "/rankings",
        destination: "/leaderboards",
        permanent: true,
      },
      {
        source: "/awards",
        destination: "/competitions",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
