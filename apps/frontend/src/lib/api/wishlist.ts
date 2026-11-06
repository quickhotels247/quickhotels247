import type { SavedHotel, SaveHotelRequest } from "@quickhotels/types/wishlist";
import { apiRequest } from "./client";

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

// The signed-in customer's saved hotels (the heart).
export const wishlistApi = {
  list: (token: string, signal?: AbortSignal) => apiRequest<SavedHotel[]>("/account/saved-hotels", { signal, headers: bearer(token) }),
  save: (token: string, hotelId: string, hotel: SaveHotelRequest) =>
    apiRequest<SavedHotel>(`/account/saved-hotels/${encodeURIComponent(hotelId)}`, { method: "PUT", body: JSON.stringify(hotel), headers: bearer(token) }),
  remove: (token: string, hotelId: string) =>
    apiRequest<void>(`/account/saved-hotels/${encodeURIComponent(hotelId)}`, { method: "DELETE", headers: bearer(token) }),
};
