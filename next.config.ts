import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co', // covers semua project supabase
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
