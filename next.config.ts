import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: { root: process.cwd() },
  outputFileTracingIncludes: { "/**": ["./content/**/*"] },
};

export default nextConfig;
