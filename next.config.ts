import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ['swr', '@ai-sdk/react']
};

export default nextConfig;
