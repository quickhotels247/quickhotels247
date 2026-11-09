import type { HotelSearchRequest } from "@quickhotels/types/hotels";
import { PricingService } from "../../pricing/pricing.service.js";
import type { HotelSearchOptions, HotelSupplier, SupplierCallContext, SupplierReviewResult, SupplierRoomsResult, SupplierSearchResult } from "../hotel-supplier.js";

const nightsOf = (request: HotelSearchRequest) =>
  Math.max(1, Math.round((Date.parse(`${request.checkOut}T00:00:00Z`) - Date.parse(`${request.checkIn}T00:00:00Z`)) / 86_400_000));

// Wraps the real hotel supplier and adds our markup to every price it returns
// (search, rooms, review). Everything after it sees selling prices; the net
// price stays in the review's `markup` record and the supplier's own context.
export class PricedHotelSupplier implements HotelSupplier {
  constructor(
    private readonly inner: HotelSupplier,
    private readonly pricing: PricingService,
  ) {}

  get name() {
    return this.inner.name;
  }

  get sample() {
    return this.inner.sample;
  }

  async searchHotels(request: HotelSearchRequest, context: SupplierCallContext, options?: HotelSearchOptions): Promise<SupplierSearchResult> {
    const [found, rule] = await Promise.all([this.inner.searchHotels(request, context, options), this.pricing.hotelRule(request)]);
    const nights = nightsOf(request);
    return { ...found, results: found.results.map((result) => this.pricing.markHotelResult(result, rule, nights)) };
  }

  async hotelRooms(request: HotelSearchRequest, supplierHotelId: string, context: SupplierCallContext, options?: { searchRef?: string | null }): Promise<SupplierRoomsResult> {
    const [rooms, rule] = await Promise.all([this.inner.hotelRooms(request, supplierHotelId, context, options), this.pricing.hotelRule(request)]);
    const nights = nightsOf(request);
    return { ...rooms, options: rooms.options.map((option) => this.pricing.markRoom(option, rule, nights).option) };
  }

  async reviewRoom(request: HotelSearchRequest, roomsContext: unknown, optionId: string, context: SupplierCallContext): Promise<SupplierReviewResult> {
    const [review, rule] = await Promise.all([this.inner.reviewRoom(request, roomsContext, optionId, context), this.pricing.hotelRule(request)]);
    const { option, applied } = this.pricing.markRoom(review.option, rule, nightsOf(request));
    return { ...review, option, markup: applied };
  }

  countHotels(destination: string) {
    return this.inner.countHotels(destination);
  }

  suggestDestinations(query: string, limit: number) {
    return this.inner.suggestDestinations(query, limit);
  }

  hotelPage(supplierHotelId: string, context: SupplierCallContext) {
    return this.inner.hotelPage(supplierHotelId, context);
  }

  refForHotel(searchContext: unknown, supplierHotelId: string) {
    return this.inner.refForHotel(searchContext, supplierHotelId);
  }

  bookRoom(...args: Parameters<HotelSupplier["bookRoom"]>) {
    return this.inner.bookRoom(...args);
  }

  hotelBooking(...args: Parameters<HotelSupplier["hotelBooking"]>) {
    return this.inner.hotelBooking(...args);
  }
}
