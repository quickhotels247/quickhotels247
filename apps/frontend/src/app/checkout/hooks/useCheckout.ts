"use client";

import { useCallback, useEffect, useState } from "react";
import type { CheckoutGuestDetails, CheckoutSummary } from "@quickhotels/types/checkout";
import { ApiError } from "@/lib/api/client";
import { checkoutApi } from "@/lib/api/checkout";
import { checkoutKeyFor } from "@/lib/checkoutKeys";

interface CheckoutState {
  checkout: CheckoutSummary | null;
  // "missing": no key in this browser, or the checkout doesn't exist.
  problem: "missing" | "error" | null;
  message: string | null;
}

// Loads a checkout with this browser's key, and saves guest details.
export function useCheckout(checkoutId: string) {
  const [state, setState] = useState<CheckoutState>({ checkout: null, problem: null, message: null });

  useEffect(() => {
    const key = checkoutKeyFor(checkoutId);
    if (!key) {
      setState({ checkout: null, problem: "missing", message: null });
      return;
    }
    const controller = new AbortController();
    checkoutApi
      .get(checkoutId, key, controller.signal)
      .then((checkout) => setState({ checkout, problem: null, message: null }))
      .catch((error: Error) => {
        if (controller.signal.aborted) return;
        const missing = error instanceof ApiError && error.status === 404;
        setState({ checkout: null, problem: missing ? "missing" : "error", message: error.message });
      });
    return () => controller.abort();
  }, [checkoutId]);

  const saveGuests = useCallback(
    async (details: CheckoutGuestDetails) => {
      const key = checkoutKeyFor(checkoutId);
      if (!key) throw new Error("This checkout was started in another tab. Please choose your room again.");
      const checkout = await checkoutApi.saveGuests(checkoutId, key, details);
      setState({ checkout, problem: null, message: null });
    },
    [checkoutId],
  );

  return { ...state, saveGuests };
}
