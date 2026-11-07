import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { FlightOption, FlightSearchCriteria } from "@quickhotels/types/flights";
import { addDays, todayInIndia, upcomingWeekendInIndia } from "../../../common/utils/india-dates.js";
import type { FlightSupplier } from "../../../suppliers/flight-supplier.js";
import type { FlightSearchSessionsRepository } from "./flight-search-sessions.repository.js";
import { FlightSearchService } from "./flight-search.service.js";

const option = (id: string, price: number, departAt: string, durationMins: number, stops = 0): FlightOption => ({
  id, airlines: "IndiGo", fareType: "PUBLISHED", refundable: "REFUNDABLE", baggage: { checkIn: null, cabin: null }, seatsLeft: null, cabin: "ECONOMY",
  price: { amount: price, currency: "INR" }, pricePerAdult: { amount: price, currency: "INR" },
  legs: [{ from: "DEL", to: "BOM", departAt, arriveAt: departAt, durationMins, stops, segments: [] }],
});

const criteria = (changes: Partial<FlightSearchCriteria> = {}): FlightSearchCriteria => ({
  tripType: "oneWay", from: "DEL", to: "BOM", depart: addDays(todayInIndia(), 10), return: "", legs: [],
  adults: 1, children: 0, infants: 0, cabin: "economy", directOnly: false, ...changes,
});

function setup() {
  const options = [
    option("a", 5000, "2026-12-01T09:00", 130),
    option("b", 3500, "2026-12-01T18:00", 300, 1),
    option("c", 4200, "2026-12-01T06:00", 125),
  ];
  const supplier: FlightSupplier = {
    name: "tripjack",
    searchFlights: vi.fn(async () => ({ trips: [{ key: "ONWARD", label: "DEL → BOM", options }], expiresAt: new Date(Date.now() + 600_000) })),
    reviewFlights: vi.fn(async () => {
      throw new Error("not used");
    }),
    bookFlights: vi.fn(),
    flightBooking: vi.fn(),
    fareRules: vi.fn(async () => []),
  };
  const sessions = { create: vi.fn(async () => "flight-1"), find: vi.fn() };
  return { service: new FlightSearchService(supplier, sessions as unknown as FlightSearchSessionsRepository), supplier };
}

describe("FlightSearchService", () => {
  it("returns page 1 sorted by price, with the trip lists", async () => {
    const { service } = setup();
    const page = await service.search(criteria(), null, { page: 1, pageSize: 2, sort: "price" });
    expect(page.results.map((o) => o.id)).toEqual(["b", "c"]);
    expect(page).toMatchObject({ searchId: "flight-1", trip: "ONWARD", total: 3, hasMore: true, trips: [{ key: "ONWARD", total: 3 }] });
  });

  it("sorts by duration or departure, and filters to direct flights", async () => {
    const { service } = setup();
    expect((await service.search(criteria(), null, { page: 1, pageSize: 10, sort: "duration" })).results.map((o) => o.id)).toEqual(["c", "a", "b"]);
    expect((await service.search(criteria(), null, { page: 1, pageSize: 10, sort: "departure" })).results.map((o) => o.id)).toEqual(["c", "a", "b"]);
    expect((await service.search(criteria(), null, { page: 1, pageSize: 10, sort: "price", filters: { stops: [0] } })).results.map((o) => o.id)).toEqual(["c", "a"]);
  });

  it("checks dates, airports and travellers before searching", async () => {
    const { service, supplier } = setup();
    await expect(service.search(criteria({ depart: addDays(todayInIndia(), -1) }), null)).rejects.toThrow(/past/);
    await expect(service.search(criteria({ to: "DEL" }), null)).rejects.toThrow(/different airports/);
    await expect(service.search(criteria({ infants: 2 }), null)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.search(criteria({ tripType: "roundTrip", return: addDays(todayInIndia(), 5) }), null)).rejects.toThrow(/on or after/);
    expect(supplier.searchFlights).not.toHaveBeenCalled();
  });
});

describe("upcomingWeekendInIndia", () => {
  it("is Friday to Sunday, moving to next week once the weekend has started", () => {
    // 2026-11-04 is a Wednesday; 12:00 UTC is 17:30 in India.
    expect(upcomingWeekendInIndia(new Date("2026-11-04T12:00:00Z"))).toEqual({ checkIn: "2026-11-06", checkOut: "2026-11-08" });
    expect(upcomingWeekendInIndia(new Date("2026-11-06T12:00:00Z"))).toEqual({ checkIn: "2026-11-06", checkOut: "2026-11-08" });
    expect(upcomingWeekendInIndia(new Date("2026-11-07T12:00:00Z"))).toEqual({ checkIn: "2026-11-13", checkOut: "2026-11-15" });
    // Friday 20:00 UTC is already Saturday in India.
    expect(upcomingWeekendInIndia(new Date("2026-11-06T20:00:00Z"))).toEqual({ checkIn: "2026-11-13", checkOut: "2026-11-15" });
  });
});
