/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during build to avoid circular structure errors
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.mypinata.cloud',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
      {
        protocol: 'https',
        hostname: 'white-immense-bedbug-311.mypinata.cloud',
      },
    ],
  },
  // Exclude kulfy-chat from build (it's a separate Next.js project)
  // Next.js will only scan the app/ directory, not kulfy-chat/app/
  // TypeScript exclusion in tsconfig.json handles type checking
  webpack: (config) => {
    // Ignore kulfy-chat and kulfy-agent directories from file watching
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/kulfy-chat/**',
        '**/kulfy-agent/**',
      ],
    };
    return config;
  },
}

module.exports = nextConfig

