"use client";

import { useEffect, useState } from "react";
import type { SavedTraveller } from "@quickhotels/types/travellers";
import { travellersApi } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/useAuth";

// The signed-in customer's saved travellers, for filling checkout forms.
// Empty for guests, and if loading fails (the form still works by hand).
export function useSavedTravellers(): SavedTraveller[] {
  const { token } = useAuth();
  const [travellers, setTravellers] = useState<SavedTraveller[]>([]);
  useEffect(() => {
    if (!token) return setTravellers([]);
    const controller = new AbortController();
    travellersApi
      .list(token, controller.signal)
      .then(setTravellers)
      .catch(() => undefined);
    return () => controller.abort();
  }, [token]);
  return travellers;
}

export const travellerKey = (firstName: string, lastName: string) => `${firstName.trim()} ${lastName.trim()}`.toLowerCase();
