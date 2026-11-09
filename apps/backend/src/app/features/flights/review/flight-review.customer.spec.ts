import { afterEach, describe, expect, it, vi } from "vitest";
import { bookingLinkToken } from "../../../common/utils/booking-links.js";
import type { CouponsService } from "../../coupons/coupons.service.js";
import type { PaymentsService } from "../../payments/payments.service.js";
import type { PricingService } from "../../../pricing/pricing.service.js";
import type { FlightSupplier } from "../../../suppliers/flight-supplier.js";
import type { FlightBookingService } from "../booking/flight-booking.service.js";
import type { FlightSearchSessionsRepository } from "../search/flight-search-sessions.repository.js";
import type { FlightReviewRepository, StoredFlightReview } from "./flight-review.repository.js";
import { FlightReviewService } from "./flight-review.service.js";

const inr = (amount: number) => ({ amount, currency: "INR" });
const leg = (departAt: string) => ({ from: "HYD", to: "CCU", departAt, arriveAt: departAt, durationMins: 120, stops: 0, segments: [{ airlineName: "IndiGo", airlineCode: "6E" }] });
const review = (id: string, status: string, departAt: string, userId: string | null = "u1"): StoredFlightReview =>
  ({
    id, status, userId, keyHash: "k", supplierBookingId: "TJ" + id, travellerDetails: null, failureReason: null, paidAt: new Date("2026-11-01"), expiresAt: new Date(), updatedAt: new Date(),
    booking: status === "confirmed" ? { bookingId: "TJ", pnrs: [{ route: "HYD-CCU", pnr: `PNR${id}` }], tickets: [], failureReason: null, refund: null } : null,
    quote: { criteria: { adults: 1, children: 0, infants: 0 }, journeys: [leg(departAt)], fares: [], price: { total: inr(5000) }, rules: [], requirements: {}, holdAllowed: false, priceChange: null },
  }) as unknown as StoredFlightReview;

function setup(rows: StoredFlightReview[]) {
  const reviews = { find: vi.fn(async (id: string) => rows.find((row) => row.id === id) ?? null), paidForUser: vi.fn(async () => rows) };
  const service = new FlightReviewService(
    {} as FlightSupplier, reviews as unknown as FlightReviewRepository, {} as FlightSearchSessionsRepository, {} as PricingService,
    {} as CouponsService, {} as PaymentsService, { recover: vi.fn() } as unknown as FlightBookingService,
  );
  return service;
}

describe("flight bookings for customers", () => {
  afterEach(() => vi.useRealTimers());

  it("opens for the owner or the private link, and nobody else", async () => {
    const service = setup([review("a", "confirmed", "2099-01-10T06:00", "u1")]);
    await expect(service.viewForCustomer("a", { userId: "u1", token: null })).resolves.toMatchObject({ status: "confirmed" });
    await expect(service.viewForCustomer("a", { userId: null, token: bookingLinkToken("flight", "a") })).resolves.toBeDefined();
    await expect(service.viewForCustomer("a", { userId: "u2", token: null })).rejects.toThrow(/couldn't find/);
    await expect(service.viewForCustomer("a", { userId: null, token: bookingLinkToken("flight", "b") })).rejects.toThrow(/couldn't find/);
  });

  it("sorts bookings into upcoming, past and cancelled", async () => {
    const service = setup([
      review("soon", "confirmed", "2099-01-10T06:00"),
      review("later", "pending", "2099-03-01T06:00"),
      review("old", "confirmed", "2020-05-01T06:00"),
      review("failed", "failed", "2099-02-01T06:00"),
    ]);
    const upcoming = await service.listForCustomer("u1", "upcoming", "", 1);
    expect(upcoming.items.map((item) => item.id)).toEqual(["soon", "later"]);
    expect(upcoming.items[1]!.status).toBe("processing");
    expect((await service.listForCustomer("u1", "past", "", 1)).items.map((item) => item.id)).toEqual(["old"]);
    expect((await service.listForCustomer("u1", "cancelled", "", 1)).items.map((item) => item.id)).toEqual(["failed"]);
    expect((await service.listForCustomer("u1", "upcoming", "pnrsoon", 1)).items.map((item) => item.id)).toEqual(["soon"]);
  });
});
