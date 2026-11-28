import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/config/site";

// Lets phones install the site as an app (home-screen icon, opens full
// screen). Served at /manifest.webmanifest and linked from every page.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "QuickHotels",
    description: "Book hotels and flights with live prices and secure checkout.",
    id: "/",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#1a56db",
    categories: ["travel"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
