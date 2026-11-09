import { randomUUID } from "node:crypto";
import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AdminHotelBooking, AdminHotelCancelRequest } from "@quickhotels/types/admin";
import { HOTEL_SUPPLIER, type HotelSupplier } from "../../../suppliers/hotel-supplier.js";
import { HotelCancellationService } from "../../bookings/cancellation/hotel-cancellation.service.js";
import { HotelBookingService } from "../../checkout/booking/hotel-booking.service.js";
import { CheckoutRepository } from "../../checkout/checkout.repository.js";
import { PaymentsService } from "../../payments/payments.service.js";
import { AuditLogRepository } from "../audit-log.repository.js";
import { AdminHotelBookingsRepository } from "./admin-hotel-bookings.repository.js";

// Staff actions on hotel bookings: look again with the supplier, refund
// money, or cancel for the customer (by the policy, or waiving the fee).
@Injectable()
export class AdminHotelBookingsService {
  constructor(
    @Inject(HOTEL_SUPPLIER) private readonly supplier: HotelSupplier,
    private readonly bookings: AdminHotelBookingsRepository,
    private readonly checkouts: CheckoutRepository,
    private readonly booking: HotelBookingService,
    private readonly cancellation: HotelCancellationService,
    private readonly payments: PaymentsService,
    private readonly audit: AuditLogRepository,
  ) {}

  async find(id: string): Promise<AdminHotelBooking> {
    const booking = await this.bookings.find(id);
    if (!booking) throw new NotFoundException("That booking was not found.");
    return booking;
  }

  // Asks the supplier for the booking's status, and moves a stuck booking or
  // cancellation on (never books or cancels again).
  async recheck(id: string, adminId: string): Promise<{ supplierStatus: string; booking: AdminHotelBooking }> {
    const current = await this.find(id);
    const checkout = current.checkoutId ? await this.checkouts.find(current.checkoutId) : null;
    if (!checkout) throw new ConflictException("This booking has no checkout to check with the supplier.");
    const supplierStatus = (await this.supplier.hotelBooking(checkout.supplierContext, { correlationId: randomUUID() })).status;
    if (current.status === "PAYMENT_PENDING" || current.status === "SUPPLIER_BOOKING_PENDING") await this.booking.resume(checkout);
    if (current.status === "CANCELLATION_PENDING") await this.cancellation.follow(id, 1);
    await this.audit.record(adminId, "hotel-booking.recheck", id, { supplierStatus });
    return { supplierStatus, booking: await this.find(id) };
  }

  // Money back (full or part). Doesn't cancel anything with the hotel.
  async refund(id: string, amount: number | null, reason: string, adminId: string): Promise<AdminHotelBooking> {
    const current = await this.find(id);
    if (!current.checkoutId) throw new ConflictException("This booking has no payment to refund.");
    const result = await this.payments.refund({ attemptId: current.checkoutId }, amount, reason, adminId);
    await this.audit.record(adminId, "hotel-booking.refund", id, { amount: result.amount, status: result.status, reason });
    return this.find(id);
  }

  // Cancels with the hotel for the customer; the refund follows the policy,
  // or is everything paid when the fee is waived.
  async cancel(id: string, request: AdminHotelCancelRequest, adminId: string): Promise<AdminHotelBooking> {
    const current = await this.find(id);
    if (current.status !== "CONFIRMED" || !current.cancelQuote) throw new ConflictException("Only confirmed bookings can be cancelled.");
    const quote = current.cancelQuote;
    const paid = { amount: Math.round((quote.fee.amount + quote.refund.amount) * 100) / 100, currency: quote.refund.currency };
    const effective = request.waiveFee ? { ...quote, allowed: true, fee: { amount: 0, currency: paid.currency }, refund: paid } : { ...quote, allowed: true };
    await this.cancellation.request(id, effective, request.reason, "admin");
    await this.audit.record(adminId, "hotel-booking.cancel", id, { reason: request.reason, waiveFee: Boolean(request.waiveFee), refund: effective.refund.amount });
    return this.find(id);
  }
}
