import type { LinkGroup } from "./types";

// "Popular with travellers from India": plain search links, good for SEO.
export const popularLinkGroups: LinkGroup[] = [
  {
    id: "domestic",
    label: "Domestic cities",
    links: ["Goa", "Mumbai", "New Delhi", "Bengaluru", "Hyderabad", "Chennai", "Jaipur", "Udaipur", "Kochi", "Pune", "Kolkata", "Manali"].map(
      (city) => ({ label: `Hotels in ${city}`, destination: city }),
    ),
  },
  {
    id: "international",
    label: "International cities",
    links: ["Dubai", "Bangkok", "Singapore", "Bali", "Kuala Lumpur", "Phuket", "London", "Paris", "Colombo", "Kathmandu", "Maldives", "New York"].map(
      (city) => ({ label: `Hotels in ${city}`, destination: city }),
    ),
  },
  {
    id: "regions",
    label: "Regions",
    links: ["Kerala", "Rajasthan", "Himachal Pradesh", "Goa", "Uttarakhand", "Kashmir", "Andaman Islands", "Sikkim", "Coorg", "Ooty"].map(
      (region) => ({ label: `Hotels in ${region}`, destination: region }),
    ),
  },
];
