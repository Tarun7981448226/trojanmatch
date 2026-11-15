import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trojan JobMatch",
    short_name: "Trojan JobMatch",
    description: "Every Trojan deserves the right match.",
    start_url: "/login",
    display: "standalone",
    background_color: "#f4f4f2",
    theme_color: "#990000",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
