import type { AppliedCoupon } from "@quickhotels/types/coupons";
import type { AppliedMarkup } from "@quickhotels/types/pricing";
import { Injectable } from "@nestjs/common";
import type { CheckoutGuestDetails, CheckoutSummary } from "@quickhotels/types/checkout";
import { PrismaService } from "../../common/database/prisma.service.js";
import { BookingStatus, Prisma } from "../../../generated/prisma/client.js";

// The parts of a CheckoutSummary the server decides once, at review.
// What the customer sees, plus (server only) the net price and our markup.
export type CheckoutQuote = Pick<CheckoutSummary, "hotel" | "stay" | "nights" | "rooms" | "room" | "priceChange" | "requirements" | "policies"> & {
  markup?: AppliedMarkup;
  coupon?: AppliedCoupon | null;
};

// What the customer pays: the rate minus any coupon.
export const payableOf = (quote: CheckoutQuote) => ({
  amount: Math.round((quote.room.totalPrice.amount - (quote.coupon?.discount.amount ?? 0)) * 100) / 100,
  currency: quote.room.totalPrice.currency,
});

export interface StoredCheckout {
  id: string;
  status: BookingStatus;
  accessTokenHash: string | null;
  expiresAt: Date | null;
  quote: CheckoutQuote | null;
  guestDetails: CheckoutGuestDetails | null;
  termsVersion: string | null;
}

export interface NewCheckout {
  keyHash: string;
  searchSessionId: string;
  hotelId: string;
  optionId: string;
  status: BookingStatus;
  expiresAt: Date;
  quote: CheckoutQuote;
  supplierContext: unknown;
}

const json = (value: unknown) => (value == null ? Prisma.DbNull : (value as Prisma.InputJsonValue));

// Checkouts are booking attempts (spec §8) until payment turns them into bookings.
@Injectable()
export class CheckoutRepository {
  constructor(private readonly db: PrismaService) {}

  async findByKeyHash(keyHash: string): Promise<StoredCheckout | null> {
    return this.toStored(await this.db.bookingAttempt.findUnique({ where: { idempotencyKey: keyHash } }));
  }

  async find(id: string): Promise<StoredCheckout | null> {
    return this.toStored(await this.db.bookingAttempt.findUnique({ where: { id } }));
  }

  // Null when another request with the same key created it first.
  async create(checkout: NewCheckout): Promise<string | null> {
    try {
      const row = await this.db.bookingAttempt.create({
        data: {
          idempotencyKey: checkout.keyHash,
          accessTokenHash: checkout.keyHash,
          searchSessionId: checkout.searchSessionId,
          hotelId: checkout.hotelId,
          selectedRateReference: checkout.optionId,
          status: checkout.status,
          expiresAt: checkout.expiresAt,
          quote: json(checkout.quote),
          supplierContext: json(checkout.supplierContext),
          amount: checkout.quote.room.totalPrice.amount,
          currency: checkout.quote.room.totalPrice.currency,
          statusHistory: { create: { toStatus: checkout.status, source: "supplier", reason: "Rate reviewed with the supplier" } },
        },
        select: { id: true },
      });
      return row.id;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return null;
      throw error;
    }
  }

  // A coupon added or removed: new quote and amount to charge.
  async setQuote(id: string, quote: CheckoutQuote) {
    const payable = payableOf(quote);
    await this.db.bookingAttempt.update({ where: { id }, data: { quote: json(quote), amount: payable.amount, currency: payable.currency } });
  }

  async saveGuests(id: string, from: BookingStatus, details: CheckoutGuestDetails, termsVersion: string) {
    const to = BookingStatus.AWAITING_PAYMENT;
    await this.db.bookingAttempt.update({
      where: { id },
      data: {
        guestDetails: json(details),
        contactEmail: details.contact.email,
        contactPhone: `${details.contact.phoneCode} ${details.contact.phone}`,
        termsVersion,
        termsAcceptedAt: new Date(),
        status: to,
        ...(from !== to ? { statusHistory: { create: { fromStatus: from, toStatus: to, source: "customer", reason: "Guest details saved" } } } : {}),
      },
    });
  }

  private toStored(row: Awaited<ReturnType<PrismaService["bookingAttempt"]["findUnique"]>>): StoredCheckout | null {
    if (!row) return null;
    return {
      id: row.id,
      status: row.status,
      accessTokenHash: row.accessTokenHash,
      expiresAt: row.expiresAt,
      quote: row.quote as CheckoutQuote | null,
      guestDetails: row.guestDetails as CheckoutGuestDetails | null,
      termsVersion: row.termsVersion,
    };
  }
}
