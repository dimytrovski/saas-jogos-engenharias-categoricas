import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/hls/:path*",
        destination: "http://127.0.0.1/hls/:path*",
      },
      {
        source: "/dash/:path*",
        destination: "http://127.0.0.1/dash/:path*",
      },
    ];
  },
};

export default nextConfig;
