import type { DestinationSuggestion } from "@quickhotels/types/hotels";
import { apiRequest } from "./client";

// Places for the destination box as the visitor types (at least 2 letters).
export const destinationsApi = {
  suggest: (query: string, signal?: AbortSignal) =>
    apiRequest<DestinationSuggestion[]>(`/v1/destinations/suggestions?${new URLSearchParams({ q: query, limit: "8" })}`, { signal }),
};
