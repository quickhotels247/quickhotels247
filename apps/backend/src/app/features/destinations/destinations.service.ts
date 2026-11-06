import { Inject, Injectable } from "@nestjs/common";
import type { DestinationSuggestion } from "@quickhotels/types/hotels";
import { TtlCache } from "../../common/utils/ttl-cache.js";
import { HOTEL_SUPPLIER, type HotelSupplier } from "../../suppliers/hotel-supplier.js";

// Region names barely change, and visitors type the same few letters.
const CACHE_TTL_MS = 60 * 60 * 1000;

// Destination suggestions for the search box, from the active supplier's places.
@Injectable()
export class DestinationsService {
  private readonly cache = new TtlCache<DestinationSuggestion[]>();

  constructor(@Inject(HOTEL_SUPPLIER) private readonly supplier: HotelSupplier) {}

  suggest(query: string, limit: number): Promise<DestinationSuggestion[]> {
    const key = `${limit}:${query.toLowerCase()}`;
    return this.cache.getOrLoad(key, CACHE_TTL_MS, () => this.supplier.suggestDestinations(query, limit));
  }
}
