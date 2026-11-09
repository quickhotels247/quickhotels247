import type { BookingDetails, BookingsPage, BookingsTab, CancelBookingRequest } from "@quickhotels/types/bookings";
import { apiRequest, downloadFile } from "./client";

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
  // Cancels, with whichever access opened the booking; returns it updated.
  cancel: (reference: string, access: { key: string | null; link: string | null; token: string | null }, request: CancelBookingRequest) => {
    const ref = encodeURIComponent(reference);
    const body = JSON.stringify(request);
    if (access.key) return apiRequest<BookingDetails>(`/v1/bookings/guest/${ref}/cancel`, { method: "POST", body, headers: { "X-Checkout-Token": access.key } });
    if (access.link) return apiRequest<BookingDetails>(`/v1/bookings/link/${ref}/cancel?t=${encodeURIComponent(access.link)}`, { method: "POST", body });
    return apiRequest<BookingDetails>(`/v1/bookings/${ref}/cancel`, { method: "POST", body, headers: access.token ? bearer(access.token) : {} });
  },
  // The PDF voucher, with whichever access opened the booking.
  voucher: (reference: string, access: { key: string | null; link: string | null; token: string | null }) => {
    const ref = encodeURIComponent(reference);
    const file = `voucher-${reference}.pdf`;
    if (access.key) return downloadFile(`/v1/bookings/guest/${ref}/voucher`, { "X-Checkout-Token": access.key }, file);
    if (access.link) return downloadFile(`/v1/bookings/link/${ref}/voucher?t=${encodeURIComponent(access.link)}`, {}, file);
    return downloadFile(`/v1/bookings/${ref}/voucher`, access.token ? bearer(access.token) : {}, file);
  },
  // A guest's booking, opened with the key of the checkout that made it.
  getAsGuest: (checkoutKey: string, reference: string, signal?: AbortSignal) =>
    apiRequest<BookingDetails>(`/v1/bookings/guest/${encodeURIComponent(reference)}`, { signal, headers: { "X-Checkout-Token": checkoutKey } }),
};
