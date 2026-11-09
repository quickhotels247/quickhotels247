import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MailService } from "../../../mail/mail.service.js";
import type { HotelSupplier } from "../../../suppliers/hotel-supplier.js";
import { SupplierError } from "../../../suppliers/supplier-error.js";
import type { CouponsService } from "../../coupons/coupons.service.js";
import type { PaymentsService } from "../../payments/payments.service.js";
import type { CheckoutRepository, StoredCheckout } from "../checkout.repository.js";
import type { BookingsRepository } from "../../bookings/bookings.repository.js";
import type { HotelBookingsRepository } from "./hotel-bookings.repository.js";
import { HotelBookingService } from "./hotel-booking.service.js";

const money = (amount: number) => ({ amount, currency: "INR" });

function setup(book: () => Promise<void>, state: { status: string; confirmation?: string | null }) {
  let row = {
    id: "co1", status: "AWAITING_PAYMENT", userId: null, hotelId: "h1", supplierContext: { bookingId: "TJH1", totalPrice: 8800 },
    quote: {
      hotel: { name: "Sea Breeze", city: "Goa" }, stay: { checkIn: "2026-12-01", checkOut: "2026-12-03" }, nights: 2,
      rooms: [{ adults: 2, childAges: [5] }],
      room: { roomName: "Deluxe", totalPrice: money(9000) },
      markup: { net: money(8800), markup: money(200), ruleId: "r", ruleVersion: 1 },
      coupon: { code: "SAVE100", title: null, discount: money(100) },
    },
    guestDetails: {
      contact: { email: "a@example.com", phoneCode: "+91", phone: "9876543210" },
      rooms: [{ guests: [{ title: "Ms", firstName: "Asha", lastName: "Rao" }, { title: "Mr", firstName: "Ravi", lastName: "Rao" }, { title: "Master", firstName: "Kiran", lastName: "Rao" }] }],
      acceptTerms: true,
    },
    booking: null, updatedAt: new Date(),
  } as unknown as StoredCheckout;
  const statuses: string[] = [];
  const checkouts = {
    find: vi.fn(async () => row),
    transition: vi.fn(async (_id: string, from: string[], to: string) => (from.includes(row.status) ? ((row = { ...row, status: to } as StoredCheckout), true) : false)),
    touch: vi.fn(async () => {}),
  };
  const booking = { id: "b1", reference: "QH-ABC234", status: "PAYMENT_PENDING", createdAt: new Date(), opsAlertedAt: null };
  const bookings = {
    createFromCheckout: vi.fn(async () => booking),
    findForCheckout: vi.fn(async () => booking),
    setStatus: vi.fn(async (_id: string, to: string) => void statuses.push(to)),
    markAlerted: vi.fn(async () => {}),
  };
  const supplier = { name: "mock", bookRoom: vi.fn(book), hotelBooking: vi.fn(async () => ({ confirmation: null, supplierReference: null, ...state })) };
  const payments = {
    registerFulfiller: vi.fn(),
    refundAll: vi.fn(async () => ({ status: "processed", amount: 8900, currency: "INR" })),
    captured: vi.fn(async () => ({ id: "pay-row-1" })),
    alert: vi.fn(),
  };
  const mail = { sendInBackground: vi.fn() };
  const coupons = { recordUse: vi.fn(async () => {}), releaseUse: vi.fn(async () => {}) };
  const service = new HotelBookingService(
    supplier as unknown as HotelSupplier, checkouts as unknown as CheckoutRepository, bookings as unknown as HotelBookingsRepository,
    payments as unknown as PaymentsService, coupons as unknown as CouponsService, mail as unknown as MailService,
    { findByReference: vi.fn(async () => null) } as unknown as BookingsRepository,
  );
  return { service, supplier, payments, mail, coupons, bookings, statuses, current: () => row, set: (status: string) => void (row = { ...row, status } as StoredCheckout) };
}

describe("HotelBookingService", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());
  const run = async (promise: Promise<void>) => {
    await vi.runAllTimersAsync();
    await promise;
  };

  it("records the booking, books at the net price and confirms", async () => {
    const t = setup(async () => {}, { status: "SUCCESS", confirmation: "HC-998" });
    await run(t.service.fulfil("co1"));
    expect(t.bookings.createFromCheckout).toHaveBeenCalledWith(expect.objectContaining({ id: "co1" }), "mock", "pay-row-1");
    expect(t.supplier.bookRoom).toHaveBeenCalledWith({ bookingId: "TJH1", totalPrice: 8800 }, 8800, expect.anything(), expect.anything());
    // Adults then children, in room order.
    const guests = (t.supplier.bookRoom.mock.calls[0] as unknown[])[2] as { rooms: { guests: { child: boolean }[] }[] };
    expect(guests.rooms[0]!.guests.map((g) => g.child)).toEqual([false, false, true]);
    expect(t.current().status).toBe("CONFIRMED");
    expect(t.bookings.setStatus).toHaveBeenLastCalledWith("b1", "CONFIRMED", "supplier", expect.any(String), expect.objectContaining({ supplierConfirmation: "HC-998" }));
    expect(t.mail.sendInBackground).toHaveBeenCalledWith(expect.objectContaining({ to: "a@example.com" }), expect.objectContaining({ template: "hotel-confirmed" }));
    expect(t.coupons.recordUse).toHaveBeenCalledWith(expect.objectContaining({ code: "SAVE100" }), "pay-row-1", null);
    expect(t.payments.refundAll).not.toHaveBeenCalled();
  });

  it("refunds in full when the hotel fails the booking", async () => {
    const t = setup(async () => {}, { status: "FAILED" });
    await run(t.service.fulfil("co1"));
    expect(t.payments.refundAll).toHaveBeenCalledWith({ attemptId: "co1" }, expect.any(String));
    expect(t.current().status).toBe("SUPPLIER_BOOKING_FAILED");
    expect(t.statuses.at(-1)).toBe("REFUNDED");
    expect(t.coupons.releaseUse).toHaveBeenCalledWith("pay-row-1");
    expect(t.mail.sendInBackground).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ template: "hotel-failed" }));
    expect(t.payments.alert).toHaveBeenCalled();
  });

  it("refunds without polling when Book is rejected", async () => {
    const t = setup(async () => {
      throw new SupplierError("SOLD_OUT", "gone", "tripjack", "c");
    }, { status: "SUCCESS" });
    await run(t.service.fulfil("co1"));
    expect(t.supplier.hotelBooking).not.toHaveBeenCalled();
    expect(t.current().status).toBe("SUPPLIER_BOOKING_FAILED");
  });

  it("never books again when Book timed out; only asks for the status", async () => {
    const t = setup(async () => {
      throw new SupplierError("TIMEOUT", "slow", "tripjack", "c");
    }, { status: "SUCCESS", confirmation: "HC-1" });
    await run(t.service.fulfil("co1"));
    expect(t.supplier.bookRoom).toHaveBeenCalledTimes(1);
    expect(t.current().status).toBe("CONFIRMED");
  });

  it("a second payment report doesn't book twice", async () => {
    const t = setup(async () => {}, { status: "SUCCESS" });
    await run(t.service.fulfil("co1"));
    await run(t.service.fulfil("co1"));
    expect(t.supplier.bookRoom).toHaveBeenCalledTimes(1);
  });

  it("resumes a pending booking by only asking for its status", async () => {
    const t = setup(async () => {}, { status: "SUCCESS" });
    t.set("SUPPLIER_BOOKING_PENDING");
    await run(t.service.resume(t.current()));
    expect(t.supplier.bookRoom).not.toHaveBeenCalled();
    expect(t.current().status).toBe("CONFIRMED");
  });

  it("keeps waiting while the hotel is still processing", async () => {
    const t = setup(async () => {}, { status: "IN_PROGRESS" });
    await run(t.service.fulfil("co1"));
    expect(t.current().status).toBe("SUPPLIER_BOOKING_PENDING");
    expect(t.payments.refundAll).not.toHaveBeenCalled();
  });
});
