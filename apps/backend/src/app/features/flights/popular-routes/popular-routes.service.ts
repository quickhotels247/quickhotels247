import { Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";
import type { FlightSearchCriteria, PopularRouteFare } from "@quickhotels/types/flights";
import { STAY_DEFAULTS } from "../../../common/config/stay-defaults.js";
import { addDays, todayInIndia } from "../../../common/utils/india-dates.js";
import { mapLimit } from "../../../common/utils/map-limit.js";
import { TtlCache } from "../../../common/utils/ttl-cache.js";
import { FlightSearchService } from "../search/flight-search.service.js";

// Routes on the flights page (keep in step with the website's list).
export const POPULAR_ROUTES = [
  "BOM-DXB", "DEL-BKK", "BLR-SIN", "DEL-LHR", "BOM-DPS",
  "DEL-GOI", "BOM-DEL", "BLR-BOM", "DEL-JAI", "HYD-COK",
] as const;

const TTL_MS = 6 * 60 * 60 * 1000; // fares move; refresh every 6 hours
const CONCURRENCY = 2;
// Let the server settle (and customer searches go first) before warming up.
const STARTUP_DELAY_MS = 20_000;

// The cheapest round-trip fare per adult for each popular route, three weeks
// out. Each search takes several seconds, so fares are fetched in the
// background (at startup and when stale) and served from memory.
@Injectable()
export class PopularRoutesService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PopularRoutesService.name);
  private readonly cache = new TtlCache<PopularRouteFare | null>();
  private refreshing: Promise<void> | null = null;

  constructor(private readonly flights: FlightSearchService) {}

  onApplicationBootstrap() {
    if (process.env.NODE_ENV === "test") return;
    setTimeout(() => void this.refresh(), STARTUP_DELAY_MS).unref();
  }

  // Fares we have now (stale ones too, while refreshing), never waiting for TripJack.
  fares(routes: readonly string[] = POPULAR_ROUTES): PopularRouteFare[] {
    if (routes.some((route) => this.cache.get(route) === undefined)) void this.refresh();
    return routes.flatMap((route) => this.cache.peek(route) ?? []);
  }

  private refresh(): Promise<void> {
    this.refreshing ??= this.load().finally(() => (this.refreshing = null));
    return this.refreshing;
  }

  private async load() {
    const stale = POPULAR_ROUTES.filter((route) => this.cache.get(route) === undefined);
    const results = await mapLimit(stale, CONCURRENCY, async (route) => {
      const fare = await this.cheapestRoundTrip(route);
      this.cache.set(route, fare, TTL_MS);
    });
    const failed = results.filter((result) => "error" in result).length;
    if (failed) this.logger.warn(`Popular fares: ${failed} of ${stale.length} routes failed; retrying on the next request.`);
  }

  private async cheapestRoundTrip(route: string): Promise<PopularRouteFare | null> {
    const [from, to] = route.split("-") as [string, string];
    const { popularRoutesDepartInDays, popularRoutesNights } = STAY_DEFAULTS;
    const depart = addDays(todayInIndia(), popularRoutesDepartInDays);
    const back = addDays(depart, popularRoutesNights);
    const criteria: FlightSearchCriteria = {
      tripType: "roundTrip", from, to, depart, return: back, legs: [],
      adults: 1, children: 0, infants: 0, cabin: "economy", directOnly: false,
    };
    const trips = await this.flights.quickSearch(criteria);
    const cheapest = (key: string) =>
      Math.min(...(trips.find((trip) => trip.key === key)?.options ?? []).map((option) => option.pricePerAdult.amount));
    // International: one fare covers both ways (COMBO). Domestic: cheapest
    // departure plus cheapest return.
    const amount = trips.some((trip) => trip.key === "COMBO") ? cheapest("COMBO") : cheapest("ONWARD") + cheapest("RETURN");
    if (!Number.isFinite(amount)) return null;
    return { from, to, depart, return: back, price: { amount: Math.round(amount), currency: "INR" }, checkedAt: new Date().toISOString() };
  }
}
