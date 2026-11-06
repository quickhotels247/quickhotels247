import type { HotelAmenity } from "@quickhotels/types/hotels";

// TripJack facility names (from hotel content) for each amenity we filter by.
// Names checked against the facilities of ~35k cached hotels.
const FACILITIES: Record<HotelAmenity, string[]> = {
  wifi: ["Wifi", "Internet Access", "Wired Internet"],
  parking: ["Parking"],
  pool: ["Swimming Pool", "Pool"],
  spa: ["Spa"],
  gym: ["Fitness Center", "Fitness Facilities"],
  restaurant: ["Restaurant"],
  bar: ["Bar", "Bar/Lounges", "Poolside Bar"],
  roomService: ["Room Service"],
  airportShuttle: ["Airport Transportation", "Accessible Airport Shuttle"],
  airConditioning: ["Air Conditioner"],
  kitchen: ["Kitchen", "Shared Kitchen"],
  petFriendly: ["Pet Friendly", "Pet-Friendly"],
  familyRooms: ["Family Room"],
  wheelchair: ["Wheelchair Accessible"],
  evCharging: ["Electric Car Charging Station", "Car Power Charging Station"],
  beach: ["Private Beach"],
};

const BY_FACILITY = new Map(
  Object.entries(FACILITIES).flatMap(([amenity, names]) => names.map((name) => [name.toLowerCase(), amenity as HotelAmenity] as const)),
);

// A hotel's facility list → our amenities, each once.
export function toAmenities(facilities: string[]): HotelAmenity[] {
  const found = new Set<HotelAmenity>();
  for (const facility of facilities) {
    const amenity = BY_FACILITY.get(facility.trim().toLowerCase());
    if (amenity) found.add(amenity);
  }
  return [...found];
}
