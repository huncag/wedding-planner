import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wedding Planner",
    short_name: "Wedding Planner",
    description:
      "A private wedding planning dashboard for our celebration at Teleki Castle in Gernyeszeg, Romania.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7fbfe",
    theme_color: "#dceefa",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
