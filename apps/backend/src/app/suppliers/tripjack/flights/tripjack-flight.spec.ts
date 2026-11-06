import { describe, expect, it } from "vitest";
import type { FlightSearchCriteria } from "@quickhotels/types/flights";
import { baggage, toFlightOption, toTripjackFlightSearch, tripLabel } from "./tripjack-flight.mapper.js";
import type { TripjackTripInfo } from "./tripjack-flight.types.js";

const criteria: FlightSearchCriteria = {
  tripType: "roundTrip", from: "BOM", to: "DXB", depart: "2026-11-25", return: "2026-11-29", legs: [],
  adults: 2, children: 1, infants: 1, cabin: "economy", directOnly: true,
};

const segment = (from: string, to: string, dt: string, at: string, duration: number, extra: object = {}) => ({
  id: `${from}${to}`, fD: { aI: { code: "6E", name: "IndiGo" }, fN: "100" }, stops: 0, duration,
  da: { code: from }, aa: { code: to }, dt, at, ...extra,
});

describe("toTripjackFlightSearch", () => {
  it("builds both directions for a round trip, with travellers and filters", () => {
    expect(toTripjackFlightSearch(criteria)).toEqual({
      searchQuery: {
        cabinClass: "ECONOMY",
        paxInfo: { ADULT: 2, CHILD: 1, INFANT: 1 },
        routeInfos: [
          { fromCityOrAirport: { code: "BOM" }, toCityOrAirport: { code: "DXB" }, travelDate: "2026-11-25" },
          { fromCityOrAirport: { code: "DXB" }, toCityOrAirport: { code: "BOM" }, travelDate: "2026-11-29" },
        ],
        searchModifiers: { isDirectFlight: true },
      },
    });
  });
});

describe("toFlightOption", () => {
  // A COMBO fare: BOM→AUH→DXB out (connecting), DXB→BOM back.
  const trip: TripjackTripInfo = {
    sI: [
      segment("BOM", "AUH", "2026-11-25T00:50", "2026-11-25T02:45", 205, { sN: 0 }),
      segment("AUH", "DXB", "2026-11-25T04:15", "2026-11-25T05:10", 55, { sN: 1 }),
      segment("DXB", "BOM", "2026-11-29T10:00", "2026-11-29T14:40", 190, { sN: 0, isRs: true }),
    ],
    totalPriceList: [
      { id: "expensive", fareIdentifier: "PUBLISHED", fd: { ADULT: { fC: { TF: 30000, BF: 20000, TAF: 10000 } }, CHILD: { fC: { TF: 25000, BF: 0, TAF: 0 } }, INFANT: { fC: { TF: 3000, BF: 0, TAF: 0 } } } },
      {
        id: "cheap", fareIdentifier: "PUBLISHED",
        fd: {
          ADULT: { fC: { TF: 21670.5, BF: 12500, TAF: 9170.5 }, rT: 2, bI: { iB: "30 Kg", cB: "7 Kg" }, sR: 3, cc: "ECONOMY" },
          CHILD: { fC: { TF: 20000, BF: 0, TAF: 0 } },
          INFANT: { fC: { TF: 2500, BF: 0, TAF: 0 } },
        },
      },
    ],
  };

  it("splits journeys, adds layovers, and prices every traveller", () => {
    const option = toFlightOption(trip, criteria)!;
    expect(option.id).toBe("cheap");
    expect(option.legs).toHaveLength(2);
    expect(option.legs[0]).toMatchObject({ from: "BOM", to: "DXB", stops: 1, durationMins: 205 + 90 + 55 });
    expect(option.legs[1]).toMatchObject({ from: "DXB", to: "BOM", stops: 0, durationMins: 190 });
    expect(option.price.amount).toBe(21670.5 * 2 + 20000 + 2500);
    expect(option.pricePerAdult.amount).toBe(21670.5);
    expect(option).toMatchObject({ refundable: "PARTIALLY_REFUNDABLE", seatsLeft: 3, baggage: { checkIn: "30 Kg", cabin: "7 Kg" }, airlines: "IndiGo" });
  });

  it("skips trips without fares", () => {
    expect(toFlightOption({ ...trip, totalPriceList: [] }, criteria)).toBeNull();
  });

  it("leaves out Special Return fares, which only book as a matched pair", () => {
    const special = { id: "special", fareIdentifier: "SPECIAL_RETURN", fd: { ADULT: { fC: { TF: 100, BF: 80, TAF: 20 } }, CHILD: { fC: { TF: 100, BF: 0, TAF: 0 } }, INFANT: { fC: { TF: 10, BF: 0, TAF: 0 } } } };
    expect(toFlightOption({ ...trip, totalPriceList: [special, ...trip.totalPriceList] }, criteria)!.id).toBe("cheap");
    expect(toFlightOption({ ...trip, totalPriceList: [special] }, criteria)).toBeNull();
  });

  it("labels trip lists", () => {
    expect(tripLabel("RETURN", criteria)).toBe("Return: DXB → BOM");
    expect(tripLabel("COMBO", criteria)).toBe("Round trip: BOM ⇄ DXB");
  });
});

describe("baggage", () => {
  it("writes units one way", () => {
    expect(baggage("15")).toBe("15 Kg");
    expect(baggage("15Kilograms")).toBe("15 Kg");
    expect(baggage("20 KGS")).toBe("20 Kg");
    expect(baggage("15 KG (01 Piece only)")).toBe("15 Kg (01 Piece only)");
    expect(baggage("1 Piece")).toBe("1 Piece");
    expect(baggage(" ")).toBeNull();
  });
});
