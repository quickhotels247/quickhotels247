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

const WITH_BOOKING = { booking: { select: { id: true, reference: true } } } as const;

// What the customer pays: the rate minus any coupon.
export const payableOf = (quote: CheckoutQuote) => ({
  amount: Math.round((quote.room.totalPrice.amount - (quote.coupon?.discount.amount ?? 0)) * 100) / 100,
  currency: quote.room.totalPrice.currency,
});

export interface StoredCheckout {
  id: string;
  status: BookingStatus;
  userId: string | null;
  hotelId: string | null;
  supplierContext: unknown;
  // The booking made from this checkout once paid.
  booking: { id: string; reference: string } | null;
  updatedAt: Date;
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
    return this.toStored(await this.db.bookingAttempt.findUnique({ where: { idempotencyKey: keyHash }, include: WITH_BOOKING }));
  }

  async find(id: string): Promise<StoredCheckout | null> {
    return this.toStored(await this.db.bookingAttempt.findUnique({ where: { id }, include: WITH_BOOKING }));
  }

  // Moves the status only from one of `from` (false if another request moved
  // it first), with a history entry.
  async transition(id: string, from: BookingStatus[], to: BookingStatus, source: string, reason: string): Promise<boolean> {
    const current = await this.db.bookingAttempt.findUnique({ where: { id }, select: { status: true } });
    if (!current || !from.includes(current.status)) return false;
    const { count } = await this.db.bookingAttempt.updateMany({ where: { id, status: { in: from } }, data: { status: to } });
    if (count) await this.db.bookingStatusHistory.create({ data: { attemptId: id, fromStatus: current.status, toStatus: to, source, reason } });
    return count > 0;
  }

  async claim(id: string, userId: string) {
    await this.db.bookingAttempt.updateMany({ where: { id, userId: null }, data: { userId } });
  }

  async touch(id: string) {
    await this.db.bookingAttempt.update({ where: { id }, data: { updatedAt: new Date() } });
  }

  // Paid checkouts that stalled: paid but not booked for a minute, or waiting
  // on the hotel (checked every 30 s in the first hour, then every 10 min).
  async stuck(limit = 25): Promise<StoredCheckout[]> {
    const now = Date.now();
    const rows = await this.db.bookingAttempt.findMany({
      where: {
        OR: [
          { status: "PAYMENT_PENDING", updatedAt: { lt: new Date(now - 60_000) } },
          { status: "SUPPLIER_BOOKING_PENDING", updatedAt: { lt: new Date(now - 30_000) }, booking: { createdAt: { gte: new Date(now - 3600_000) } } },
          { status: "SUPPLIER_BOOKING_PENDING", updatedAt: { lt: new Date(now - 10 * 60_000) } },
        ],
      },
      include: WITH_BOOKING,
      orderBy: { updatedAt: "asc" },
      take: limit,
    });
    return rows.map((row) => this.toStored(row)!);
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

  private toStored(row: Prisma.BookingAttemptGetPayload<object> | null): StoredCheckout | null {
    if (!row) return null;
    return {
      id: row.id,
      status: row.status,
      userId: row.userId,
      hotelId: row.hotelId,
      supplierContext: row.supplierContext,
      booking: (row as { booking?: { id: string; reference: string } | null }).booking ?? null,
      updatedAt: row.updatedAt,
      accessTokenHash: row.accessTokenHash,
      expiresAt: row.expiresAt,
      quote: row.quote as CheckoutQuote | null,
      guestDetails: row.guestDetails as CheckoutGuestDetails | null,
      termsVersion: row.termsVersion,
    };
  }
}
