import { randomInt } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/database/prisma.service.js";
import { BookingStatus, Prisma } from "../../../../generated/prisma/client.js";
import { payableOf, type StoredCheckout } from "../checkout.repository.js";

// No 0/O or 1/I, so references read clearly over the phone.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const newReference = () => `QH-${Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("")}`;
const day = (value: string) => new Date(`${value}T00:00:00Z`);

export interface StoredHotelBooking {
  id: string;
  reference: string;
  status: BookingStatus;
  createdAt: Date;
  opsAlertedAt: Date | null;
}

// Hotel bookings made from paid checkouts (what My bookings and the
// confirmation page show), with their status history.
@Injectable()
export class HotelBookingsRepository {
  constructor(private readonly db: PrismaService) {}

  findForCheckout(attemptId: string): Promise<StoredHotelBooking | null> {
    return this.db.booking.findUnique({ where: { attemptId }, select: { id: true, reference: true, status: true, createdAt: true, opsAlertedAt: true } });
  }

  findByReference(reference: string) {
    return this.db.booking.findUnique({ where: { reference }, select: { id: true, reference: true, attemptId: true } });
  }

  // The booking for a paid checkout: rooms and guests as entered, the price
  // (net, markup, coupon) and the cancellation policy as sold. Once per
  // checkout; the payment and coupon use are linked to it.
  async createFromCheckout(checkout: StoredCheckout, supplier: string, paymentId: string | null): Promise<StoredHotelBooking> {
    const existing = await this.findForCheckout(checkout.id);
    if (existing) return existing;
    const quote = checkout.quote!;
    const details = checkout.guestDetails!;
    const payable = payableOf(quote);
    const room = quote.room;
    const policy = {
      refundable: room.freeCancellation,
      freeCancellationUntil: room.freeCancellationUntil,
      charges: room.cancellationCharges.map((charge) => ({ from: charge.from, to: charge.to, amount: charge.amount })),
    };
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.db.$transaction(async (tx) => {
          const booking = await tx.booking.create({
            data: {
              reference: newReference(),
              userId: checkout.userId,
              attemptId: checkout.id,
              supplier,
              hotelId: checkout.hotelId!,
              status: BookingStatus.PAYMENT_PENDING,
              checkIn: day(quote.stay.checkIn),
              checkOut: day(quote.stay.checkOut),
              currency: payable.currency,
              totalAmount: payable.amount,
              contactEmail: details.contact.email,
              contactPhone: `${details.contact.phoneCode} ${details.contact.phone}`,
              specialRequests: details.specialRequests ?? null,
              termsVersion: checkout.termsVersion,
              priceSnapshot: {
                create: {
                  supplierAmount: quote.markup?.net.amount ?? room.totalPrice.amount,
                  taxes: room.priceBreakup.taxes,
                  markup: quote.markup?.markup.amount ?? 0,
                  discount: quote.coupon?.discount.amount ?? 0,
                  customerTotal: payable.amount,
                  currency: payable.currency,
                  pricingRuleVersion: quote.markup?.ruleVersion ?? null,
                  couponCode: quote.coupon?.code ?? null,
                },
              },
              statusHistory: { create: { toStatus: BookingStatus.PAYMENT_PENDING, source: "payment", reason: "Payment received" } },
            },
            select: { id: true, reference: true, status: true, createdAt: true, opsAlertedAt: true },
          });
          for (const [r, roomGuests] of quote.rooms.entries()) {
            const created = await tx.bookingRoom.create({
              data: {
                bookingId: booking.id,
                roomName: room.roomName,
                mealPlan: room.mealPlan,
                adults: roomGuests.adults,
                childAges: roomGuests.childAges,
                rateSnapshot: room as unknown as Prisma.InputJsonValue,
                cancellationPolicy: policy as unknown as Prisma.InputJsonValue,
              },
              select: { id: true },
            });
            const guests = details.rooms[r]?.guests ?? [];
            await tx.bookingGuest.createMany({
              data: guests.map((guest, g) => ({
                bookingId: booking.id,
                roomId: created.id,
                title: guest.title,
                firstName: guest.firstName,
                lastName: guest.lastName,
                type: g >= roomGuests.adults ? "CHILD" : "ADULT",
                age: g >= roomGuests.adults ? (roomGuests.childAges[g - roomGuests.adults] ?? null) : null,
                isLead: g === 0,
              })),
            });
          }
          if (paymentId) {
            await tx.payment.update({ where: { id: paymentId }, data: { bookingId: booking.id } });
            await tx.couponRedemption.updateMany({ where: { paymentId }, data: { bookingId: booking.id } });
          }
          return booking;
        });
      } catch (error) {
        // Another worker created it, or the reference clashed: look again / retry.
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const made = await this.findForCheckout(checkout.id);
          if (made) return made;
          if (attempt < 4) continue;
        }
        throw error;
      }
    }
  }

  async setStatus(id: string, to: BookingStatus, source: string, reason: string, data: Prisma.BookingUpdateInput = {}) {
    const current = await this.db.booking.findUnique({ where: { id }, select: { status: true } });
    await this.db.booking.update({ where: { id }, data: { ...data, status: to, statusHistory: { create: { fromStatus: current?.status ?? null, toStatus: to, source, reason } } } });
  }

  // Paid over 30 minutes ago and still not confirmed; staff not told yet.
  slowToTell() {
    return this.db.booking.findMany({
      where: { status: { in: [BookingStatus.PAYMENT_PENDING, BookingStatus.SUPPLIER_BOOKING_PENDING] }, createdAt: { lt: new Date(Date.now() - 30 * 60_000) }, opsAlertedAt: null },
      select: { id: true, reference: true, attemptId: true, contactEmail: true, totalAmount: true, currency: true },
      take: 10,
    });
  }

  async markAlerted(id: string) {
    await this.db.booking.update({ where: { id }, data: { opsAlertedAt: new Date() } });
  }
}
