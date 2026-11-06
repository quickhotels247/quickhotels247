import type { Destination } from "@quickhotels/types/hotels";
import { homeImages } from "./images";

// Featured international destinations. Hotel counts load live from the
// backend (GET /api/v1/home/destination-stats).
export const popularDestinations: Destination[] = [
  { id: "bali", name: "Bali", country: "Indonesia", imageUrl: homeImages.bali },
  { id: "dubai", name: "Dubai", country: "UAE", imageUrl: homeImages.dubai },
  { id: "paris", name: "Paris", country: "France", imageUrl: homeImages.paris },
  { id: "new-york", name: "New York", country: "USA", imageUrl: homeImages.newYork },
];
