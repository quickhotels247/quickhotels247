import type { HotelAmenity } from "@quickhotels/types/hotels";

// Amenity filters in the order shown (most asked-for first), with labels.
export const AMENITY_LABELS: { id: HotelAmenity; label: string }[] = [
  { id: "wifi", label: "Free WiFi" },
  { id: "pool", label: "Swimming pool" },
  { id: "parking", label: "Parking" },
  { id: "restaurant", label: "Restaurant" },
  { id: "airConditioning", label: "Air conditioning" },
  { id: "spa", label: "Spa" },
  { id: "gym", label: "Fitness centre" },
  { id: "roomService", label: "Room service" },
  { id: "bar", label: "Bar" },
  { id: "airportShuttle", label: "Airport shuttle" },
  { id: "familyRooms", label: "Family rooms" },
  { id: "kitchen", label: "Kitchen" },
  { id: "petFriendly", label: "Pet friendly" },
  { id: "wheelchair", label: "Wheelchair accessible" },
  { id: "evCharging", label: "EV charging" },
  { id: "beach", label: "Private beach" },
];

export const amenityLabel = (id: HotelAmenity) => AMENITY_LABELS.find((amenity) => amenity.id === id)?.label ?? id;

// TripJack's property type names, as visitors would say them.
const PROPERTY_TYPE_LABELS: Record<string, string> = {
  GuestHouse: "Guest house",
  "Bed & breakfast": "Bed & breakfast",
  Aparthotel: "Aparthotel",
};

export const propertyTypeLabel = (type: string) => PROPERTY_TYPE_LABELS[type] ?? type;
