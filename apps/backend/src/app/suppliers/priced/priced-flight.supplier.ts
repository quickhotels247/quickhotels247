import type { FlightSearchCriteria } from "@quickhotels/types/flights";
import { PricingService } from "../../pricing/pricing.service.js";
import type { FlightSupplier } from "../flight-supplier.js";
import type { SupplierCallContext } from "../hotel-supplier.js";

// Wraps the real flight supplier: search fares get our markup. Review returns
// the supplier's net price; the review service adds markup there, using the
// same rules as the fares the customer chose.
export class PricedFlightSupplier implements FlightSupplier {
  constructor(
    private readonly inner: FlightSupplier,
    private readonly pricing: PricingService,
  ) {}

  get name() {
    return this.inner.name;
  }

  async searchFlights(criteria: FlightSearchCriteria, context: SupplierCallContext) {
    const found = await this.inner.searchFlights(criteria, context);
    const trips = await Promise.all(found.trips.map(async (trip) => ({ ...trip, options: await this.pricing.markFlightOptions(trip.options, criteria) })));
    return { ...found, trips };
  }

  reviewFlights(...args: Parameters<FlightSupplier["reviewFlights"]>) {
    return this.inner.reviewFlights(...args);
  }

  fareRules(...args: Parameters<FlightSupplier["fareRules"]>) {
    return this.inner.fareRules(...args);
  }

  bookFlights(...args: Parameters<FlightSupplier["bookFlights"]>) {
    return this.inner.bookFlights(...args);
  }

  flightBooking(...args: Parameters<FlightSupplier["flightBooking"]>) {
    return this.inner.flightBooking(...args);
  }
}
