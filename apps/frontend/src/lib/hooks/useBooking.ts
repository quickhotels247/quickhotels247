"use client";

import { useCallback, useEffect, useState } from "react";
import type { BookingDetails, CancelBookingRequest } from "@quickhotels/types/bookings";
import { ApiError } from "@/lib/api/client";
import { bookingsApi } from "@/lib/api/bookings";
import { useAuth } from "@/lib/auth/useAuth";
import { checkoutKeyFor } from "@/lib/checkoutKeys";

interface BookingState {
  booking: BookingDetails | null;
  loading: boolean;
  // "signin": we can't tell whose booking this is; ask them to log in.
  problem: "signin" | "missing" | "error" | null;
  message: string | null;
}

// Loads one booking: with this browser's checkout key when the booking came
// from a checkout here (guests), the email's private link token, else as the
// signed-in owner. `refresh`
// reloads it, e.g. to see if a pending booking is confirmed yet.
export function useBooking(reference: string, checkoutId: string | null, linkToken: string | null = null) {
  const { token, status } = useAuth();
  const [state, setState] = useState<BookingState>({ booking: null, loading: true, problem: null, message: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const key = checkoutId ? checkoutKeyFor(checkoutId) : null;
    if (!key && !linkToken && status === "loading") return;
    if (!key && !linkToken && !token) {
      setState({ booking: null, loading: false, problem: "signin", message: null });
      return;
    }
    const controller = new AbortController();
    setState((previous) => ({ ...previous, loading: true }));
    (key
      ? bookingsApi.getAsGuest(key, reference, controller.signal)
      : linkToken
        ? bookingsApi.getByLink(reference, linkToken, controller.signal)
        : bookingsApi.get(token!, reference, controller.signal)
    )
      .then((booking) => setState({ booking, loading: false, problem: null, message: null }))
      .catch((error: Error) => {
        if (controller.signal.aborted) return;
        const missing = error instanceof ApiError && error.status === 404;
        setState({ booking: null, loading: false, problem: missing ? "missing" : "error", message: error.message });
      });
    return () => controller.abort();
  }, [reference, checkoutId, linkToken, token, status, attempt]);

  const refresh = useCallback(() => setAttempt((n) => n + 1), []);
  // The PDF voucher, with the same access that opened the booking.
  const downloadVoucher = useCallback(
    () => bookingsApi.voucher(reference, { key: checkoutId ? checkoutKeyFor(checkoutId) : null, link: linkToken, token }),
    [reference, checkoutId, linkToken, token],
  );
  // Cancels with the same access; shows the updated booking.
  const cancel = useCallback(
    async (request: CancelBookingRequest) => {
      const booking = await bookingsApi.cancel(reference, { key: checkoutId ? checkoutKeyFor(checkoutId) : null, link: linkToken, token }, request);
      setState({ booking, loading: false, problem: null, message: null });
    },
    [reference, checkoutId, linkToken, token],
  );
  return { ...state, refresh, downloadVoucher, cancel };
}
