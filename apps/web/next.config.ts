import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      root: process.cwd(),
    }
  },
  transpilePackages: ['@musicdesk/database', '@musicdesk/integrations', '@musicdesk/utils']
};

export default nextConfig;
