import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/database/prisma.service.js";
import { Prisma } from "../../../../generated/prisma/client.js";

// Bookings that still need the customer: an upcoming stay, or money or a
// supplier booking still in progress.
const OPEN_STATUSES = ["PAYMENT_PENDING", "SUPPLIER_BOOKING_PENDING", "CONFIRMED", "CANCELLATION_PENDING", "REFUND_PENDING"] as const;

@Injectable()
export class AccountDeletionRepository {
  constructor(private readonly db: PrismaService) {}

  async hasOpenBookings(userId: string): Promise<boolean> {
    const today = new Date(new Date().toISOString().slice(0, 10));
    const [booking, attempt] = await Promise.all([
      this.db.booking.findFirst({
        where: {
          userId,
          OR: [
            { status: { in: ["CONFIRMED"] }, checkIn: { gte: today } },
            { status: { in: OPEN_STATUSES.filter((status) => status !== "CONFIRMED") } },
          ],
        },
        select: { id: true },
      }),
      this.db.bookingAttempt.findFirst({
        where: { userId, status: { in: ["PAYMENT_PENDING", "SUPPLIER_BOOKING_PENDING"] } },
        select: { id: true },
      }),
    ]);
    return Boolean(booking || attempt);
  }

  // Closes the account. The user row stays, with personal details removed, so
  // past bookings and invoices keep their owner for accounting; the email and
  // username become free again. Sessions, Google links, saved travellers and saved hotels go.
  async anonymise(userId: string): Promise<void> {
    const short = userId.replace(/-/g, "").slice(0, 12);
    await this.db.$transaction([
      this.db.authToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
      this.db.userIdentity.deleteMany({ where: { userId } }),
      this.db.savedTraveller.deleteMany({ where: { userId } }),
      this.db.savedHotel.deleteMany({ where: { userId } }),
      this.db.user.update({
        where: { id: userId },
        data: {
          firstName: "Deleted",
          lastName: "user",
          email: `deleted-${short}@deleted.invalid`,
          username: `deleted-${short}`,
          phone: null,
          dateOfBirth: null,
          nationality: null,
          gender: null,
          address: Prisma.DbNull,
          passwordHash: null,
          clerkUserId: null,
          isLoggedIn: false,
          workspace: null,
          status: "DELETED",
        },
      }),
    ]);
  }
}
