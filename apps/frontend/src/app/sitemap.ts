import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { CITY_PAGES } from "./hotels/in/data/cities";

// Public pages for search engines. Hotel pages join when there's a list of
// hotels to publish (they need dates for prices, so they're found via search).
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "weekly") => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  });
  return [
    page("/", 1, "daily"),
    page("/flights", 0.8, "daily"),
    ...CITY_PAGES.map((city) => page(`/hotels/in/${city.slug}`, city.group === "india" ? 0.8 : 0.7)),
    page("/help", 0.5, "monthly"),
    page("/terms", 0.2, "yearly"),
    page("/privacy", 0.2, "yearly"),
  ];
}
