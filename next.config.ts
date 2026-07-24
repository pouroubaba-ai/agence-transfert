import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Ancrer la racine du workspace au projet (un autre lockfile existe dans Downloads).
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
