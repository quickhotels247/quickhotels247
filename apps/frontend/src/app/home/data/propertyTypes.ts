import { homeImages } from "./images";
import type { PropertyType } from "./types";

// The property types TripJack's hotel content can be filtered by. Confirm the
// exact values against TripJack's static data in roadmap step 6.
export const propertyTypes: PropertyType[] = [
  { id: "hotel", label: "Hotels", imageUrl: homeImages.hotelRoom },
  { id: "resort", label: "Resorts", imageUrl: homeImages.resort },
  { id: "villa", label: "Villas", imageUrl: homeImages.villa },
  { id: "apartment", label: "Apartments", imageUrl: homeImages.apartment },
  { id: "homestay", label: "Homestays", imageUrl: homeImages.homestay },
];
