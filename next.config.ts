/** @type {import('next').NextConfig } */
import type { Configuration as WebpackConfig } from 'webpack';

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
  experimental: {
    turbo: {
      runtime: 'edge',
      resolveAlias: {
        'react': 'react-dom',
      },
    },
  },
  // reactStrictMode: true,
  output: 'standalone',
  productionBrowserSourceMaps: false,
  webpack: (config: WebpackConfig, { isServer }: { isServer: boolean }) => {
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    };

    // Minimize the bundle
    config.optimization.minimize = true;

    // Remove unused exports
    config.optimization.usedExports = true;

    // Enable tree shaking
    config.optimization.sideEffects = true;

    // Optimize for production
    if (!isServer && process.env.NODE_ENV === 'production') {
      config.optimization.moduleIds = 'deterministic';
      config.optimization.runtimeChunk = 'single';
      
      // Add additional production optimizations
      config.optimization.concatenateModules = true;
      config.optimization.removeEmptyChunks = true;
      config.optimization.mergeDuplicateChunks = true;
    }

    // Add module optimization
    config.module = {
      ...config.module,
      rules: [
        ...(config.module?.rules || []),
        {
          test: /\.js$/,
          sideEffects: false,
        },
      ],
    };

    return config;
  },
};

module.exports = nextConfig;