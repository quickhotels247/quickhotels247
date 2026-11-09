import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/database/prisma.service.js";
import { BookingStatus, CancellationStatus, Prisma } from "../../../../generated/prisma/client.js";

const CONTEXT = {
  id: true,
  reference: true,
  status: true,
  userId: true,
  attemptId: true,
  contactEmail: true,
  checkIn: true,
  checkOut: true,
  rooms: { select: { roomName: true, guests: { where: { isLead: true }, select: { firstName: true }, take: 1 } }, take: 1 },
  hotel: { select: { name: true, city: true } },
  attempt: { select: { supplierContext: true } },
  cancellations: { orderBy: { requestedAt: "desc" }, take: 1 },
} satisfies Prisma.BookingSelect;

export type CancellationContext = Prisma.BookingGetPayload<{ select: typeof CONTEXT }>;

// Hotel cancellations: the request, its status, and the booking's status
// moving with it (with history).
@Injectable()
export class HotelCancellationsRepository {
  constructor(private readonly db: PrismaService) {}

  find(bookingId: string): Promise<CancellationContext | null> {
    return this.db.booking.findUnique({ where: { id: bookingId }, select: CONTEXT });
  }

  // CONFIRMED → CANCELLATION_PENDING and a cancellation request, once.
  // Null when the booking isn't confirmed any more (e.g. a second click).
  async start(bookingId: string, quote: { fee: number; refund: number; currency: string }, reason: string | null, requestedBy: "customer" | "admin"): Promise<string | null> {
    return this.db.$transaction(async (tx) => {
      const { count } = await tx.booking.updateMany({ where: { id: bookingId, status: BookingStatus.CONFIRMED }, data: { status: BookingStatus.CANCELLATION_PENDING } });
      if (!count) return null;
      await tx.bookingStatusHistory.create({ data: { bookingId, fromStatus: BookingStatus.CONFIRMED, toStatus: BookingStatus.CANCELLATION_PENDING, source: requestedBy, reason: reason ?? "Cancellation requested" } });
      const cancellation = await tx.cancellation.create({
        data: { bookingId, penaltyAmount: quote.fee, refundEstimate: quote.refund, currency: quote.currency, reason, requestedBy },
        select: { id: true },
      });
      return cancellation.id;
    });
  }

  async setCancellation(id: string, status: CancellationStatus, supplierResponse?: unknown) {
    const done = status === "CONFIRMED" || status === "REJECTED" || status === "FAILED";
    await this.db.cancellation.update({
      where: { id },
      data: { status, ...(done ? { completedAt: new Date() } : {}), ...(supplierResponse === undefined ? {} : { supplierResponse: supplierResponse as Prisma.InputJsonValue }) },
    });
  }

  async setBooking(id: string, to: BookingStatus, source: string, reason: string, data: Prisma.BookingUpdateInput = {}) {
    const current = await this.db.booking.findUnique({ where: { id }, select: { status: true } });
    await this.db.booking.update({ where: { id }, data: { ...data, status: to, statusHistory: { create: { fromStatus: current?.status ?? null, toStatus: to, source, reason } } } });
  }

  async touch(id: string) {
    await this.db.booking.update({ where: { id }, data: { updatedAt: new Date() } });
  }

  // Cancellations the supplier is still handling, not checked for an hour.
  waiting(limit = 20) {
    return this.db.booking.findMany({
      where: { status: BookingStatus.CANCELLATION_PENDING, updatedAt: { lt: new Date(Date.now() - 3600_000) } },
      select: { id: true },
      take: limit,
    });
  }
}
