import { describe, expect, it } from "vitest";
import type { FlightSearchCriteria } from "@quickhotels/types/flights";
import { toFareRules, toFlightReview } from "./tripjack-flight-review.mapper.js";
import type { TripjackFlightReviewResponse } from "./tripjack-flight.types.js";

const criteria: FlightSearchCriteria = {
  tripType: "oneWay", from: "DEL", to: "BOM", depart: "2026-12-10", return: "", legs: [],
  adults: 2, children: 0, infants: 1, cabin: "economy", directOnly: false,
};

const review: TripjackFlightReviewResponse = {
  bookingId: "TJS101",
  tripInfos: [{
    sI: [{ id: "1", fD: { aI: { code: "AI", name: "Air India" }, fN: "2678" }, stops: 0, duration: 135, da: { code: "DEL" }, aa: { code: "BOM" }, dt: "2026-12-10T08:35", at: "2026-12-10T10:50", sN: 0 }],
    totalPriceList: [{ id: "p1", fareIdentifier: "PUBLISHED", fd: { ADULT: { fC: { TF: 2238.5, BF: 2000, TAF: 238.5 }, rT: 1, bI: { iB: "15", cB: "7 Kg" }, cc: "ECONOMY" }, INFANT: { fC: { TF: 900, BF: 800, TAF: 100 } } } }],
  }],
  totalPriceInfo: { totalFareDetail: { fC: { TF: 5377, BF: 4800, TAF: 577 }, afC: { TAF: { AGST: 100, OT: 200, MF: 150, MFT: 27 } } } },
  conditions: { st: 1800, isBA: true, dob: { adobr: false, cdobr: false, idobr: true }, pcs: { pm: false }, gst: { igm: false, gstappl: true }, anlm: { fN: 50, lN: 50, n: 100 } },
} as unknown as TripjackFlightReviewResponse;

describe("toFlightReview", () => {
  it("maps journeys, fares, the price breakdown and traveller needs", () => {
    const mapped = toFlightReview(review, criteria, ["ONWARD"]);
    expect(mapped.journeys[0]).toMatchObject({ from: "DEL", to: "BOM", stops: 0, durationMins: 135 });
    expect(mapped.fares[0]).toMatchObject({ trip: "ONWARD", airlines: "Air India", refundable: "REFUNDABLE", baggage: { checkIn: "15 Kg", cabin: "7 Kg" } });
    expect(mapped.price).toEqual({
      base: { amount: 4800, currency: "INR" },
      taxes: { amount: 400, currency: "INR" }, // 577 − service fee 150 − its tax 27
      serviceFee: { amount: 150, currency: "INR" },
      serviceFeeTax: { amount: 27, currency: "INR" },
      total: { amount: 5377, currency: "INR" },
      perTraveller: [
        { type: "adult", count: 2, each: { amount: 2238.5, currency: "INR" } },
        { type: "infant", count: 1, each: { amount: 900, currency: "INR" } },
      ],
    });
    expect(mapped.requirements).toMatchObject({ passport: false, dateOfBirth: { adult: false, child: false, infant: true }, gst: "optional", nameLimits: { first: 50, last: 50, total: 100 } });
    expect(mapped.holdAllowed).toBe(true);
  });
});

describe("toFareRules", () => {
  it("words the time bands and splits the airline's notes", () => {
    const rules = toFareRules({
      fareRule: {
        "DEL-BOM": {
          tfr: {
            NO_SHOW: [{ policyInfo: "Non refundable", st: "0", et: "8760" }],
            CANCELLATION: [
              { amount: 3000, additionalFee: 115, policyInfo: "__nls__Cancellation permitted 02 Hrs before__nls__Penalty INR 3,000", st: "4", et: "8760" },
              { amount: 4000, st: "0", et: "4" },
            ],
            DATECHANGE: [{ amount: 2500, additionalFee: 0, pp: "BEFORE_DEPARTURE" }],
          },
        },
      },
    });
    expect(rules.map((rule) => [rule.type, rule.when])).toEqual([
      ["cancellation", "More than 4 hours before departure"],
      ["cancellation", "Within 4 hours of departure"],
      ["dateChange", "Before departure"],
      ["noShow", "Any time"],
    ]);
    expect(rules[0]).toMatchObject({ route: "DEL-BOM", airlineFee: { amount: 3000 }, serviceFee: { amount: 115 }, notes: ["Cancellation permitted 02 Hrs before", "Penalty INR 3,000"] });
    expect(rules[2]!.serviceFee).toBeNull();
  });
});
