import type { HotelSearchRequest } from "@quickhotels/types/hotels";
import { splitGuests } from "../../features/hotels/room-guests.js";
import type { TripjackRoomRequest } from "./tripjack.types.js";

// TripJack limits per room (Listing API docs).
const MAX_ADULTS_PER_ROOM = 6;
const MAX_CHILDREN_PER_ROOM = 4;

// Spreads our totals (rooms, adults, children with ages) across rooms as
// evenly as possible, as TripJack wants one entry per room. Returns null when
// they can't fit TripJack's per-room limits.
export function toTripjackRooms({ rooms, adults, children, childAges = [] }: HotelSearchRequest): TripjackRoomRequest[] | null {
  if (adults < rooms || adults > rooms * MAX_ADULTS_PER_ROOM || children > rooms * MAX_CHILDREN_PER_ROOM) return null;
  if (children > 0 && childAges.length !== children) return null;
  return splitGuests({ rooms, adults, childAges }).map(({ adults: roomAdults, childAges: ages }) =>
    ages.length ? { adults: roomAdults, children: ages.length, childAge: ages } : { adults: roomAdults },
  );
}
