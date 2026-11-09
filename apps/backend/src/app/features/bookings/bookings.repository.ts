import { Injectable } from "@nestjs/common";
import type { BookingsTab } from "@quickhotels/types/bookings";
import { PrismaService } from "../../common/database/prisma.service.js";
import { Prisma } from "../../../generated/prisma/client.js";
import { CANCELLED_STATUSES } from "./booking-status.js";

// Everything a booking page shows, in one query.
const DETAIL = {
  hotel: { select: { id: true, name: true, city: true, address: true, starRating: true, latitude: true, longitude: true, heroImageUrl: true } },
  rooms: { include: { guests: true }, orderBy: { id: "asc" } },
  priceSnapshot: true,
  payments: { orderBy: { createdAt: "desc" }, take: 1 },
  cancellations: { orderBy: { requestedAt: "desc" }, take: 1, include: { refunds: true } },
  statusHistory: { orderBy: { id: "asc" } },
} satisfies Prisma.BookingInclude;

const LIST = {
  hotel: { select: { id: true, name: true, city: true, heroImageUrl: true } },
  rooms: { select: { adults: true, childAges: true } },
} satisfies Prisma.BookingInclude;

export type BookingWithDetails = Prisma.BookingGetPayload<{ include: typeof DETAIL }>;
export type BookingForList = Prisma.BookingGetPayload<{ include: typeof LIST }>;

// Customers' bookings. Every query is limited to one owner (or one checkout).
@Injectable()
export class BookingsRepository {
  constructor(private readonly db: PrismaService) {}

  async list(userId: string, tab: BookingsTab, today: Date, search: string | undefined, page: number, pageSize: number) {
    const where: Prisma.BookingWhereInput = {
      userId,
      ...(tab === "cancelled"
        ? { status: { in: CANCELLED_STATUSES } }
        : { status: { notIn: CANCELLED_STATUSES }, checkOut: tab === "upcoming" ? { gte: today } : { lt: today } }),
      ...(search
        ? { OR: [{ reference: { contains: search, mode: "insensitive" } }, { hotel: { name: { contains: search, mode: "insensitive" } } }] }
        : {}),
    };
    // Upcoming: soonest first. Past and cancelled: most recent first.
    const orderBy: Prisma.BookingOrderByWithRelationInput[] =
      tab === "upcoming" ? [{ checkIn: "asc" }, { createdAt: "desc" }] : tab === "past" ? [{ checkIn: "desc" }] : [{ updatedAt: "desc" }];
    const [total, items] = await this.db.$transaction([
      this.db.booking.count({ where }),
      this.db.booking.findMany({ where, orderBy, include: LIST, skip: (page - 1) * pageSize, take: pageSize }),
    ]);
    return { total, items };
  }

  findForUser(reference: string, userId: string): Promise<BookingWithDetails | null> {
    return this.db.booking.findFirst({ where: { reference, userId }, include: DETAIL });
  }

  findByReference(reference: string): Promise<BookingWithDetails | null> {
    return this.db.booking.findUnique({ where: { reference }, include: DETAIL });
  }

  // A guest's booking, opened with the key of the checkout that made it.
  findForCheckout(reference: string, keyHash: string): Promise<BookingWithDetails | null> {
    return this.db.booking.findFirst({ where: { reference, attempt: { accessTokenHash: keyHash } }, include: DETAIL });
  }
}
