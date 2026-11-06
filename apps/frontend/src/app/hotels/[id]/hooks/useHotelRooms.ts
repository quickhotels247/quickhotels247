"use client";

import { useCallback, useState } from "react";
import type { HotelSearchCriteria } from "@quickhotels/types/hotels";
import { hotelsApi } from "@/lib/api/hotels";
import { useApiData } from "@/lib/hooks/useApiData";

// Live rooms and rates for the stay; null criteria (e.g. a child's age
// missing) loads nothing. `retry` asks again after an error.
export function useHotelRooms(hotelId: string, stay: HotelSearchCriteria | null, searchId: string | null) {
  const [attempt, setAttempt] = useState(0);
  const key = stay ? JSON.stringify(stay) : "";
  const rooms = useApiData(
    (signal) => (stay ? hotelsApi.rooms(hotelId, stay, searchId, signal) : Promise.resolve(null)),
    [hotelId, key, searchId, attempt],
  );
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...rooms, retry };
}
