import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

// Private or per-visitor pages stay out of search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/checkout", "/booking", "/sso-callback", "/flights/review", "/login", "/signup"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
