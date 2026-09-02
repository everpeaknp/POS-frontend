import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    // Dev backend runs on 127.0.0.1/localhost, which the image optimizer
    // otherwise refuses to fetch from as an SSRF guard against private IPs.
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.esewa.com.np",
      },
      {
        protocol: "https",
        hostname: "khalti.com",
      },
      {
        protocol: "https",
        hostname: "fonepay.com",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
      },
    ],
  },
  turbopack: {
    root: __dirname,
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
