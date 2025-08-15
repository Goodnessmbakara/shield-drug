/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      child_process: false,
      crypto: false,
      events: false,
      os: false,
    };

    // Exclude sharp from client-side bundles
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push('sharp');
    }

    return config;
  },
};

module.exports = nextConfig; 