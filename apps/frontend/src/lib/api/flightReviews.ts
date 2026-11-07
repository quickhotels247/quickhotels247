import type { PaymentOrder } from "@quickhotels/types/payments";
import type { CreateFlightReviewRequest, FlightReviewSummary, FlightTravellerDetails } from "@quickhotels/types/flight-checkout";
import { apiRequest, postJson } from "./client";

// Flight fare review on our backend (flights step F4). `key` is this
// browser's secret for the booking (see checkoutKeys).
export const flightReviewsApi = {
  create: (request: CreateFlightReviewRequest, key: string, signal?: AbortSignal) =>
    postJson<FlightReviewSummary>("/v1/flights/reviews", request, { signal, headers: { "Idempotency-Key": key } }),

  get: (reviewId: string, key: string, signal?: AbortSignal) =>
    apiRequest<FlightReviewSummary>(`/v1/flights/reviews/${encodeURIComponent(reviewId)}`, { signal, headers: { "X-Checkout-Token": key } }),

  // Travellers and contact (step F5); returns the review ready for payment.
  saveTravellers: (reviewId: string, key: string, details: FlightTravellerDetails) =>
    apiRequest<FlightReviewSummary>(`/v1/flights/reviews/${encodeURIComponent(reviewId)}/travellers`, {
      method: "PUT",
      body: JSON.stringify(details),
      headers: { "X-Checkout-Token": key },
    }),

  applyCoupon: (reviewId: string, key: string, code: string, token: string | null) =>
    apiRequest<FlightReviewSummary>(`/v1/flights/reviews/${encodeURIComponent(reviewId)}/coupon`, {
      method: "PUT",
      body: JSON.stringify({ code }),
      headers: { "X-Checkout-Token": key, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    }),
  removeCoupon: (reviewId: string, key: string) =>
    apiRequest<FlightReviewSummary>(`/v1/flights/reviews/${encodeURIComponent(reviewId)}/coupon`, { method: "DELETE", headers: { "X-Checkout-Token": key } }),

  // Step F6: a Razorpay order for what's payable.
  startPayment: (reviewId: string, key: string) =>
    apiRequest<PaymentOrder>(`/v1/flights/reviews/${encodeURIComponent(reviewId)}/payment`, { method: "POST", headers: { "X-Checkout-Token": key } }),
};
