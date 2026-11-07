import type { FlightFareRule, FlightPriceBreakdown, FlightTravellerDetails, FlightTravellerRequirements, ReviewedFare } from "@quickhotels/types/flight-checkout";
import type { FlightJourney, FlightOption, FlightSearchCriteria } from "@quickhotels/types/flights";
import type { SupplierCallContext } from "./hotel-supplier.js";

// One list of flight options: a direction ("ONWARD", "RETURN"), a combined
// fare covering every leg ("COMBO"), or one multi-city flight ("0", "1"…).
export interface FlightTrip {
  key: string;
  label: string;
  options: FlightOption[];
}

// What every flight supplier must provide (TripJack now).
export interface FlightSupplier {
  readonly name: string;
  searchFlights(criteria: FlightSearchCriteria, context: SupplierCallContext): Promise<{ trips: FlightTrip[]; expiresAt: Date }>;
  // Re-checks the chosen fares (one per list, in list order) right before
  // travellers and payment. Throws SupplierError SOLD_OUT when one is gone.
  reviewFlights(priceIds: string[], criteria: FlightSearchCriteria, tripKeys: string[], context: SupplierCallContext): Promise<FlightReviewResult>;
  // Change, cancellation and no-show rules for a reviewed booking; empty when unknown.
  fareRules(supplierBookingId: string, context: SupplierCallContext): Promise<FlightFareRule[]>;
  // Tickets the reviewed fares, paying the supplier `amount` (their total
  // fare, before our markup). Not idempotent: never call twice for one booking.
  bookFlights(supplierBookingId: string, amount: number, details: FlightTravellerDetails, context: SupplierCallContext): Promise<void>;
  flightBooking(supplierBookingId: string, context: SupplierCallContext): Promise<SupplierFlightBooking>;
}

// The supplier's view of a flight booking after Book.
export interface SupplierFlightBooking {
  // SUCCESS (ticketed), PENDING (in progress), FAILED / ABORTED, ON_HOLD, …
  status: string;
  pnrs: { route: string; pnr: string }[];
  tickets: { traveller: string; route: string; ticket: string }[];
}

export interface FlightReviewResult {
  // The supplier's reference for this review, needed to book.
  supplierBookingId: string;
  journeys: FlightJourney[];
  fares: ReviewedFare[];
  price: FlightPriceBreakdown;
  requirements: FlightTravellerRequirements;
  holdAllowed: boolean;
  expiresAt: Date;
}

export const FLIGHT_SUPPLIER = Symbol("FLIGHT_SUPPLIER");
