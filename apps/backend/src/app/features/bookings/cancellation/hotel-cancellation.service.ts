import { randomUUID } from "node:crypto";
import { ConflictException, Inject, Injectable, Logger } from "@nestjs/common";
import type { BookingCancelQuote } from "@quickhotels/types/bookings";
import { BookingStatus } from "../../../../generated/prisma/client.js";
import { MailService } from "../../../mail/mail.service.js";
import { hotelCancelledEmail } from "../../../mail/templates/hotel-booking.templates.js";
import { HOTEL_SUPPLIER, type HotelSupplier } from "../../../suppliers/hotel-supplier.js";
import { SupplierError } from "../../../suppliers/supplier-error.js";
import { hotelBookingLink } from "../../checkout/booking/hotel-booking.service.js";
import { PaymentsService } from "../../payments/payments.service.js";
import { HotelCancellationsRepository, type CancellationContext } from "./hotel-cancellations.repository.js";

const CHECK_EVERY_MS = 5_000;
const CHECKS = 6;
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const day = (date: Date) => date.toISOString().slice(0, 10);

// Cancelling a confirmed hotel booking (customer or staff): ask the supplier
// once, follow its status, then refund what the policy allows (Razorpay,
// linked to the cancellation) and email the customer. Cancel is never sent
// twice; an unclear answer is only followed up with Booking Details.
@Injectable()
export class HotelCancellationService {
  private readonly logger = new Logger(HotelCancellationService.name);
  private readonly busy = new Set<string>();

  constructor(
    @Inject(HOTEL_SUPPLIER) private readonly supplier: HotelSupplier,
    private readonly cancellations: HotelCancellationsRepository,
    private readonly payments: PaymentsService,
    private readonly mail: MailService,
  ) {}

  async request(bookingId: string, quote: BookingCancelQuote, reason: string | null, requestedBy: "customer" | "admin"): Promise<void> {
    const id = await this.cancellations.start(bookingId, { fee: quote.fee.amount, refund: quote.refund.amount, currency: quote.refund.currency }, reason, requestedBy);
    if (!id) throw new ConflictException("This booking is already being cancelled.");
    const booking = (await this.cancellations.find(bookingId))!;
    try {
      await this.supplier.cancelRoom(booking.attempt?.supplierContext, { correlationId: randomUUID() });
    } catch (error) {
      const message = (error as Error).message;
      const already = /ALREADY_IN_PROGRESS|already pending/i.test(message);
      if (error instanceof SupplierError && error.code === "BAD_REQUEST" && !already) {
        // The supplier said no (outside the window, non-refundable): nothing changed.
        this.logger.warn(`Cancel for ${booking.reference} rejected: ${message}`);
        await this.cancellations.setCancellation(id, "REJECTED", { error: message });
        await this.cancellations.setBooking(bookingId, BookingStatus.CONFIRMED, "supplier", "The hotel declined the cancellation");
        throw new ConflictException("The hotel couldn't cancel this booking online. Please contact support with your booking reference.");
      }
      // Timeout or network: it may have gone through. Only check, never resend.
      this.logger.warn(`Cancel for ${booking.reference} unclear: ${message}`);
    }
    await this.cancellations.setCancellation(id, "SUPPLIER_PENDING");
    void this.follow(bookingId).catch((error: Error) => this.logger.warn(`Following cancellation of ${booking.reference} failed: ${error.message}`));
  }

  // Checks the supplier's status a few times; the reconciler keeps checking
  // hourly while the supplier handles it offline.
  async follow(bookingId: string, times = CHECKS): Promise<void> {
    if (this.busy.has(bookingId)) return;
    this.busy.add(bookingId);
    try {
      for (let i = 0; i < times; i++) {
        if (i > 0 || times > 1) await pause(CHECK_EVERY_MS);
        const booking = await this.cancellations.find(bookingId);
        const cancellation = booking?.cancellations[0];
        if (!booking || !cancellation || booking.status !== BookingStatus.CANCELLATION_PENDING) return;
        let status = "UNKNOWN";
        try {
          status = (await this.supplier.hotelBooking(booking.attempt?.supplierContext, { correlationId: randomUUID() })).status;
        } catch (error) {
          this.logger.warn(`Status check for cancelling ${booking.reference} failed: ${(error as Error).message}`);
        }
        if (status === "CANCELLED") return this.finish(booking, cancellation.id, Number(cancellation.refundEstimate ?? 0), cancellation.currency ?? "INR");
        await this.cancellations.touch(bookingId);
        if (i === times - 1 && times > 1) {
          this.payments.alert(`Hotel cancellation pending (${booking.reference})`, [
            `Requested ${cancellation.requestedAt.toISOString()}; the supplier reports ${status}.`,
            "We check every hour and refund the customer once it's cancelled.",
          ], "If it stays pending for a day, follow up with TripJack support.");
        }
      }
    } finally {
      this.busy.delete(bookingId);
    }
  }

  private async finish(booking: CancellationContext, cancellationId: string, refundAmount: number, currency: string) {
    await this.cancellations.setCancellation(cancellationId, "CONFIRMED");
    await this.cancellations.setBooking(booking.id, BookingStatus.CANCELLED, "supplier", "Cancelled with the hotel", { cancelledAt: new Date() });
    let refund: { status: "pending" | "processed" | "failed"; amount: number; currency: string } | null = null;
    if (refundAmount > 0 && booking.attemptId) {
      refund = await this.payments.refund({ attemptId: booking.attemptId }, refundAmount, `Booking ${booking.reference} cancelled`, null, cancellationId).catch((error: Error) => {
        this.payments.alert(`Cancellation refund not sent (${booking.reference})`, [error.message], "Refund the customer from the Razorpay dashboard.");
        return null;
      });
      if (refund && refund.status !== "failed") {
        await this.cancellations.setBooking(booking.id, refund.status === "processed" ? BookingStatus.REFUNDED : BookingStatus.REFUND_PENDING, "payment", "Cancellation refund");
      }
    }
    this.mail.sendInBackground(
      hotelCancelledEmail({
        to: booking.contactEmail,
        name: booking.rooms[0]?.guests[0]?.firstName ?? "there",
        hotel: booking.hotel.name,
        city: booking.hotel.city,
        checkIn: day(booking.checkIn),
        checkOut: day(booking.checkOut),
        reference: booking.reference,
        refund: refundAmount > 0 ? { status: refund?.status ?? "failed", amount: { amount: refundAmount, currency } } : null,
        link: hotelBookingLink(booking),
      }),
      { template: "hotel-cancelled", userId: booking.userId, bookingId: booking.id },
    );
  }
}
