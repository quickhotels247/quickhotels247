import type { FlightBookingsPage, FlightBookingsTab, FlightReviewSummary } from "@quickhotels/types/flight-checkout";
import { apiRequest, downloadFile } from "./client";

const bearer = (token: string | null): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {});

// The customer's flight bookings: My bookings, and one booking by its owner
// (signed in) or its private email link (`t`).
export const flightBookingsApi = {
  list: (token: string, tab: FlightBookingsTab, query: string, page: number, signal?: AbortSignal) => {
    const params = new URLSearchParams({ tab, page: String(page) });
    if (query.trim()) params.set("q", query.trim());
    return apiRequest<FlightBookingsPage>(`/v1/flights/bookings?${params}`, { signal, headers: bearer(token) });
  },
  // The PDF e-ticket: this tab's checkout key, the email link, or the owner.
  ticket: (id: string, access: { key: string | null; token: string | null; link: string | null }, filename: string) => {
    const params = !access.key && access.link ? `?${new URLSearchParams({ t: access.link })}` : "";
    return downloadFile(`/v1/flights/bookings/${encodeURIComponent(id)}/ticket${params}`, access.key ? { "X-Checkout-Token": access.key } : bearer(access.token), filename);
  },
  view: (id: string, access: { token: string | null; link: string | null }, signal?: AbortSignal) => {
    const params = access.link ? `?${new URLSearchParams({ t: access.link })}` : "";
    return apiRequest<FlightReviewSummary>(`/v1/flights/bookings/${encodeURIComponent(id)}${params}`, { signal, headers: bearer(access.token) });
  },
};
