import type { HotelSearchCriteria } from "@quickhotels/types/hotels";
import { searchDefaults } from "@/config/searchDefaults";

type Stay = Pick<HotelSearchCriteria, "checkIn" | "checkOut"> & Partial<Pick<HotelSearchCriteria, "rooms" | "adults" | "children" | "childAges">>;

// Link to a hotel's page with the stay already chosen. From search results,
// pass the searchId so its rooms are priced in the same supplier session.
export function hotelUrl(hotelId: string, stay?: Stay, searchId?: string) {
  if (!stay) return `/hotels/${encodeURIComponent(hotelId)}`;
  const children = stay.children ?? 0;
  const params = new URLSearchParams({
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    rooms: String(stay.rooms ?? searchDefaults.rooms),
    adults: String(stay.adults ?? searchDefaults.adults),
    children: String(children),
  });
  if (children > 0 && stay.childAges?.length) params.set("childAges", stay.childAges.join(","));
  if (searchId) params.set("searchId", searchId);
  return `/hotels/${encodeURIComponent(hotelId)}?${params}`;
}
