import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      "lucide-react": "./lib/icons/lucide-react-shim.tsx",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "lucide-react": path.join(__dirname, "lib/icons/lucide-react-shim.tsx"),
    };
    return config;
  },
};

export default nextConfig;
