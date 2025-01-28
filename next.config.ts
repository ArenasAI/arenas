/** @type {import('next').NextConfig } */

import { hostname } from "os";

const nextConfig = {
   /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
};
const nextConfiguration = {
  ...nextConfig,
  async redirects() {
    // remove this redirect in next pearapp release
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.ARENAS_SERVER}/api/v1/:path*`,
        permanent: true,
      }
    ];
  },
};

module.exports = nextConfiguration;