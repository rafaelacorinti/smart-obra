/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost'],
    unoptimized: true,
  },
  webpack: (config) => {
    config.externals = [...(config.externals || []), '@prisma/client'];
    return config;
  },
};

module.exports = nextConfig;
