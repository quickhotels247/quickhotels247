"use client";

import type { Destination } from "@quickhotels/types/hotels";
import { homeApi } from "@/lib/api/home";
import { useApiData } from "@/lib/hooks/useApiData";

// Adds live hotel counts (GET /api/v1/home/destination-stats) to destinations.
// Counts stay empty until they load, or if they can't.
export function useDestinationStats<T extends Destination>(destinations: T[]): T[] {
  const names = destinations.map((destination) => destination.name);
  const { data } = useApiData((signal) => homeApi.destinationStats(names, signal), [names.join(",")]);
  return destinations.map((destination) => ({ ...destination, hotelCount: data?.[destination.name] ?? null }));
}
