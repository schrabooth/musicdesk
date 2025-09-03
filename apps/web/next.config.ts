import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        pathname: '/image/**',
      },
      {
        protocol: 'https',  
        hostname: 'is*.mzstatic.com',
        pathname: '/**',
      }
    ],
  },
  transpilePackages: ['@musicdesk/database', '@musicdesk/integrations', '@musicdesk/utils']
};

export default nextConfig;
