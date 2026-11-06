import { routes } from "@/config/navigation";
import { homeImages } from "./images";
import type { Offer } from "./types";

// SAMPLE DATA: real offers will come from the admin console's coupons and
// promotions (spec §5.8). Spec §4.1: only show offers that are active and
// have terms, so no discounts are promised here.
export const sampleOffers: Offer[] = [
  {
    id: "beach-escapes",
    title: "Beach escapes",
    description: "Beachfront stays in Goa, Kerala and the Andamans, with clear prices before you book.",
    ctaLabel: "Explore beach stays",
    href: `${routes.hotels}?${new URLSearchParams({ destination: "Goa" })}`,
    imageUrl: homeImages.beachHut,
  },
  {
    id: "wellness-weekends",
    title: "Wellness weekends",
    description: "Slow down at resorts with spas, pools and quiet rooms for a long weekend.",
    ctaLabel: "Find resorts",
    href: `${routes.hotels}?${new URLSearchParams({ propertyType: "resort" })}`,
    imageUrl: homeImages.spa,
  },
];
