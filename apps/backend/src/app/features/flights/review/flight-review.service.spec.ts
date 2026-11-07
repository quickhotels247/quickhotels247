import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import type { FlightOption, FlightSearchCriteria } from "@quickhotels/types/flights";
import type { FlightReviewResult, FlightSupplier } from "../../../suppliers/flight-supplier.js";
import { SupplierError } from "../../../suppliers/supplier-error.js";
import type { FlightSearchSessionsRepository } from "../search/flight-search-sessions.repository.js";
import type { FlightReviewRepository, NewFlightReview, StoredFlightReview } from "./flight-review.repository.js";
import type { PricingService } from "../../../pricing/pricing.service.js";
import { FlightReviewService } from "./flight-review.service.js";

const KEY = "k".repeat(40);
const criteria: FlightSearchCriteria = {
  tripType: "roundTrip", from: "DEL", to: "GOI", depart: "2026-12-10", return: "2026-12-14", legs: [],
  adults: 1, children: 0, infants: 0, cabin: "economy", directOnly: false,
};
const option = (id: string, amount: number) => ({ id, price: { amount, currency: "INR" } }) as FlightOption;
const money = (amount: number) => ({ amount, currency: "INR" });

function setup(reviewed: Partial<FlightReviewResult> | Error = {}) {
  const rows = new Map<string, StoredFlightReview>();
  const reviews = {
    findByKeyHash: vi.fn(async (keyHash: string) => [...rows.values()].find((row) => row.keyHash === keyHash) ?? null),
    find: vi.fn(async (id: string) => rows.get(id) ?? null),
    create: vi.fn(async (review: NewFlightReview) => {
      const id = `review-${rows.size + 1}`;
      rows.set(id, { id, keyHash: review.keyHash, status: "travellers", supplierBookingId: review.supplierBookingId, quote: review.quote, travellerDetails: null, expiresAt: review.expiresAt });
      return id;
    }),
  };
  const searches = {
    find: vi.fn(async () => ({
      id: "search-1", criteria, supplier: "tripjack", expiresAt: new Date(Date.now() + 600_000),
      trips: [
        { key: "ONWARD", label: "Departure", options: [option("out-1", 4000)] },
        { key: "RETURN", label: "Return", options: [option("ret-1", 3900)] },
      ],
    })),
  };
  const supplier = {
    name: "tripjack",
    reviewFlights: vi.fn(async () => {
      if (reviewed instanceof Error) throw reviewed;
      return {
        supplierBookingId: "TJS1", journeys: [], fares: [], requirements: {}, holdAllowed: false, expiresAt: new Date(Date.now() + 1_800_000),
        price: { base: money(7000), taxes: money(900), serviceFee: money(0), serviceFeeTax: money(0), total: money(7900), perTraveller: [] },
        ...reviewed,
      } as FlightReviewResult;
    }),
    fareRules: vi.fn(async () => []),
  } as unknown as FlightSupplier;
  // No markup rules: the reviewed price passes through unchanged.
  const pricing = { markFlightReview: vi.fn(async (price: unknown) => ({ price, applied: { ruleId: null, ruleVersion: null, net: price, markup: { amount: 0, currency: "INR" } } })) };
  const service = new FlightReviewService(supplier, reviews as unknown as FlightReviewRepository, searches as unknown as FlightSearchSessionsRepository, pricing as unknown as PricingService);
  return { service, supplier };
}

const both = [{ trip: "ONWARD", id: "out-1" }, { trip: "RETURN", id: "ret-1" }];

describe("FlightReviewService", () => {
  it("reviews one fare per list, once per key, keeping the server's price", async () => {
    const { service, supplier } = setup();
    const [a, b] = await Promise.all([service.create("search-1", both, KEY), service.create("search-1", both, KEY)]);
    expect(a.reviewId).toBe(b.reviewId);
    expect(supplier.reviewFlights).toHaveBeenCalledTimes(1);
    expect(supplier.reviewFlights).toHaveBeenCalledWith(["out-1", "ret-1"], criteria, ["ONWARD", "RETURN"], expect.anything());
    expect(a).toMatchObject({ status: "travellers", priceChange: null, price: { total: money(7900) } });
  });

  it("flags a changed price", async () => {
    const { service } = setup({ price: { base: money(7500), taxes: money(900), serviceFee: money(0), serviceFeeTax: money(0), total: money(8400), perTraveller: [] } });
    expect((await service.create("search-1", both, KEY)).priceChange).toEqual({ previous: money(7900), current: money(8400) });
  });

  it("needs a fare from each list of the search", async () => {
    const { service } = setup();
    await expect(service.create("search-1", [both[0]!], KEY)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create("search-1", [both[0]!, { trip: "RETURN", id: "made-up" }], KEY)).rejects.toThrow(/aren't part of this search/);
  });

  it("says when seats sold out", async () => {
    const { service } = setup(new SupplierError("SOLD_OUT", "gone", "tripjack", "ref"));
    await expect(service.create("search-1", both, KEY)).rejects.toBeInstanceOf(ConflictException);
  });

  it("opens only with the key that created it", async () => {
    const { service } = setup();
    const { reviewId } = await service.create("search-1", both, KEY);
    await expect(service.get(reviewId, "x".repeat(40))).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.get(reviewId, KEY)).resolves.toMatchObject({ reviewId });
  });
});
