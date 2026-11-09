import type { BookingDetails, BookingsPage, BookingsTab } from "@quickhotels/types/bookings";
import { apiRequest } from "./client";

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

// Customers' bookings (spec §4.6–4.8).
export const bookingsApi = {
  list: (token: string, tab: BookingsTab, query: string, page: number, signal?: AbortSignal) => {
    const params = new URLSearchParams({ tab, page: String(page) });
    if (query.trim()) params.set("q", query.trim());
    return apiRequest<BookingsPage>(`/v1/bookings?${params}`, { signal, headers: bearer(token) });
  },
  get: (token: string, reference: string, signal?: AbortSignal) =>
    apiRequest<BookingDetails>(`/v1/bookings/${encodeURIComponent(reference)}`, { signal, headers: bearer(token) }),
  // From the confirmation email's private link (?t=).
  getByLink: (reference: string, linkToken: string, signal?: AbortSignal) =>
    apiRequest<BookingDetails>(`/v1/bookings/link/${encodeURIComponent(reference)}?t=${encodeURIComponent(linkToken)}`, { signal }),
  // A guest's booking, opened with the key of the checkout that made it.
  getAsGuest: (checkoutKey: string, reference: string, signal?: AbortSignal) =>
    apiRequest<BookingDetails>(`/v1/bookings/guest/${encodeURIComponent(reference)}`, { signal, headers: { "X-Checkout-Token": checkoutKey } }),
};
