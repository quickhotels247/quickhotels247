import type { DestinationStatsResponse, HomeHotelsResponse } from "@quickhotels/types/hotels";
import { apiRequest } from "./client";

// Home page sections (GET /api/v1/home/*), cached on the backend.
export const homeApi = {
  topHotels: (signal?: AbortSignal) => apiRequest<HomeHotelsResponse>("/v1/home/top-hotels", { signal }),
  weekendDeals: (signal?: AbortSignal) => apiRequest<HomeHotelsResponse>("/v1/home/weekend-deals", { signal }),
  destinationStats: (names: string[], signal?: AbortSignal) =>
    apiRequest<DestinationStatsResponse>(`/v1/home/destination-stats?${new URLSearchParams({ names: names.join(",") })}`, { signal }),
};
