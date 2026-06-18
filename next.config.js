/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force new build id on every deploy to bust CDN cache
  generateBuildId: async () => 'build-' + Date.now(),
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
