import { Injectable, Logger } from "@nestjs/common";
import type { FareCalendar, FlightSearchCriteria } from "@quickhotels/types/flights";
import type { FlightTrip } from "../../../suppliers/flight-supplier.js";
import { FareCalendarRepository, type FareDay } from "./fare-calendar.repository.js";

// Prices older than this aren't shown: fares change through the day.
const FRESH_MS = 6 * 3600_000;

// Prices in the flight date picker. TripJack has no fare-calendar API, so
// each search on the site saves its cheapest fare per adult for its route and
// day (separate one-way lists only; round-trip combos price both ways).
@Injectable()
export class FareCalendarService {
  private readonly logger = new Logger(FareCalendarService.name);

  constructor(private readonly fares: FareCalendarRepository) {}

  // After a search: ONWARD is from → to on the depart day; RETURN is to → from
  // on the return day. Saved in the background; a failure only loses a price.
  remember(criteria: FlightSearchCriteria, trips: FlightTrip[]): void {
    if (criteria.tripType === "multiCity") return;
    const days: FareDay[] = [];
    const cheapest = (key: string) => {
      const options = trips.find((trip) => trip.key === key)?.options ?? [];
      return options.reduce<(typeof options)[number] | null>((best, option) => (!best || option.pricePerAdult.amount < best.pricePerAdult.amount ? option : best), null);
    };
    const onward = cheapest("ONWARD");
    if (onward) days.push({ from: criteria.from, to: criteria.to, date: criteria.depart, cabin: criteria.cabin, amount: onward.pricePerAdult.amount, currency: onward.pricePerAdult.currency });
    const back = criteria.tripType === "roundTrip" ? cheapest("RETURN") : null;
    if (back && criteria.return) days.push({ from: criteria.to, to: criteria.from, date: criteria.return, cabin: criteria.cabin, amount: back.pricePerAdult.amount, currency: back.pricePerAdult.currency });
    if (days.length) void this.fares.save(days).catch((error: Error) => this.logger.warn(`Saving calendar fares failed: ${error.message}`));
  }

  async calendar(from: string, to: string, cabin: string, start: string, days: number): Promise<FareCalendar> {
    const end = new Date(Date.parse(`${start}T00:00:00Z`) + (days - 1) * 86_400_000).toISOString().slice(0, 10);
    const rows = await this.fares.range(from, to, cabin, start, end, new Date(Date.now() - FRESH_MS));
    return { currency: rows[0]?.currency ?? "INR", days: rows.map(({ date, amount }) => ({ date, amount })) };
  }
}
