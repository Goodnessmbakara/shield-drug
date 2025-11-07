/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
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

    // Exclude sharp and TensorFlow from client-side bundles
    if (!isServer) {
      config.externals = config.externals || [];
      config.externals.push('sharp');
      config.externals.push('@tensorflow/tfjs');
      config.externals.push('@tensorflow/tfjs-node');
    }

    // Handle TensorFlow native modules on server
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'canvas': false,
      };
    }

    return config;
  },
};

module.exports = nextConfig; 