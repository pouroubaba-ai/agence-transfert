import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Agence Transfert",
    short_name: "LS",
    description: "Grand livre digital — transferts, clients et soldes",
    start_url: "/",
    display: "standalone",
    background_color: "#0a5f45",
    theme_color: "#0e7c5a",
    lang: "fr",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
