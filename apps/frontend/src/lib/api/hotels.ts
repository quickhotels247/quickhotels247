import type {
  HotelDetails,
  HotelFilters,
  HotelRoomsResponse,
  HotelSearchCriteria,
  HotelSearchRequest,
  HotelSearchResponse,
  HotelSort,
} from "@quickhotels/types/hotels";
import { apiRequest, postJson } from "./client";

export interface PageOptions extends HotelFilters {
  page?: number;
  pageSize?: number;
  sort?: HotelSort;
}

// Lists go as "4,5"; unset and false values are left out.
const query = (options: PageOptions) => {
  const params = new URLSearchParams(
    Object.entries(options).flatMap(([key, value]) =>
      value === undefined || value === false || (Array.isArray(value) && !value.length)
        ? []
        : [[key, Array.isArray(value) ? value.join(",") : String(value)]],
    ),
  ).toString();
  return params ? `?${params}` : "";
};

// Hotel search on our backend (spec §7.1). Results come page by page.
export const hotelsApi = {
  // Starts a search; returns page 1.
  search: (request: HotelSearchRequest, options: Omit<PageOptions, "page"> = {}, signal?: AbortSignal) =>
    postJson<HotelSearchResponse>(`/v1/searches${query(options)}`, request, { signal }),

  // Any page of an existing search (more hotels are priced as needed).
  results: (searchId: string, options: PageOptions = {}, signal?: AbortSignal) =>
    apiRequest<HotelSearchResponse>(`/v1/searches/${encodeURIComponent(searchId)}/results${query(options)}`, { signal }),

  // A hotel's page content: photos, description, facilities, policies.
  details: (hotelId: string, signal?: AbortSignal) =>
    apiRequest<HotelDetails>(`/v1/hotels/${encodeURIComponent(hotelId)}`, { signal }),

  // Live rooms and rates for a stay. searchId (from the results page) keeps
  // the supplier session of that search.
  rooms: (hotelId: string, stay: HotelSearchCriteria, searchId: string | null, signal?: AbortSignal) => {
    const params = new URLSearchParams({
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      rooms: String(stay.rooms),
      adults: String(stay.adults),
      children: String(stay.children),
    });
    if (stay.children > 0 && stay.childAges?.length) params.set("childAges", stay.childAges.join(","));
    if (searchId) params.set("searchId", searchId);
    return apiRequest<HotelRoomsResponse>(`/v1/hotels/${encodeURIComponent(hotelId)}/rooms?${params}`, { signal });
  },
};
