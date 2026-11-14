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
    background_color: "#fbf8f3",
    theme_color: "#1e3a32",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
