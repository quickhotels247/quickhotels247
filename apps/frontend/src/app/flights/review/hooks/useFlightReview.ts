"use client";

import { useCallback, useEffect, useState } from "react";
import type { FlightReviewSummary, FlightTravellerDetails } from "@quickhotels/types/flight-checkout";
import { ApiError } from "@/lib/api/client";
import { flightReviewsApi } from "@/lib/api/flightReviews";
import { checkoutKeyFor } from "@/lib/checkoutKeys";

interface FlightReviewState {
  review: FlightReviewSummary | null;
  // "missing": no key in this browser tab, or the review doesn't exist.
  problem: "missing" | "error" | null;
  message: string | null;
}

// Loads a fare review with this browser tab's key, and saves travellers.
export function useFlightReview(reviewId: string) {
  const [state, setState] = useState<FlightReviewState>({ review: null, problem: null, message: null });

  useEffect(() => {
    const key = checkoutKeyFor(reviewId);
    if (!key) {
      setState({ review: null, problem: "missing", message: null });
      return;
    }
    const controller = new AbortController();
    flightReviewsApi
      .get(reviewId, key, controller.signal)
      .then((review) => setState({ review, problem: null, message: null }))
      .catch((error: Error) => {
        if (controller.signal.aborted) return;
        setState({ review: null, problem: error instanceof ApiError && error.status === 404 ? "missing" : "error", message: error.message });
      });
    return () => controller.abort();
  }, [reviewId]);

  const saveTravellers = useCallback(
    async (details: FlightTravellerDetails) => {
      const key = checkoutKeyFor(reviewId);
      if (!key) throw new Error("This booking was started in another tab. Please choose your flights again.");
      const review = await flightReviewsApi.saveTravellers(reviewId, key, details);
      setState({ review, problem: null, message: null });
    },
    [reviewId],
  );

  return { ...state, saveTravellers };
}
