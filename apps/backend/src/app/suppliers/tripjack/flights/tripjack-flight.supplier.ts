import { Injectable, Logger } from "@nestjs/common";
import type { FlightFareRule, FlightTravellerDetails } from "@quickhotels/types/flight-checkout";
import type { FlightOption, FlightSearchCriteria } from "@quickhotels/types/flights";
import type { FlightReviewResult, FlightSupplier, FlightTrip, SupplierFlightBooking } from "../../flight-supplier.js";
import type { TripjackEnvelope } from "../tripjack.types.js";
import { toFlightBooking, toTripjackBook, type TripjackBookingDetailsResponse } from "./tripjack-flight-booking.mapper.js";
import type { SupplierCallContext } from "../../hotel-supplier.js";
import { SupplierError } from "../../supplier-error.js";
import { TripjackClient } from "../tripjack.client.js";
import { toFlightOption, toTripjackFlightSearch, tripLabel } from "./tripjack-flight.mapper.js";
import { toFareRules, toFlightReview } from "./tripjack-flight-review.mapper.js";
import type { TripjackFareRuleResponse, TripjackFlightReviewResponse, TripjackFlightSearchResponse } from "./tripjack-flight.types.js";

// TripJack price IDs last 15 minutes; stop a little early.
const FARES_TTL_MS = 14 * 60 * 1000;
// Order of the trip lists in the response.
const KEY_ORDER = ["ONWARD", "RETURN", "COMBO"];

// Flights from TripJack (Flights API v2, POST /fms/v1/air-search-all).
@Injectable()
export class TripjackFlightSupplier implements FlightSupplier {
  readonly name = "tripjack";
  private readonly logger = new Logger(TripjackFlightSupplier.name);

  constructor(private readonly client: TripjackClient) {}

  async searchFlights(criteria: FlightSearchCriteria, context: SupplierCallContext): Promise<{ trips: FlightTrip[]; expiresAt: Date }> {
    if (!this.client.configured) {
      throw new SupplierError("NOT_CONFIGURED", "TRIPJACK_API_KEY is not set.", this.name, context.correlationId);
    }
    const response = await this.client.request<TripjackFlightSearchResponse>("flightSearch", {
      correlationId: context.correlationId,
      body: toTripjackFlightSearch(criteria),
    });
    const tripInfos = response.searchResult?.tripInfos ?? {};
    const keys = Object.keys(tripInfos).sort(
      (a, b) => (KEY_ORDER.indexOf(a) + 1 || 10 + Number(a)) - (KEY_ORDER.indexOf(b) + 1 || 10 + Number(b)),
    );
    const trips = keys.map((key) => ({
      key,
      label: tripLabel(key, criteria),
      options: (tripInfos[key] ?? []).flatMap((trip) => toFlightOption(trip, criteria) ?? []) as FlightOption[],
    }));
    return { trips, expiresAt: new Date(Date.now() + FARES_TTL_MS) };
  }

  async reviewFlights(priceIds: string[], criteria: FlightSearchCriteria, tripKeys: string[], context: SupplierCallContext): Promise<FlightReviewResult> {
    if (!this.client.configured) {
      throw new SupplierError("NOT_CONFIGURED", "TRIPJACK_API_KEY is not set.", this.name, context.correlationId);
    }
    const review = await this.client.request<TripjackFlightReviewResponse>("flightReview", {
      correlationId: context.correlationId,
      body: { priceIds },
    });
    if (!review.bookingId || !review.tripInfos?.length) {
      throw new SupplierError("BAD_RESPONSE", "TripJack review came back without a bookingId or trips.", this.name, context.correlationId);
    }
    return { supplierBookingId: review.bookingId, ...toFlightReview(review, criteria, tripKeys) };
  }

  // Rules are helpful but not essential: a failure leaves them out (the page
  // says they're with the airline) rather than stopping the booking.
  async fareRules(supplierBookingId: string, context: SupplierCallContext): Promise<FlightFareRule[]> {
    try {
      const response = await this.client.request<TripjackFareRuleResponse>("flightFareRule", {
        correlationId: context.correlationId,
        body: { id: supplierBookingId, flowType: "REVIEW" },
      });
      return toFareRules(response);
    } catch (error) {
      this.logger.warn(`Fare rules for ${supplierBookingId} unavailable: ${(error as Error).message}`);
      return [];
    }
  }

  async bookFlights(supplierBookingId: string, amount: number, details: FlightTravellerDetails, context: SupplierCallContext): Promise<void> {
    await this.client.request("flightBook", { correlationId: context.correlationId, body: toTripjackBook(supplierBookingId, amount, details) });
  }

  async flightBooking(supplierBookingId: string, context: SupplierCallContext): Promise<SupplierFlightBooking> {
    const response = await this.client.request<TripjackBookingDetailsResponse & TripjackEnvelope>("flightBookingDetails", {
      correlationId: context.correlationId,
      body: { bookingId: supplierBookingId, requirePaxPricing: false },
    });
    return toFlightBooking(response);
  }
}
