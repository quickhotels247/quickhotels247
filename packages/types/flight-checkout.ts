import type { AppliedCoupon } from "@quickhotels/types/coupons";
import type { FlightJourney, FlightOption, FlightSearchCriteria } from "@quickhotels/types/flights";
import type { Money } from "@quickhotels/types/hotels";

// Flight fare review and booking shapes (flights steps F4–F6).

// One airline rule for changing, cancelling or missing a flight, for a
// period before departure.
export interface FlightFareRule {
  type: "cancellation" | "dateChange" | "noShow";
  route: string; // "DEL-BOM"
  // "More than 4 hours before departure", "Within 4 hours of departure", "Any time"…
  when: string;
  airlineFee: Money | null;
  // Our supplier's own fee on top of the airline's.
  serviceFee: Money | null;
  // The airline's own words, line by line.
  notes: string[];
}

// What the airline needs about travellers for this fare.
export interface FlightTravellerRequirements {
  passport: boolean;
  passportExpiry: boolean;
  dateOfBirth: { adult: boolean; child: boolean; infant: boolean };
  pan: boolean;
  gst: "required" | "optional" | "none";
  emergencyContact: boolean;
  // Longest first name, last name and whole name the airline accepts.
  nameLimits: { first: number; last: number; total: number } | null;
}

export interface FlightPriceBreakdown {
  base: Money;
  taxes: Money;
  serviceFee: Money;
  serviceFeeTax: Money;
  total: Money;
  // Per traveller type: { type: "adult", count: 2, each: ₹3,967 }.
  perTraveller: { type: "adult" | "child" | "infant"; count: number; each: Money }[];
}

// One chosen fare (a direction, or both ways in one fare).
export interface ReviewedFare {
  trip: string;
  label: string;
  airlines: string;
  fareType: string;
  refundable: FlightOption["refundable"];
  baggage: FlightOption["baggage"];
  cabin: string;
}

// travellers → payment → (paid) processing → confirmed, or failed (refunded).
export type FlightReviewStatus = "travellers" | "payment" | "processing" | "confirmed" | "failed";

// After payment: what the airline issued, or why it couldn't.
export interface FlightBookingResult {
  // TripJack's booking reference.
  bookingId: string;
  // Airline PNR per route, e.g. { route: "DEL-BOM", pnr: "ABC123" }.
  pnrs: { route: string; pnr: string }[];
  tickets: { traveller: string; route: string; ticket: string }[];
  // When it failed: why, in words for the customer.
  failureReason: string | null;
  refund: { status: "pending" | "processed" | "failed"; amount: { amount: number; currency: string } } | null;
}

export type FlightTravellerType = "adult" | "child" | "infant";
// Adults: Mr, Mrs or Ms. Children and infants: Master or Ms (airline rules).
export type FlightTravellerTitle = "Mr" | "Mrs" | "Ms" | "Master";

export interface FlightTraveller {
  type: FlightTravellerType;
  title: FlightTravellerTitle;
  firstName: string;
  lastName: string;
  dateOfBirth?: string; // YYYY-MM-DD, when the fare needs it (always for infants)
  passport?: { number: string; nationality: string; expiry?: string; issueDate?: string };
  pan?: string;
}

// PUT /api/v1/flights/reviews/:id/travellers (X-Checkout-Token)
export interface FlightTravellerDetails {
  // Adults first, then children, then infants, as many of each as searched.
  travellers: FlightTraveller[];
  contact: { email: string; phoneCode: string; phone: string };
  // For a GST invoice; required when the fare says so.
  gst?: { number: string; companyName: string; email?: string; phone?: string; address?: string };
  emergencyContact?: { name: string; phoneCode: string; phone: string };
  acceptTerms: boolean;
  // Required (true) when the price changed since the results page.
  acceptPriceChange?: boolean;
}

// GET /api/v1/flights/reviews/:id (X-Checkout-Token)
export interface FlightReviewSummary {
  reviewId: string;
  status: FlightReviewStatus;
  // The airline holds this price until then; afterwards search again.
  expiresAt: string;
  criteria: FlightSearchCriteria;
  journeys: FlightJourney[];
  fares: ReviewedFare[];
  price: FlightPriceBreakdown;
  // Set when the confirmed price differs from the results page.
  priceChange: { previous: Money; current: Money } | null;
  // A coupon code applied at checkout, and the total after it.
  coupon: AppliedCoupon | null;
  payable: Money;
  rules: FlightFareRule[];
  requirements: FlightTravellerRequirements;
  // Whether the seats can be held without paying yet.
  holdAllowed: boolean;
  termsVersion: string;
  // Saved traveller details, to fill the form again.
  travellerDetails: FlightTravellerDetails | null;
  booking: FlightBookingResult | null;
}

// POST /api/v1/flights/reviews with an Idempotency-Key header (the browser's
// random key, which later opens the review as X-Checkout-Token).
export interface CreateFlightReviewRequest {
  searchId: string;
  // One fare per list of the search, as chosen on the results page.
  fares: { trip: string; id: string }[];
}

// ---- My bookings: flights (GET /api/v1/flights/bookings) ----

export type FlightBookingsTab = "upcoming" | "past" | "cancelled";

export interface FlightBookingListItem {
  id: string;
  status: FlightReviewStatus;
  // "HYD → CCU", "CCU → HYD"
  legs: { from: string; to: string; departAt: string; airlines: string }[];
  travellers: number;
  pnrs: string[];
  paid: Money;
  paidAt: string | null;
}

export interface FlightBookingsPage {
  tab: FlightBookingsTab;
  items: FlightBookingListItem[];
  total: number;
  page: number;
  pageSize: number;
}
