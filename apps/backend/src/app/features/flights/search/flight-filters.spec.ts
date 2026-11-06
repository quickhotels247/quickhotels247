import { describe, expect, it } from "vitest";
import type { FlightOption } from "@quickhotels/types/flights";
import { filterFlights, flightFacets, flightHighlights } from "./flight-filters.js";

const fare = (id: string, { price, depart, stops = 0, airline = "6E", name = "IndiGo", minutes = 120, refundable = "REFUNDABLE" }: {
  price: number; depart: string; stops?: number; airline?: string; name?: string; minutes?: number; refundable?: FlightOption["refundable"];
}): FlightOption => ({
  id,
  legs: [{
    from: "DEL", to: "GOI", departAt: `2026-12-10T${depart}`, arriveAt: "2026-12-10T23:00", durationMins: minutes, stops,
    segments: [{ airlineCode: airline, airlineName: name, flightNumber: `${airline} 1`, from: "DEL", to: "GOI", departAt: `2026-12-10T${depart}`, arriveAt: "2026-12-10T23:00", durationMins: minutes }],
  }],
  airlines: name, fareType: "PUBLISHED", refundable, baggage: { checkIn: "15 Kg", cabin: "7 Kg" }, seatsLeft: null, cabin: "ECONOMY",
  price: { amount: price, currency: "INR" }, pricePerAdult: { amount: price, currency: "INR" },
});

const fares = [
  fare("a", { price: 5200, depart: "05:30", minutes: 150 }),
  fare("b", { price: 4100, depart: "09:15", stops: 1, airline: "AI", name: "Air India", minutes: 300, refundable: "NON_REFUNDABLE" }),
  fare("c", { price: 6900, depart: "19:40", stops: 3, airline: "UK", name: "Vistara", minutes: 140 }),
];
const ids = (list: FlightOption[]) => list.map((option) => option.id);

describe("flight filters", () => {
  it("filters by stops (2 = two or more), airline, time of day, price and refundability", () => {
    expect(ids(filterFlights(fares, { stops: [0] }))).toEqual(["a"]);
    expect(ids(filterFlights(fares, { stops: [2] }))).toEqual(["c"]);
    expect(ids(filterFlights(fares, { airlines: ["AI", "UK"] }))).toEqual(["b", "c"]);
    expect(ids(filterFlights(fares, { departWindows: ["early", "evening"] }))).toEqual(["a", "c"]);
    expect(ids(filterFlights(fares, { maxPrice: 5200, refundableOnly: true }))).toEqual(["a"]);
  });

  it("counts a round trip in one fare as non-stop only when both ways are", () => {
    const outbound = fare("rt", { price: 9000, depart: "08:00" });
    const roundTrip: FlightOption = { ...outbound, legs: [outbound.legs[0]!, { ...outbound.legs[0]!, from: "GOI", to: "DEL", stops: 1 }] };
    expect(ids(filterFlights([roundTrip], { stops: [0] }))).toEqual([]);
    expect(ids(filterFlights([roundTrip], { stops: [1] }))).toEqual(["rt"]);
  });

  it("counts each filter with its cheapest price", () => {
    const facets = flightFacets(fares);
    expect(facets.stops).toEqual([
      { stops: 0, count: 1, minPrice: 5200 },
      { stops: 1, count: 1, minPrice: 4100 },
      { stops: 2, count: 1, minPrice: 6900 },
    ]);
    expect(facets.airlines.map((airline) => airline.code)).toEqual(["AI", "6E", "UK"]);
    expect(facets.departWindows).toEqual([
      { window: "early", count: 1 },
      { window: "morning", count: 1 },
      { window: "evening", count: 1 },
    ]);
    expect(facets).toMatchObject({ price: { min: 4100, max: 6900 }, refundable: 2 });
  });

  it("picks the cheapest and the fastest fare for the sort tabs", () => {
    expect(flightHighlights(fares)).toEqual({ cheapest: { price: 4100, durationMins: 300 }, fastest: { price: 6900, durationMins: 140 } });
    expect(flightHighlights([])).toEqual({ cheapest: null, fastest: null });
  });
});
