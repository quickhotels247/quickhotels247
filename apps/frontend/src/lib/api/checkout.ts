import type { CheckoutGuestDetails, CheckoutSummary, CreateCheckoutRequest } from "@quickhotels/types/checkout";
import type { PaymentOrder } from "@quickhotels/types/payments";
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

  // Pay: a Razorpay order for the amount due. A signed-in customer's token
  // links the booking to their account.
  startPayment: (checkoutId: string, key: string, token: string | null) =>
    apiRequest<PaymentOrder>(`/v1/checkouts/${encodeURIComponent(checkoutId)}/payment`, {
      method: "POST",
      headers: { "X-Checkout-Token": key, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    }),

  // Coupons: a signed-in customer's token counts their own uses.
  applyCoupon: (checkoutId: string, key: string, code: string, token: string | null) =>
    apiRequest<CheckoutSummary>(`/v1/checkouts/${encodeURIComponent(checkoutId)}/coupon`, {
      method: "PUT",
      body: JSON.stringify({ code }),
      headers: { "X-Checkout-Token": key, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    }),
  removeCoupon: (checkoutId: string, key: string) =>
    apiRequest<CheckoutSummary>(`/v1/checkouts/${encodeURIComponent(checkoutId)}/coupon`, { method: "DELETE", headers: { "X-Checkout-Token": key } }),
};
