import path from 'path';
import { NextConfig } from 'next';

// URL du backend pour les images
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';

const nextConfig: NextConfig = {
  webpack(config) {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
  output: 'standalone',
  // Configuration pour rediriger les requêtes d'images
  images: {
    domains: ['localhost', 'backend'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: 'backend',
        port: '5001',
        pathname: '/uploads/**',
      },
    ],
  },
  // Redirection des requêtes du dossier /uploads vers le backend
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
