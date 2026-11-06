"use client";

import { hotelsApi } from "@/lib/api/hotels";
import { useApiData } from "@/lib/hooks/useApiData";

// The hotel's content (photos, description, facilities, policies).
export function useHotelDetails(hotelId: string) {
  return useApiData((signal) => hotelsApi.details(hotelId, signal), [hotelId]);
}
