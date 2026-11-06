import { createContext } from "react";
import type { SavedHotel, SaveHotelRequest } from "@quickhotels/types/wishlist";

export interface WishlistContextValue {
  // Saved hotels, newest first; empty when signed out.
  hotels: SavedHotel[];
  // False until the signed-in customer's list has loaded.
  ready: boolean;
  isSaved: (hotelId: string) => boolean;
  // Saves or removes. Signed out: sends the visitor to log in first.
  toggle: (hotelId: string, hotel: SaveHotelRequest) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

export const WishlistContext = createContext<WishlistContextValue | null>(null);
