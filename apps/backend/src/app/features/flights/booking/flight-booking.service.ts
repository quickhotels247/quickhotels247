import { randomUUID } from "node:crypto";
import { Inject, Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import type { FlightBookingResult } from "@quickhotels/types/flight-checkout";
import { MailService } from "../../../mail/mail.service.js";
import { flightConfirmedEmail, flightFailedEmail } from "../../../mail/templates/flight-booking.templates.js";
import { FLIGHT_SUPPLIER, type FlightSupplier, type SupplierFlightBooking } from "../../../suppliers/flight-supplier.js";
import { SupplierError } from "../../../suppliers/supplier-error.js";
import { frontendUrlFromEnv } from "../../auth/auth.config.js";
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
  ) {}

  onModuleInit() {
    this.payments.registerFulfiller("flight", (id) => this.fulfil(id));
  }

  // Payment captured: move payment → paid → booking (once), then Book.
  async fulfil(id: string): Promise<void> {
    if (!(await this.reviews.transition(id, ["payment", "travellers"], "paid"))) {
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
  // continue when the customer opens it.
  recover(review: StoredFlightReview): void {
    const quietFor = Date.now() - review.updatedAt.getTime();
    if (review.status === "paid" && quietFor > 60_000) void this.fulfil(review.id).catch(() => undefined);
    if (review.status === "pending" && quietFor > 20_000) void this.poll(review.id, 1).catch(() => undefined);
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
    const refund = await this.payments.refundAll({ flightCheckoutId: review.id }, reason);
    const booking: FlightBookingResult = {
      ...this.result(review, { status: "FAILED", pnrs: [], tickets: [] }, reason),
      refund: refund ? { status: refund.status, amount: { amount: refund.amount, currency: refund.currency } } : null,
    };
    await this.reviews.saveBooking(review.id, "failed", booking, reason);
    this.email(review, booking, "failed");
  }

  private email(review: StoredFlightReview, booking: FlightBookingResult, outcome: "confirmed" | "failed") {
    const details = review.travellerDetails;
    if (!details) return;
    const lead = details.travellers[0];
    const input = {
      to: details.contact.email,
      name: lead?.firstName ?? "there",
      journeys: review.quote.journeys,
      booking,
      paid: payableOf(review.quote),
      link: `${frontendUrlFromEnv()}/flights/booking/${review.id}`,
    };
    this.mail.sendInBackground(outcome === "confirmed" ? flightConfirmedEmail(input) : flightFailedEmail(input), { template: `flight-${outcome}`, userId: review.userId });
  }
}
