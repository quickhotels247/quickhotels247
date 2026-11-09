import { randomUUID } from "node:crypto";
import { Inject, Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import type { FlightBookingResult } from "@quickhotels/types/flight-checkout";
import { MailService } from "../../../mail/mail.service.js";
import { flightTicketPdf, type FlightTicketInput } from "../../../documents/flight-ticket.pdf.js";
import { flightConfirmedEmail, flightFailedEmail } from "../../../mail/templates/flight-booking.templates.js";
import { FLIGHT_SUPPLIER, type FlightSupplier, type SupplierFlightBooking } from "../../../suppliers/flight-supplier.js";
import { SupplierError } from "../../../suppliers/supplier-error.js";
import { bookingLinkToken } from "../../../common/utils/booking-links.js";
import { frontendUrlFromEnv } from "../../auth/auth.config.js";
import { CouponsService } from "../../coupons/coupons.service.js";
import { PaymentsService } from "../../payments/payments.service.js";
import { FlightReviewRepository, payableOf, type StoredFlightReview } from "../review/flight-review.repository.js";

// TripJack: ask for Booking Details 5 s after Book, then every 5 s for a while.
const FIRST_CHECK_MS = 5_000;
const CHECK_EVERY_MS = 5_000;
const CHECKS = 8;
// Statuses that mean no ticket will come.
const FAILED = new Set(["FAILED", "ABORTED", "CANCELLED", "UNCONFIRMED"]);
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// After payment (flights step F6): ticket with the supplier, then read the
// PNRs. Book is never sent twice for a booking; when its outcome is unclear
// (timeout), only Booking Details is asked. If no ticket comes, the payment is
// refunded in full and the customer told.
@Injectable()
export class FlightBookingService implements OnModuleInit {
  private readonly logger = new Logger(FlightBookingService.name);
  // Bookings being worked on in this process (no double polling).
  private readonly busy = new Set<string>();

  constructor(
    @Inject(FLIGHT_SUPPLIER) private readonly supplier: FlightSupplier,
    private readonly reviews: FlightReviewRepository,
    private readonly payments: PaymentsService,
    private readonly mail: MailService,
    private readonly coupons: CouponsService,
  ) {}

  onModuleInit() {
    this.payments.registerFulfiller("flight", (id) => this.fulfil(id));
  }

  // Payment captured: move payment → paid → booking (once), then Book.
  async fulfil(id: string): Promise<void> {
    if (await this.reviews.transition(id, ["payment", "travellers"], "paid")) {
      await this.recordCouponUse(id);
    } else {
      const current = await this.reviews.find(id);
      // Paid for a booking that can't continue (e.g. already failed): refund.
      if (current && current.status !== "paid") {
        if (current.status === "failed" && !current.booking?.refund) await this.fail(current, current.failureReason ?? "This booking couldn't continue.");
        return;
      }
    }
    if (!(await this.reviews.transition(id, ["paid"], "booking"))) return;
    const review = (await this.reviews.find(id))!;
    if (!review.travellerDetails) return this.fail(review, "Traveller details were missing.");
    const net = review.quote.markup?.net.amount ?? review.quote.price.total.amount;
    try {
      await this.supplier.bookFlights(review.supplierBookingId, net, review.travellerDetails, { correlationId: randomUUID() });
    } catch (error) {
      const definite = error instanceof SupplierError && (error.code === "BAD_REQUEST" || error.code === "SOLD_OUT");
      this.logger.warn(`Flight book for ${id} ${definite ? "rejected" : "unclear"}: ${(error as Error).message}`);
      if (definite) return this.fail(review, "The airline couldn't confirm these seats at this fare.");
      // Timeout or network: the booking may exist. Only ask, never book again.
      await this.reviews.saveBooking(id, "pending", this.result(review, { status: "PENDING", pnrs: [], tickets: [] }));
    }
    await pause(FIRST_CHECK_MS);
    await this.poll(id);
  }

  // A booking still "paid" (server restarted before Book) or "pending":
  // continue when the customer opens it (the reconciler also does, every minute).
  recover(review: StoredFlightReview): void {
    const quietFor = Date.now() - review.updatedAt.getTime();
    if ((review.status === "paid" && quietFor > 60_000) || (review.status === "pending" && quietFor > 20_000) || (review.status === "booking" && quietFor > 5 * 60_000)) {
      void this.resume(review).catch(() => undefined);
    }
  }

  // Moves a stuck paid booking on: Book if it never started; otherwise only
  // ask for its status (a "booking" left mid-Book may exist at the supplier).
  async resume(review: StoredFlightReview): Promise<void> {
    if (review.status === "paid") return this.fulfil(review.id);
    if (review.status === "booking" && !(await this.reviews.transition(review.id, ["booking"], "pending"))) return;
    if (review.status === "booking" || review.status === "pending") return this.poll(review.id, 1);
  }

  // Staff "Re-check with TripJack": moves a stuck booking on, or refreshes a
  // confirmed one's PNRs and tickets. Returns the supplier's status.
  async adminRecheck(id: string): Promise<string> {
    const review = await this.reviews.find(id);
    if (!review) return "UNKNOWN";
    if (review.status === "travellers" || review.status === "payment") return "NOT_PAID";
    if (review.status === "paid" || review.status === "booking" || review.status === "pending") {
      if (review.status === "booking") await this.reviews.transition(id, ["booking"], "pending");
      if (review.status === "paid") {
        await this.fulfil(id);
        return (await this.reviews.find(id))?.status.toUpperCase() ?? "UNKNOWN";
      }
      await this.poll(id, 1);
      return (await this.reviews.find(id))?.status.toUpperCase() ?? "UNKNOWN";
    }
    const state = await this.supplier.flightBooking(review.supplierBookingId, { correlationId: randomUUID() });
    if (review.status === "confirmed" && state.status === "SUCCESS") await this.reviews.saveBooking(id, "confirmed", { ...this.result(review, state), refund: review.booking?.refund ?? null });
    if (review.status === "failed" && state.status === "SUCCESS") {
      this.payments.alert(`Refunded booking is ticketed at TripJack (${review.supplierBookingId})`, [`We marked this booking failed and refunded it, but TripJack now reports SUCCESS.`], "Cancel it with TripJack, or charge the customer again.");
    }
    return state.status;
  }

  // Paid over 30 minutes ago and still no ticket: tell the team once.
  async alertSlow(review: StoredFlightReview): Promise<void> {
    await this.reviews.markAlerted(review.id);
    this.payments.alert(`Flight booking still pending (${review.supplierBookingId})`, [
      `Paid ${review.paidAt?.toISOString() ?? "earlier"} and TripJack hasn't confirmed tickets yet.`,
      `Customer: ${review.travellerDetails?.contact.email ?? "unknown"} · Paid ${payableOf(review.quote).amount} INR.`,
    ], "Check the booking with TripJack support; refund the customer if it can't be ticketed.");
  }

  private async poll(id: string, times = CHECKS): Promise<void> {
    if (this.busy.has(id)) return;
    this.busy.add(id);
    try {
      for (let i = 0; i < times; i++) {
        const review = await this.reviews.find(id);
        if (!review || review.status === "confirmed" || review.status === "failed") return;
        let state: SupplierFlightBooking;
        try {
          state = await this.supplier.flightBooking(review.supplierBookingId, { correlationId: randomUUID() });
        } catch (error) {
          this.logger.warn(`Booking details for ${id} failed: ${(error as Error).message}`);
          state = { status: "PENDING", pnrs: [], tickets: [] };
        }
        if (state.status === "SUCCESS") return this.confirm(review, state);
        if (FAILED.has(state.status)) return this.fail(review, "The airline couldn't issue the tickets.");
        await this.reviews.saveBooking(id, "pending", this.result(review, state));
        if (i < times - 1) await pause(CHECK_EVERY_MS);
      }
    } finally {
      this.busy.delete(id);
    }
  }

  private result(review: StoredFlightReview, state: SupplierFlightBooking, failureReason: string | null = null): FlightBookingResult {
    return { bookingId: review.supplierBookingId, pnrs: state.pnrs, tickets: state.tickets, failureReason, refund: review.booking?.refund ?? null };
  }

  private async confirm(review: StoredFlightReview, state: SupplierFlightBooking) {
    const booking = this.result(review, state);
    await this.reviews.saveBooking(review.id, "confirmed", booking);
    this.email(review, booking, "confirmed");
  }

  private async fail(review: StoredFlightReview, reason: string) {
    const payment = await this.payments.captured({ flightCheckoutId: review.id });
    const refund = await this.payments.refundAll({ flightCheckoutId: review.id }, reason);
    // Not booked: the coupon use no longer counts.
    if (payment) await this.coupons.releaseUse(payment.id).catch(() => undefined);
    const booking: FlightBookingResult = {
      ...this.result(review, { status: "FAILED", pnrs: [], tickets: [] }, reason),
      refund: refund ? { status: refund.status, amount: { amount: refund.amount, currency: refund.currency } } : null,
    };
    await this.reviews.saveBooking(review.id, "failed", booking, reason);
    this.email(review, booking, "failed");
    this.payments.alert(`Flight booking failed (${review.supplierBookingId})`, [
      `${reason}`,
      `Customer: ${review.travellerDetails?.contact.email ?? "unknown"} · Paid ${payableOf(review.quote).amount} INR.`,
      refund ? `Refund: ${refund.status} (${refund.amount} ${refund.currency}).` : "No captured payment found to refund.",
    ], refund?.status === "failed" ? "The refund failed: refund it from the Razorpay dashboard." : undefined);
  }

  private async recordCouponUse(id: string) {
    const review = await this.reviews.find(id);
    if (!review?.quote.coupon) return;
    const payment = await this.payments.captured({ flightCheckoutId: id });
    if (payment) await this.coupons.recordUse(review.quote.coupon, payment.id, review.userId).catch((error: Error) => this.logger.warn(`Coupon use for ${id} not recorded: ${error.message}`));
  }

  private email(review: StoredFlightReview, booking: FlightBookingResult, outcome: "confirmed" | "failed") {
    void this.sendEmail(review, booking, outcome).catch((error: Error) => this.logger.warn(`Flight ${outcome} email for ${review.id} failed: ${error.message}`));
  }

  private async sendEmail(review: StoredFlightReview, booking: FlightBookingResult, outcome: "confirmed" | "failed") {
    const details = review.travellerDetails;
    if (!details) return;
    // The e-ticket goes with the confirmation (the email still goes if the PDF fails).
    const ticket = outcome === "confirmed" ? await flightTicketPdf(ticketInputOf({ ...review, booking })!).catch(() => null) : null;
    const lead = details.travellers[0];
    const input = {
      to: details.contact.email,
      name: lead?.firstName ?? "there",
      journeys: review.quote.journeys,
      booking,
      paid: payableOf(review.quote),
      // Private link: opens the booking on any device, no sign-in needed.
      link: `${frontendUrlFromEnv()}/flights/booking/${review.id}?t=${bookingLinkToken("flight", review.id)}`,
    };
    const message = outcome === "confirmed" ? flightConfirmedEmail(input) : flightFailedEmail(input);
    if (ticket) message.attachments = [{ filename: `e-ticket-${booking.pnrs[0]?.pnr ?? booking.bookingId}.pdf`, contentType: "application/pdf", content: ticket }];
    this.mail.sendInBackground(message, { template: `flight-${outcome}`, userId: review.userId });
  }
}

// What the e-ticket shows, for a ticketed booking (else null).
export function ticketInputOf(review: Pick<StoredFlightReview, "quote" | "travellerDetails" | "booking">): FlightTicketInput | null {
  if (!review.booking || !review.travellerDetails) return null;
  return { journeys: review.quote.journeys, travellers: review.travellerDetails.travellers, contact: review.travellerDetails.contact, booking: review.booking, paid: payableOf(review.quote) };
}
