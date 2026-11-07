import type { AppliedCoupon } from "@quickhotels/types/coupons";
import type { AppliedMarkup } from "@quickhotels/types/pricing";
import { Injectable } from "@nestjs/common";
import type { FlightBookingResult, FlightReviewSummary, FlightTravellerDetails } from "@quickhotels/types/flight-checkout";
import { PrismaService } from "../../../common/database/prisma.service.js";
import { Prisma } from "../../../../generated/prisma/client.js";

// The parts of a review summary the server decides at review time.
// What the customer sees, plus (server only) the net price and our markup.
export type FlightQuote = Omit<FlightReviewSummary, "reviewId" | "status" | "expiresAt" | "termsVersion" | "travellerDetails" | "coupon" | "payable" | "booking"> & {
  markup?: AppliedMarkup;
  coupon?: AppliedCoupon | null;
};

// What the customer pays: the fare minus any coupon.
export const payableOf = (quote: FlightQuote) => ({
  amount: Math.round((quote.price.total.amount - (quote.coupon?.discount.amount ?? 0)) * 100) / 100,
  currency: quote.price.total.currency,
});

// Status on the row: travellers → payment → paid → booking → confirmed;
// "pending" while the airline is still ticketing; "failed" (refunded).
export interface StoredFlightReview {
  id: string;
  keyHash: string;
  status: string;
  userId: string | null;
  supplierBookingId: string;
  quote: FlightQuote;
  travellerDetails: FlightTravellerDetails | null;
  booking: FlightBookingResult | null;
  failureReason: string | null;
  expiresAt: Date;
  updatedAt: Date;
}

export interface NewFlightReview {
  keyHash: string;
  searchSessionId: string;
  supplier: string;
  supplierBookingId: string;
  quote: FlightQuote;
  expiresAt: Date;
}

type Row = {
  id: string;
  keyHash: string;
  status: string;
  userId: string | null;
  supplierBookingId: string;
  quote: unknown;
  travellers: unknown;
  bookingResult: unknown;
  failureReason: string | null;
  expiresAt: Date;
  updatedAt: Date;
};

const toStored = (row: Row): StoredFlightReview => ({
  id: row.id,
  keyHash: row.keyHash,
  status: row.status,
  supplierBookingId: row.supplierBookingId,
  quote: row.quote as FlightQuote,
  travellerDetails: (row.travellers as FlightTravellerDetails | null) ?? null,
  userId: row.userId,
  booking: (row.bookingResult as FlightBookingResult | null) ?? null,
  failureReason: row.failureReason,
  expiresAt: row.expiresAt,
  updatedAt: row.updatedAt,
});

// Flight checkouts, from the fare review on (flight_checkouts).
@Injectable()
export class FlightReviewRepository {
  constructor(private readonly db: PrismaService) {}

  async findByKeyHash(keyHash: string) {
    const row = await this.db.flightCheckout.findUnique({ where: { keyHash } });
    return row && toStored(row);
  }

  async find(id: string) {
    const row = await this.db.flightCheckout.findUnique({ where: { id } });
    return row && toStored(row);
  }

  // Moves the status only from one of `from`; false if another request moved it first.
  async transition(id: string, from: string[], to: string): Promise<boolean> {
    const { count } = await this.db.flightCheckout.updateMany({ where: { id, status: { in: from } }, data: { status: to } });
    return count > 0;
  }

  async saveBooking(id: string, status: "confirmed" | "pending" | "failed", booking: FlightBookingResult, failureReason: string | null = null) {
    await this.db.flightCheckout.update({
      where: { id },
      data: {
        status,
        bookingResult: booking as unknown as Prisma.InputJsonValue,
        failureReason,
        ...(status === "confirmed" ? { bookedAt: new Date() } : {}),
      },
    });
  }

  // Touch the row (the last time the supplier was asked), without changes.
  async touch(id: string) {
    await this.db.flightCheckout.update({ where: { id }, data: { updatedAt: new Date() } });
  }

  // A coupon added or removed: new quote and amount to charge.
  async setQuote(id: string, quote: FlightQuote) {
    const payable = payableOf(quote);
    await this.db.flightCheckout.update({ where: { id }, data: { quote: quote as unknown as Prisma.InputJsonValue, amount: payable.amount, currency: payable.currency } });
  }

  // Travellers and contact, ready for payment (step F6).
  async saveTravellers(id: string, details: FlightTravellerDetails, termsVersion: string) {
    await this.db.flightCheckout.update({
      where: { id },
      data: {
        travellers: details as unknown as Prisma.InputJsonValue,
        contactEmail: details.contact.email,
        contactPhone: `${details.contact.phoneCode} ${details.contact.phone}`,
        termsVersion,
        termsAcceptedAt: new Date(),
        status: "payment",
      },
    });
  }

  // Null when another request with the same key created it first.
  async create(review: NewFlightReview): Promise<string | null> {
    try {
      const row = await this.db.flightCheckout.create({
        data: {
          keyHash: review.keyHash,
          searchSessionId: review.searchSessionId,
          supplier: review.supplier,
          supplierBookingId: review.supplierBookingId,
          quote: review.quote as unknown as Prisma.InputJsonValue,
          amount: review.quote.price.total.amount,
          currency: review.quote.price.total.currency,
          expiresAt: review.expiresAt,
        },
        select: { id: true },
      });
      return row.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return null;
      throw error;
    }
  }
}
