import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Prevent Turbopack/Webpack from bundling native node modules used only on the server
  serverExternalPackages: ["dockerode", "ssh2", "cpu-stat", "pdf-parse"],
};

export default nextConfig;
