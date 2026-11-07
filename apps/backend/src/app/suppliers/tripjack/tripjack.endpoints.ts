// TripJack API paths (docs/tripjack/). The paths are the same in UAT and
// production; only the hosts in tripjack.config.ts change.
//
// `retry`: safe to send again after a network failure (reads only). Booking,
// confirming and cancelling are never retried blindly: TripJack asks partners
// to check the booking's status first (spec §7.3).
// `timeoutMs`: for calls slower than the default.
export const TRIPJACK_ENDPOINTS = {
  // Air host: flights (Flights API v2).
  flightSearch: { host: "air", method: "POST", path: "/fms/v1/air-search-all", retry: true, timeoutMs: 45_000 },
  flightFareRule: { host: "air", method: "POST", path: "/fms/v2/farerule", retry: true },
  // Review only re-checks fares (booking is separate), so a dropped connection may be retried.
  flightReview: { host: "air", method: "POST", path: "/fms/v1/review", retry: true, timeoutMs: 30_000 },
  // Instant booking: ticketing with payment from our TripJack balance. Never
  // retried; on a timeout, read the booking's status instead.
  flightBook: { host: "air", method: "POST", path: "/oms/v1/air/book", retry: false, timeoutMs: 90_000 },
  flightBookingDetails: { host: "air", method: "POST", path: "/oms/v1/booking-details", retry: true, timeoutMs: 30_000 },
  // Hotel API v3.
  // Search host (HMS): content, search, detail, review.
  nationalities: { host: "hms", method: "GET", path: "/hms/v3/nationality-info", retry: true },
  countries: { host: "hms", method: "GET", path: "/hms/v3/content/fetch-countries", retry: true },
  cityRegions: { host: "hms", method: "GET", path: "/hms/v3/content/fetch-city-regionIds", retry: true },
  hotelMapping: { host: "hms", method: "POST", path: "/hms/v3/content/fetch-hotel-mapping", retry: true },
  hotelContent: { host: "hms", method: "POST", path: "/hms/v3/content/fetch-hotel-content", retry: true },
  listing: { host: "hms", method: "POST", path: "/hms/v3/hotel/listing", retry: true, timeoutMs: 30_000 },
  pricing: { host: "hms", method: "POST", path: "/hms/v3/hotel/pricing", retry: true, timeoutMs: 30_000 },
  // Review only re-checks a rate (Book is what commits), so a dropped
  // connection may be retried like a read.
  review: { host: "hms", method: "POST", path: "/hms/v3/hotel/review", retry: true },
  // Booker host: bookings.
  book: { host: "booker", method: "POST", path: "/oms/v3/hotel/book", retry: false },
  confirmBook: { host: "booker", method: "POST", path: "/oms/v3/hotel/confirm-book", retry: false },
  bookingDetails: { host: "booker", method: "POST", path: "/oms/v3/hotel/booking-details", retry: true },
  bookings: { host: "booker", method: "POST", path: "/oms/v3/hotel/bookings", retry: true },
  cancel: { host: "booker", method: "POST", path: "/oms/v3/hotel/cancel-booking", retry: false }, // + "/{bookingId}"
} as const;

export type TripjackOperation = keyof typeof TRIPJACK_ENDPOINTS;
