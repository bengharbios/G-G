import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["@libsql/client", "@prisma/adapter-libsql", "sharp", "@vercel/blob"],
};

export default nextConfig;
