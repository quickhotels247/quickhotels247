import type { CheckoutGuestDetails, CheckoutSummary, CreateCheckoutRequest } from "@quickhotels/types/checkout";
import { apiRequest, postJson } from "./client";

// Checkout on our backend (spec §4.4). `key` is this browser's secret for the
// checkout (see checkoutKeys): it starts it, and opens it afterwards.
export const checkoutApi = {
  create: (request: CreateCheckoutRequest, key: string, signal?: AbortSignal) =>
    postJson<CheckoutSummary>("/v1/checkouts", request, { signal, headers: { "Idempotency-Key": key } }),

  get: (checkoutId: string, key: string, signal?: AbortSignal) =>
    apiRequest<CheckoutSummary>(`/v1/checkouts/${encodeURIComponent(checkoutId)}`, { signal, headers: { "X-Checkout-Token": key } }),

  saveGuests: (checkoutId: string, key: string, details: CheckoutGuestDetails) =>
    apiRequest<CheckoutSummary>(`/v1/checkouts/${encodeURIComponent(checkoutId)}/guests`, {
      method: "PUT",
      body: JSON.stringify(details),
      headers: { "X-Checkout-Token": key },
    }),
};
