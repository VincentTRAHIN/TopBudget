import { NextConfig } from "next";
import path from "path";

// Valider les variables d'environnement dès le démarrage
import "./src/config/env.config";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

const nextConfig: NextConfig = {
  webpack(config) {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
  output: "standalone",
  eslint: {
    // Ignore ESLint errors during builds for Docker testing
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during builds for Docker testing
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5001",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "backend",
        port: "5001",
        pathname: "/uploads/**",
      },
    ],
    // Ignorer les erreurs d'images en dev (avatars manquants)
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    unoptimized: process.env.NODE_ENV === "development",
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${BACKEND_URL}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
