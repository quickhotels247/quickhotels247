import type { CheckoutRoomGuests } from "@quickhotels/types/checkout";
import type { HotelSearchCriteria } from "@quickhotels/types/hotels";

// Spreads a stay's totals across its rooms as evenly as possible: adults
// first to earlier rooms, children dealt out room by room like cards. Every
// supplier is asked with this split, and checkout collects guests by it.
export function splitGuests({ rooms, adults, childAges = [] }: Pick<HotelSearchCriteria, "rooms" | "adults" | "childAges">): CheckoutRoomGuests[] {
  return Array.from({ length: rooms }, (_, room) => ({
    adults: Math.floor(adults / rooms) + (room < adults % rooms ? 1 : 0),
    childAges: childAges.filter((_, child) => child % rooms === room),
  }));
}
