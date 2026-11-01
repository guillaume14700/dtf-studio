import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DTF Studio Pro — Design, Mockup 3D & RIP DTF",
    short_name: "DTF Studio",
    description:
      "Studio DTF professionnel : éditeur 300 DPI, mockups textiles S→XXXL, RIP canal blanc, gang sheet et coûts d'impression.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#17181d",
    theme_color: "#17181d",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
