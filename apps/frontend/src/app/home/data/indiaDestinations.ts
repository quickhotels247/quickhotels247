import { homeImages } from "./images";
import type { IndiaDestination, TripTheme } from "./types";

// Featured Indian destinations and their trip themes. Hotel counts load live
// from the backend (GET /api/v1/home/destination-stats).
export const indiaDestinations: IndiaDestination[] = [
  { id: "goa", name: "Goa", state: "Goa", country: "India", imageUrl: homeImages.goa, themes: ["beaches"] },
  { id: "jaipur", name: "Jaipur", state: "Rajasthan", country: "India", imageUrl: homeImages.jaipur, themes: ["heritage", "cities"] },
  { id: "mumbai", name: "Mumbai", state: "Maharashtra", country: "India", imageUrl: homeImages.mumbai, themes: ["cities"] },
  { id: "new-delhi", name: "New Delhi", state: "Delhi", country: "India", imageUrl: homeImages.delhi, themes: ["heritage", "cities"] },
  { id: "agra", name: "Agra", state: "Uttar Pradesh", country: "India", imageUrl: homeImages.agra, themes: ["heritage"] },
  { id: "kerala", name: "Kerala", state: "Kerala", country: "India", imageUrl: homeImages.kerala, themes: ["beaches"] },
  { id: "manali", name: "Manali", state: "Himachal Pradesh", country: "India", imageUrl: homeImages.manali, themes: ["hills"] },
  { id: "shimla", name: "Shimla", state: "Himachal Pradesh", country: "India", imageUrl: homeImages.shimla, themes: ["hills"] },
  { id: "darjeeling", name: "Darjeeling", state: "West Bengal", country: "India", imageUrl: homeImages.darjeeling, themes: ["hills"] },
  { id: "andaman", name: "Andaman Islands", state: "Andaman and Nicobar", country: "India", imageUrl: homeImages.andaman, themes: ["beaches"] },
];

export const tripThemes: { id: TripTheme; label: string }[] = [
  { id: "beaches", label: "Beaches" },
  { id: "hills", label: "Hill stations" },
  { id: "heritage", label: "Heritage" },
  { id: "cities", label: "City breaks" },
];
