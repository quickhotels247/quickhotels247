import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MailService } from "../../../mail/mail.service.js";
import type { FlightSupplier } from "../../../suppliers/flight-supplier.js";
import { SupplierError } from "../../../suppliers/supplier-error.js";
import type { PaymentsService } from "../../payments/payments.service.js";
import type { FlightReviewRepository, StoredFlightReview } from "../review/flight-review.repository.js";
import { FlightBookingService } from "./flight-booking.service.js";

const money = (amount: number) => ({ amount, currency: "INR" });

function setup(book: () => Promise<void>, details: { status: string; pnrs?: { route: string; pnr: string }[] }) {
  let row = {
    id: "fc1", keyHash: "k", status: "payment", userId: null, supplierBookingId: "TJS1",
    quote: { journeys: [], price: { total: money(6000) }, markup: { net: money(5864), markup: money(136), ruleId: "r", ruleVersion: 1 } },
    travellerDetails: { travellers: [{ type: "adult", title: "Mr", firstName: "Ravi", lastName: "K" }], contact: { email: "r@example.com", phoneCode: "+91", phone: "9876543210" }, acceptTerms: true },
    booking: null, failureReason: null, expiresAt: new Date(Date.now() + 600_000), updatedAt: new Date(),
  } as unknown as StoredFlightReview;
  const reviews = {
    find: vi.fn(async () => row),
    transition: vi.fn(async (_id: string, from: string[], to: string) => (from.includes(row.status) ? ((row = { ...row, status: to }), true) : false)),
    saveBooking: vi.fn(async (_id: string, status: string, booking: unknown) => void (row = { ...row, status, booking } as StoredFlightReview)),
  };
  const supplier = { bookFlights: vi.fn(book), flightBooking: vi.fn(async () => ({ pnrs: [], tickets: [], ...details })) };
  const payments = { registerFulfiller: vi.fn(), refundAll: vi.fn(async () => ({ status: "processed", amount: 6000, currency: "INR" })) };
  const mail = { sendInBackground: vi.fn() };
  const service = new FlightBookingService(supplier as unknown as FlightSupplier, reviews as unknown as FlightReviewRepository, payments as unknown as PaymentsService, mail as unknown as MailService);
  return { service, supplier, payments, mail, current: () => row };
}

describe("FlightBookingService", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  const run = async (promise: Promise<void>) => {
    await vi.runAllTimersAsync();
    await promise;
  };

  it("books at the supplier's net fare and saves the PNR", async () => {
    const t = setup(async () => {}, { status: "SUCCESS", pnrs: [{ route: "HYD-CCU", pnr: "ABC123" }] });
    await run(t.service.fulfil("fc1"));
    expect(t.supplier.bookFlights).toHaveBeenCalledWith("TJS1", 5864, expect.anything(), expect.anything());
    expect(t.current().status).toBe("confirmed");
    expect(t.current().booking?.pnrs).toEqual([{ route: "HYD-CCU", pnr: "ABC123" }]);
    expect(t.mail.sendInBackground).toHaveBeenCalledWith(expect.objectContaining({ to: "r@example.com" }), expect.objectContaining({ template: "flight-confirmed" }));
  });

  it("refunds when the airline rejects the booking", async () => {
    const t = setup(async () => {
      throw new SupplierError("BAD_REQUEST", "fare gone", "tripjack", "c");
    }, { status: "FAILED" });
    await run(t.service.fulfil("fc1"));
    expect(t.payments.refundAll).toHaveBeenCalledWith({ flightCheckoutId: "fc1" }, expect.any(String));
    expect(t.current().status).toBe("failed");
    expect(t.supplier.flightBooking).not.toHaveBeenCalled();
  });

  it("never books twice: a timeout only asks for the status", async () => {
    const t = setup(async () => {
      throw new SupplierError("TIMEOUT", "slow", "tripjack", "c");
    }, { status: "SUCCESS", pnrs: [{ route: "HYD-CCU", pnr: "XYZ789" }] });
    await run(t.service.fulfil("fc1"));
    await run(t.service.fulfil("fc1"));
    expect(t.supplier.bookFlights).toHaveBeenCalledTimes(1);
    expect(t.current().status).toBe("confirmed");
  });
});
