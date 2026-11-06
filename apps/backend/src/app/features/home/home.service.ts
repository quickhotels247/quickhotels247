import { randomUUID } from "node:crypto";
import { Inject, Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";
import type { DestinationStatsResponse, HomeHotelsResponse, HotelSearchRequest, HotelSearchResult } from "@quickhotels/types/hotels";
import { STAY_DEFAULTS } from "../../common/config/stay-defaults.js";
import { addDays, todayInIndia, upcomingWeekendInIndia } from "../../common/utils/india-dates.js";
import { mapLimit } from "../../common/utils/map-limit.js";
import { TtlCache } from "../../common/utils/ttl-cache.js";
import { HOTEL_SUPPLIER, type HotelSupplier } from "../../suppliers/hotel-supplier.js";

// Destinations the home page features (keep in step with the website).
const TOP_RATED_DESTINATIONS = ["Goa", "Mumbai", "Jaipur", "New Delhi"];
const WEEKEND_DESTINATIONS = ["Goa", "Jaipur", "Manali", "Mumbai", "Alleppey"];

const PRICES_TTL_MS = 30 * 60 * 1000; // live rates move; refresh every 30 minutes
const COUNTS_TTL_MS = 24 * 60 * 60 * 1000;
const HOTELS_PER_DESTINATION = 100; // one supplier batch per destination
const TOP_RATED_PER_DESTINATION = 1;

const twoAdults = (destination: string, checkIn: string, checkOut: string): HotelSearchRequest => ({
  destination, checkIn, checkOut, rooms: 1, adults: 2, children: 0,
});

// Real prices and counts for the home page sections (spec §4.1). Searches run
// in the background and are cached, so the page never waits on the supplier;
// a section shows nothing until its first results are in.
@Injectable()
export class HomeService implements OnApplicationBootstrap {
  private readonly logger = new Logger(HomeService.name);
  private readonly prices = new TtlCache<HomeHotelsResponse>();
  private readonly counts = new TtlCache<number | null>();

  constructor(@Inject(HOTEL_SUPPLIER) private readonly supplier: HotelSupplier) {}

  onApplicationBootstrap() {
    if (process.env.NODE_ENV === "test") return;
    // Warm the caches shortly after startup, one after the other.
    setTimeout(() => {
      void this.topRated()
        .catch(() => {})
        .then(() => this.weekendDeals())
        .catch(() => {});
    }, 5_000).unref();
  }

  // The best-rated hotel in each featured destination (one night, two weeks out).
  topRated(): Promise<HomeHotelsResponse> {
    const { topHotelsCheckInInDays, topHotelsNights } = STAY_DEFAULTS;
    const checkIn = addDays(todayInIndia(), topHotelsCheckInInDays);
    const checkOut = addDays(checkIn, topHotelsNights);
    return this.prices.getOrLoad(`top:${checkIn}:${checkOut}`, PRICES_TTL_MS, () =>
      this.collect(TOP_RATED_DESTINATIONS, checkIn, checkOut, (hotels) =>
        [...hotels]
          .sort((a, b) => (b.starRating ?? 0) - (a.starRating ?? 0) || a.totalPrice.amount - b.totalPrice.amount)
          .slice(0, TOP_RATED_PER_DESTINATION),
      ),
    );
  }

  // The cheapest 4★+ hotel per destination for the coming Friday–Sunday.
  weekendDeals(): Promise<HomeHotelsResponse> {
    const { checkIn, checkOut } = upcomingWeekendInIndia();
    return this.prices.getOrLoad(`weekend:${checkIn}`, PRICES_TTL_MS, () =>
      this.collect(WEEKEND_DESTINATIONS, checkIn, checkOut, (hotels) => {
        const good = hotels.filter((hotel) => (hotel.starRating ?? 0) >= 4);
        const cheapest = [...(good.length ? good : hotels)].sort((a, b) => a.totalPrice.amount - b.totalPrice.amount);
        return cheapest.slice(0, 1);
      }),
    );
  }

  async destinationStats(names: string[]): Promise<DestinationStatsResponse> {
    const entries = await mapLimit(names, 4, (name) =>
      this.counts.getOrLoad(name.toLowerCase(), COUNTS_TTL_MS, () => this.supplier.countHotels(name)),
    );
    return Object.fromEntries(names.map((name, i) => [name, "value" in entries[i]! ? (entries[i] as { value: number | null }).value : null]));
  }

  // Searches each destination (one batch of hotels) and keeps what `pick` chooses.
  private async collect(
    destinations: string[],
    checkIn: string,
    checkOut: string,
    pick: (hotels: HotelSearchResult[]) => HotelSearchResult[],
  ): Promise<HomeHotelsResponse> {
    const results = await mapLimit(destinations, 3, async (destination) => {
      const found = await this.supplier.searchHotels(
        twoAdults(destination, checkIn, checkOut),
        { correlationId: randomUUID() },
        { maxHotels: HOTELS_PER_DESTINATION },
      );
      return pick(found.results);
    });
    const failed = results.filter((result) => "error" in result);
    if (failed.length) this.logger.warn(`Home prices: ${failed.length} of ${destinations.length} destinations failed.`);
    if (failed.length === destinations.length) throw (failed[0] as { error: unknown }).error;
    const nights = Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86_400_000);
    return {
      checkIn,
      checkOut,
      nights,
      hotels: results.flatMap((result) => ("value" in result ? result.value : [])),
    };
  }
}
