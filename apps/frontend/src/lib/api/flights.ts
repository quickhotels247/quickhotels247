import type { FlightFilters, FlightSearchCriteria, FlightSearchResponse, FlightSort, PopularRouteFare } from "@quickhotels/types/flights";
import { apiRequest, postJson } from "./client";

export interface FlightPageOptions extends FlightFilters {
  trip?: string; // "ONWARD", "RETURN", "COMBO", or "0", "1"… for multi-city
  page?: number;
  pageSize?: number;
  sort?: FlightSort;
}

// Lists go as "0,1"; unset and false values are left out.
const query = (options: FlightPageOptions) => {
  const params = new URLSearchParams(
    Object.entries(options).flatMap(([key, value]) =>
      value === undefined || value === false || (Array.isArray(value) && !value.length)
        ? []
        : [[key, Array.isArray(value) ? value.join(",") : String(value)]],
    ),
  ).toString();
  return params ? `?${params}` : "";
};

// Flight search on our backend (flights track F2–F3).
export const flightsApi = {
  // Starts a search; returns page 1 of the first list.
  search: (criteria: FlightSearchCriteria, options: Omit<FlightPageOptions, "page"> = {}, signal?: AbortSignal) =>
    postJson<FlightSearchResponse>(`/v1/flights/searches${query(options)}`, criteria, { signal }),

  // Any page of any list of an existing search, sorted and filtered.
  results: (searchId: string, options: FlightPageOptions = {}, signal?: AbortSignal) =>
    apiRequest<FlightSearchResponse>(`/v1/flights/searches/${encodeURIComponent(searchId)}/results${query(options)}`, { signal }),

  // Cheapest recent round-trip fares for the flights page (cached on the backend).
  popularRoutes: (signal?: AbortSignal) => apiRequest<PopularRouteFare[]>("/v1/flights/popular-routes", { signal }),
};
