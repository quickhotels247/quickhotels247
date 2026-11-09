import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConflictException } from "@nestjs/common";
import type { MailService } from "../../../mail/mail.service.js";
import type { HotelSupplier } from "../../../suppliers/hotel-supplier.js";
import { SupplierError } from "../../../suppliers/supplier-error.js";
import type { PaymentsService } from "../../payments/payments.service.js";
import type { HotelCancellationsRepository } from "./hotel-cancellations.repository.js";
import { HotelCancellationService } from "./hotel-cancellation.service.js";

const inr = (amount: number) => ({ amount, currency: "INR" });
const quote = { allowed: true, reason: null, fee: inr(3000), refund: inr(2400) };

function setup(cancel: () => Promise<void>, supplierStatus: string) {
  let status = "CONFIRMED";
  let cancellation: { id: string; status: string; refundEstimate: number; currency: string; requestedAt: Date } | null = null;
  const repo = {
    start: vi.fn(async () => (status === "CONFIRMED" ? ((status = "CANCELLATION_PENDING"), (cancellation = { id: "c1", status: "REQUESTED", refundEstimate: 2400, currency: "INR", requestedAt: new Date() }), "c1") : null)),
    find: vi.fn(async () => ({
      id: "b1", reference: "QH-ABC234", status, userId: null, attemptId: "co1", contactEmail: "a@example.com",
      checkIn: new Date("2026-12-01"), checkOut: new Date("2026-12-03"),
      rooms: [{ roomName: "Deluxe", guests: [{ firstName: "Asha" }] }], hotel: { name: "Sea Breeze", city: "Goa" },
      attempt: { supplierContext: { bookingId: "TJH1" } }, cancellations: cancellation ? [cancellation] : [],
    })),
    setCancellation: vi.fn(async (_id: string, next: string) => void (cancellation = { ...cancellation!, status: next })),
    setBooking: vi.fn(async (_id: string, to: string) => void (status = to)),
    touch: vi.fn(async () => {}),
  };
  const supplier = { cancelRoom: vi.fn(cancel), hotelBooking: vi.fn(async () => ({ status: supplierStatus, confirmation: null, supplierReference: null })) };
  const payments = { refund: vi.fn(async () => ({ status: "processed", amount: 2400, currency: "INR" })), alert: vi.fn() };
  const mail = { sendInBackground: vi.fn() };
  const service = new HotelCancellationService(supplier as unknown as HotelSupplier, repo as unknown as HotelCancellationsRepository, payments as unknown as PaymentsService, mail as unknown as MailService);
  return { service, repo, supplier, payments, mail, status: () => status };
}

describe("HotelCancellationService", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("cancels with the supplier, then refunds what the policy allows", async () => {
    const t = setup(async () => {}, "CANCELLED");
    await t.service.request("b1", quote, "Plans changed", "customer");
    await vi.runAllTimersAsync();
    expect(t.supplier.cancelRoom).toHaveBeenCalledTimes(1);
    expect(t.payments.refund).toHaveBeenCalledWith({ attemptId: "co1" }, 2400, expect.any(String), null, "c1");
    expect(t.status()).toBe("REFUNDED");
    expect(t.mail.sendInBackground).toHaveBeenCalledWith(expect.objectContaining({ to: "a@example.com" }), expect.objectContaining({ template: "hotel-cancelled" }));
  });

  it("puts the booking back when the supplier refuses", async () => {
    const t = setup(async () => {
      throw new SupplierError("BAD_REQUEST", "CANCELLATION_NOT_ALLOWED", "tripjack", "c");
    }, "SUCCESS");
    await expect(t.service.request("b1", quote, null, "customer")).rejects.toBeInstanceOf(ConflictException);
    expect(t.status()).toBe("CONFIRMED");
    expect(t.payments.refund).not.toHaveBeenCalled();
  });

  it("never cancels twice and waits while the supplier handles it offline", async () => {
    const t = setup(async () => {
      throw new SupplierError("TIMEOUT", "slow", "tripjack", "c");
    }, "CANCELLATION_PENDING");
    await t.service.request("b1", quote, null, "customer");
    await vi.runAllTimersAsync();
    await expect(t.service.request("b1", quote, null, "customer")).rejects.toBeInstanceOf(ConflictException);
    expect(t.supplier.cancelRoom).toHaveBeenCalledTimes(1);
    expect(t.status()).toBe("CANCELLATION_PENDING");
    expect(t.payments.refund).not.toHaveBeenCalled();
    expect(t.payments.alert).toHaveBeenCalledWith(expect.stringContaining("pending"), expect.any(Array), expect.any(String));
  });
});
