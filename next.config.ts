import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack does not walk up and pick a
  // lockfile from a parent directory.
  turbopack: {
    root: __dirname,
  },
  typedRoutes: true,
};

export default nextConfig;
