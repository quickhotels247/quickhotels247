import type { FlightBookingsPage, FlightBookingsTab, FlightReviewSummary } from "@quickhotels/types/flight-checkout";
import { apiRequest } from "./client";

const bearer = (token: string | null): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {});

// The customer's flight bookings: My bookings, and one booking by its owner
// (signed in) or its private email link (`t`).
export const flightBookingsApi = {
  list: (token: string, tab: FlightBookingsTab, query: string, page: number, signal?: AbortSignal) => {
    const params = new URLSearchParams({ tab, page: String(page) });
    if (query.trim()) params.set("q", query.trim());
    return apiRequest<FlightBookingsPage>(`/v1/flights/bookings?${params}`, { signal, headers: bearer(token) });
  },
  view: (id: string, access: { token: string | null; link: string | null }, signal?: AbortSignal) => {
    const params = access.link ? `?${new URLSearchParams({ t: access.link })}` : "";
    return apiRequest<FlightReviewSummary>(`/v1/flights/bookings/${encodeURIComponent(id)}${params}`, { signal, headers: bearer(access.token) });
  },
};
