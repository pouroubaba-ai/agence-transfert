import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Ancrer la racine du workspace au projet (un autre lockfile existe dans Downloads).
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Le service worker ne doit jamais être mis en cache : les mises à jour de l'app
  // doivent être prises en compte immédiatement.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
