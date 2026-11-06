"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { SavedHotel, SaveHotelRequest } from "@quickhotels/types/wishlist";
import { routes } from "@/config/navigation";
import { wishlistApi } from "@/lib/api/wishlist";
import { useAuth } from "@/lib/auth/useAuth";
import { WishlistContext } from "./wishlistContext";

// The signed-in customer's saved hotels, shared by every heart on the page.
// Changes show at once and roll back if the server refuses.
export default function WishlistProvider({ children }: { children: ReactNode }) {
  const { token, status } = useAuth();
  const router = useRouter();
  const [hotels, setHotels] = useState<SavedHotel[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHotels([]);
    setReady(false);
    if (!token) return;
    const controller = new AbortController();
    wishlistApi
      .list(token, controller.signal)
      .then((list) => {
        setHotels(list);
        setReady(true);
      })
      .catch(() => !controller.signal.aborted && setReady(true));
    return () => controller.abort();
  }, [token]);

  const toggle = useCallback(
    async (hotelId: string, hotel: SaveHotelRequest) => {
      if (!token) {
        if (status === "loading") return;
        // Read at click time (no useSearchParams, so pages stay statically rendered).
        const here = `${window.location.pathname}${window.location.search}`;
        router.push(`${routes.login}?${new URLSearchParams({ next: here })}`);
        return;
      }
      const previous = hotels;
      const saved = previous.some((item) => item.hotelId === hotelId);
      setError(null);
      setHotels(saved ? previous.filter((item) => item.hotelId !== hotelId) : [{ hotelId, ...hotel, savedAt: new Date().toISOString() }, ...previous]);
      try {
        if (saved) await wishlistApi.remove(token, hotelId);
        else await wishlistApi.save(token, hotelId, hotel);
      } catch (caught) {
        setHotels(previous);
        setError(caught instanceof Error ? caught.message : "Couldn't update your saved hotels.");
      }
    },
    [token, status, hotels, router],
  );

  const value = useMemo(
    () => ({
      hotels,
      ready,
      isSaved: (hotelId: string) => hotels.some((item) => item.hotelId === hotelId),
      toggle,
      error,
      clearError: () => setError(null),
    }),
    [hotels, ready, toggle, error],
  );
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
