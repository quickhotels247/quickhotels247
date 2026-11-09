import { randomUUID } from "node:crypto";
import { Inject, Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { BookingStatus } from "../../../../generated/prisma/client.js";
import { bookingLinkToken } from "../../../common/utils/booking-links.js";
import { MailService } from "../../../mail/mail.service.js";
import { hotelConfirmedEmail, hotelFailedEmail, type HotelMailInput } from "../../../mail/templates/hotel-booking.templates.js";
import { HOTEL_SUPPLIER, type HotelSupplier, type SupplierHotelBooking, type SupplierHotelGuests } from "../../../suppliers/hotel-supplier.js";
import { SupplierError } from "../../../suppliers/supplier-error.js";
import { frontendUrlFromEnv } from "../../auth/auth.config.js";
import { CouponsService } from "../../coupons/coupons.service.js";
import { PaymentsService } from "../../payments/payments.service.js";
import { CheckoutRepository, payableOf, type StoredCheckout } from "../checkout.repository.js";
import { HotelBookingsRepository, type StoredHotelBooking } from "./hotel-bookings.repository.js";

// TripJack confirms hotel bookings asynchronously: ask Booking Details 5 s
// after Book, then every 5 s for up to 3 minutes.
const FIRST_CHECK_MS = 5_000;
const CHECK_EVERY_MS = 5_000;
const CHECKS = 36;
// Statuses that mean the hotel won't confirm.
const FAILED = new Set(["FAILED", "ABORTED", "CANCELLED", "UNCONFIRMED", "REJECTED"]);
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const { PAYMENT_PENDING, SUPPLIER_BOOKING_PENDING, CONFIRMED, SUPPLIER_BOOKING_FAILED, REFUNDED, REFUND_PENDING } = BookingStatus;

// After payment (roadmap step 8): record the booking, book with the
// supplier, then wait for the hotel's confirmation. Book is never sent twice
// for a checkout; when its outcome is unclear (timeout), only Booking Details
// is asked. If the hotel doesn't confirm, the payment is refunded in full.
@Injectable()
export class HotelBookingService implements OnModuleInit {
  private readonly logger = new Logger(HotelBookingService.name);
  // Checkouts being worked on in this process (no double polling).
  private readonly busy = new Set<string>();

  constructor(
    @Inject(HOTEL_SUPPLIER) private readonly supplier: HotelSupplier,
    private readonly checkouts: CheckoutRepository,
    private readonly bookings: HotelBookingsRepository,
    private readonly payments: PaymentsService,
    private readonly coupons: CouponsService,
    private readonly mail: MailService,
  ) {}

  onModuleInit() {
    this.payments.registerFulfiller("hotel", (id) => this.fulfil(id));
  }

  // Payment captured: AWAITING_PAYMENT → PAYMENT_PENDING (once), the booking
  // row, then → SUPPLIER_BOOKING_PENDING and Book.
  async fulfil(id: string): Promise<void> {
    if (await this.checkouts.transition(id, [BookingStatus.AWAITING_PAYMENT], PAYMENT_PENDING, "payment", "Payment received")) {
      await this.recordCouponUse(id);
    } else {
      const current = await this.checkouts.find(id);
      if (!current || current.status !== PAYMENT_PENDING) return;
    }
    let checkout = (await this.checkouts.find(id))!;
    if (!checkout.quote || !checkout.guestDetails) return this.fail(checkout, null, "Guest details were missing.");
    const payment = await this.payments.captured({ attemptId: id });
    const booking = await this.bookings.createFromCheckout(checkout, this.supplier.name, payment?.id ?? null);
    if (!(await this.checkouts.transition(id, [PAYMENT_PENDING], SUPPLIER_BOOKING_PENDING, "supplier", "Booking sent to the hotel"))) return;
    await this.bookings.setStatus(booking.id, SUPPLIER_BOOKING_PENDING, "supplier", "Booking sent to the hotel");
    checkout = (await this.checkouts.find(id))!;
    const net = checkout.quote!.markup?.net.amount ?? checkout.quote!.room.totalPrice.amount;
    try {
      await this.supplier.bookRoom(checkout.supplierContext, net, this.guests(checkout), { correlationId: randomUUID() });
    } catch (error) {
      const definite = error instanceof SupplierError && (error.code === "BAD_REQUEST" || error.code === "SOLD_OUT");
      this.logger.warn(`Hotel book for ${id} ${definite ? "rejected" : "unclear"}: ${(error as Error).message}`);
      if (definite) return this.fail(checkout, booking, "The hotel couldn't confirm this room at this price.");
      // Timeout or network: the booking may exist. Only ask, never book again.
    }
    await pause(FIRST_CHECK_MS);
    await this.poll(id);
  }

  // A paid checkout that stalled: continue when the customer opens it (the
  // reconciler also does, every minute).
  recover(checkout: StoredCheckout): void {
    const quietFor = Date.now() - checkout.updatedAt.getTime();
    if ((checkout.status === PAYMENT_PENDING && quietFor > 60_000) || (checkout.status === SUPPLIER_BOOKING_PENDING && quietFor > 20_000)) {
      void this.resume(checkout).catch(() => undefined);
    }
  }

  // Book if it never started; otherwise only ask for its status.
  async resume(checkout: StoredCheckout): Promise<void> {
    if (checkout.status === PAYMENT_PENDING) return this.fulfil(checkout.id);
    if (checkout.status === SUPPLIER_BOOKING_PENDING) return this.poll(checkout.id, 1);
  }

  // Paid over 30 minutes ago and still not confirmed: tell the team once.
  async alertSlow(booking: { id: string; reference: string; contactEmail: string; totalAmount: unknown; currency: string }): Promise<void> {
    await this.bookings.markAlerted(booking.id);
    this.payments.alert(`Hotel booking still pending (${booking.reference})`, [
      "Paid over 30 minutes ago and the hotel hasn't confirmed yet.",
      `Customer: ${booking.contactEmail} · Paid ${String(booking.totalAmount)} ${booking.currency}.`,
    ], "Check the booking with TripJack support; refund the customer if it can't be confirmed.");
  }

  private async poll(id: string, times = CHECKS): Promise<void> {
    if (this.busy.has(id)) return;
    this.busy.add(id);
    try {
      for (let i = 0; i < times; i++) {
        const checkout = await this.checkouts.find(id);
        if (!checkout || checkout.status !== SUPPLIER_BOOKING_PENDING) return;
        const booking = await this.bookings.findForCheckout(id);
        let state: SupplierHotelBooking;
        try {
          state = await this.supplier.hotelBooking(checkout.supplierContext, { correlationId: randomUUID() });
        } catch (error) {
          this.logger.warn(`Hotel booking details for ${id} failed: ${(error as Error).message}`);
          state = { status: "PENDING", confirmation: null, supplierReference: null };
        }
        if (state.status === "SUCCESS") return this.confirm(checkout, booking!, state);
        if (FAILED.has(state.status)) return this.fail(checkout, booking, "The hotel couldn't confirm this booking.");
        await this.checkouts.touch(id);
        if (i < times - 1) await pause(CHECK_EVERY_MS);
      }
    } finally {
      this.busy.delete(id);
    }
  }

  private async confirm(checkout: StoredCheckout, booking: StoredHotelBooking, state: SupplierHotelBooking) {
    if (!(await this.checkouts.transition(checkout.id, [SUPPLIER_BOOKING_PENDING], CONFIRMED, "supplier", "Hotel confirmed"))) return;
    await this.bookings.setStatus(booking.id, CONFIRMED, "supplier", "Hotel confirmed", {
      supplierConfirmation: state.confirmation,
      supplierBookingReference: state.supplierReference,
      confirmedAt: new Date(),
    });
    this.email(checkout, booking, "confirmed", state.confirmation, null);
  }

  private async fail(checkout: StoredCheckout, booking: StoredHotelBooking | null, reason: string) {
    if (!(await this.checkouts.transition(checkout.id, [PAYMENT_PENDING, SUPPLIER_BOOKING_PENDING], SUPPLIER_BOOKING_FAILED, "supplier", reason))) return;
    if (booking) await this.bookings.setStatus(booking.id, SUPPLIER_BOOKING_FAILED, "supplier", reason);
    const payment = await this.payments.captured({ attemptId: checkout.id });
    const refund = await this.payments.refundAll({ attemptId: checkout.id }, reason);
    // Not booked: the coupon use no longer counts.
    if (payment) await this.coupons.releaseUse(payment.id).catch(() => undefined);
    if (booking && refund && refund.status !== "failed") {
      await this.bookings.setStatus(booking.id, refund.status === "processed" ? REFUNDED : REFUND_PENDING, "payment", "Refunded in full");
    }
    const mailRefund = refund ? { status: refund.status, amount: { amount: refund.amount, currency: refund.currency } } : null;
    if (booking) this.email(checkout, booking, "failed", null, mailRefund);
    this.payments.alert(`Hotel booking failed (${booking?.reference ?? checkout.id})`, [
      reason,
      `Customer: ${checkout.guestDetails?.contact.email ?? "unknown"} · Paid ${checkout.quote ? payableOf(checkout.quote).amount : "?"} INR.`,
      refund ? `Refund: ${refund.status} (${refund.amount} ${refund.currency}).` : "No captured payment found to refund.",
    ], refund?.status === "failed" ? "The refund failed: refund it from the Razorpay dashboard." : undefined);
  }

  // Guests as the supplier wants them: adults then children in each room.
  private guests(checkout: StoredCheckout): SupplierHotelGuests {
    const quote = checkout.quote!;
    const details = checkout.guestDetails!;
    return {
      rooms: details.rooms.map((room, r) => ({
        guests: room.guests.map((guest, g) => ({
          title: guest.title,
          firstName: guest.firstName,
          lastName: guest.lastName,
          child: g >= (quote.rooms[r]?.adults ?? 0),
          ...(guest.pan ? { pan: guest.pan } : {}),
          ...(guest.passportNumber ? { passportNumber: guest.passportNumber } : {}),
        })),
      })),
      contact: details.contact,
    };
  }

  private async recordCouponUse(id: string) {
    const checkout = await this.checkouts.find(id);
    if (!checkout?.quote?.coupon) return;
    const payment = await this.payments.captured({ attemptId: id });
    if (payment) await this.coupons.recordUse(checkout.quote.coupon, payment.id, checkout.userId).catch((error: Error) => this.logger.warn(`Coupon use for ${id} not recorded: ${error.message}`));
  }

  private email(checkout: StoredCheckout, booking: StoredHotelBooking, outcome: "confirmed" | "failed", confirmation: string | null, refund: HotelMailInput["refund"]) {
    const quote = checkout.quote!;
    const details = checkout.guestDetails;
    if (!details) return;
    const input: HotelMailInput = {
      to: details.contact.email,
      name: details.rooms[0]?.guests[0]?.firstName ?? "there",
      hotel: quote.hotel.name,
      city: quote.hotel.city,
      checkIn: quote.stay.checkIn,
      checkOut: quote.stay.checkOut,
      room: quote.room.roomName,
      rooms: quote.rooms.length,
      reference: booking.reference,
      confirmation,
      paid: payableOf(quote),
      refund,
      // Private link: opens the booking on any device, no sign-in needed.
      link: hotelBookingLink(booking),
    };
    this.mail.sendInBackground(outcome === "confirmed" ? hotelConfirmedEmail(input) : hotelFailedEmail(input), { template: `hotel-${outcome}`, userId: checkout.userId });
  }
}

export const hotelBookingLink = (booking: { id: string; reference: string }) =>
  `${frontendUrlFromEnv()}/booking/${booking.reference}?t=${bookingLinkToken("hotel", booking.id)}`;
