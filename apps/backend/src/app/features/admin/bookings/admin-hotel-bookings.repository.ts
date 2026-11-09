import { Injectable } from "@nestjs/common";
import type { AdminHotelBooking, AdminHotelBookingList, AdminHotelBookingRow, AdminHotelFilter, AdminHotelStatus, AdminPayment } from "@quickhotels/types/admin";
import { PrismaService } from "../../../common/database/prisma.service.js";
import { BookingStatus, Prisma } from "../../../../generated/prisma/client.js";
import { displayStatus } from "../../bookings/booking-status.js";
import { policy as policyOf } from "../../bookings/booking.mapper.js";
import { cancelQuote } from "../../bookings/cancel-quote.js";

const PAGE_SIZE = 25;
const money = (amount: number, currency = "INR") => ({ amount: Math.round(amount * 100) / 100, currency });
const day = (date: Date) => date.toISOString().slice(0, 10);

// List tabs → booking states.
export const HOTEL_FILTERS: Record<Exclude<AdminHotelFilter, "all">, BookingStatus[]> = {
  processing: [BookingStatus.PAYMENT_PENDING, BookingStatus.SUPPLIER_BOOKING_PENDING],
  confirmed: [BookingStatus.CONFIRMED],
  cancelled: [BookingStatus.CANCELLATION_PENDING, BookingStatus.CANCELLED, BookingStatus.REFUND_PENDING, BookingStatus.REFUNDED],
  failed: [BookingStatus.SUPPLIER_BOOKING_FAILED, BookingStatus.MANUAL_REVIEW, BookingStatus.PAYMENT_FAILED],
};

const paymentInclude = { refunds: { orderBy: { createdAt: "asc" }, include: { initiatedByAdmin: { select: { name: true } } } } } as const;
const listInclude = {
  hotel: { select: { name: true, city: true, address: true } },
  rooms: { select: { roomName: true, mealPlan: true, adults: true, childAges: true, cancellationPolicy: true, guests: { orderBy: { isLead: "desc" } } }, orderBy: { id: "asc" } },
  payments: { orderBy: { createdAt: "asc" }, include: paymentInclude },
} satisfies Prisma.BookingInclude;
const detailInclude = {
  ...listInclude,
  priceSnapshot: true,
  attempt: { select: { supplierContext: true } },
  cancellations: { orderBy: { requestedAt: "desc" } },
  statusHistory: { orderBy: { id: "asc" } },
} satisfies Prisma.BookingInclude;
type ListRecord = Prisma.BookingGetPayload<{ include: typeof listInclude }>;
type PaymentRecord = ListRecord["payments"][number];

const toPayment = (row: PaymentRecord): AdminPayment => ({
  id: row.id,
  providerOrderId: row.providerOrderId,
  providerPaymentId: row.providerPaymentId,
  amount: money(Number(row.amount), row.currency),
  status: row.status,
  method: row.method,
  createdAt: row.createdAt.toISOString(),
  refunds: row.refunds.map((refund) => ({
    id: refund.id,
    amount: money(Number(refund.amount), refund.currency),
    status: refund.status,
    reason: refund.reason,
    providerRefundId: refund.providerRefundId,
    by: refund.initiatedByAdmin?.name ?? (refund.initiatedByAdminId ? "Admin" : "Automatic"),
    createdAt: refund.createdAt.toISOString(),
  })),
});

const captured = (row: ListRecord) => row.payments.find((payment) => ["CAPTURED", "REFUNDED", "PARTIALLY_REFUNDED"].includes(payment.status)) ?? row.payments.at(-1);

function toRow(row: ListRecord): AdminHotelBookingRow {
  const payment = captured(row);
  const refunded = payment?.refunds.filter((refund) => refund.status !== "FAILED").reduce((sum, refund) => sum + Number(refund.amount), 0) ?? 0;
  const lead = row.rooms[0]?.guests.find((guest) => guest.isLead) ?? row.rooms[0]?.guests[0];
  return {
    id: row.id,
    reference: row.reference,
    status: row.status as AdminHotelStatus,
    hotel: row.hotel.name,
    city: row.hotel.city,
    checkIn: day(row.checkIn),
    checkOut: day(row.checkOut),
    nights: Math.round((row.checkOut.getTime() - row.checkIn.getTime()) / 86_400_000),
    rooms: row.rooms.length,
    guests: row.rooms.reduce((sum, room) => sum + room.adults + room.childAges.length, 0),
    leadGuest: lead ? [lead.title, lead.firstName, lead.lastName].filter(Boolean).join(" ") : null,
    email: row.contactEmail,
    supplierConfirmation: row.supplierConfirmation,
    total: money(Number(row.totalAmount), row.currency),
    paymentStatus: payment?.status ?? null,
    refunded: refunded > 0 ? money(refunded, payment?.currency) : null,
    createdAt: row.createdAt.toISOString(),
  };
}

// Hotel bookings for staff: list with tabs and search, and one booking in full.
@Injectable()
export class AdminHotelBookingsRepository {
  constructor(private readonly db: PrismaService) {}

  async list(filter: AdminHotelFilter, query: string | undefined, page: number): Promise<AdminHotelBookingList> {
    const search: Prisma.BookingWhereInput = query
      ? {
          OR: [
            { reference: { contains: query, mode: "insensitive" } },
            { supplierConfirmation: { contains: query, mode: "insensitive" } },
            { contactEmail: { contains: query, mode: "insensitive" } },
            { contactPhone: { contains: query } },
            { hotel: { name: { contains: query, mode: "insensitive" } } },
            { guests: { some: { OR: [{ firstName: { contains: query, mode: "insensitive" } }, { lastName: { contains: query, mode: "insensitive" } }] } } },
          ],
        }
      : {};
    const where: Prisma.BookingWhereInput = { ...search, ...(filter === "all" ? {} : { status: { in: HOTEL_FILTERS[filter] } }) };
    const [rows, total, grouped] = await Promise.all([
      this.db.booking.findMany({ where, include: listInclude, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
      this.db.booking.count({ where }),
      this.db.booking.groupBy({ by: ["status"], where: search, _count: { _all: true } }),
    ]);
    const counts: AdminHotelBookingList["counts"] = { all: grouped.reduce((sum, group) => sum + group._count._all, 0) };
    for (const [key, statuses] of Object.entries(HOTEL_FILTERS)) {
      counts[key as AdminHotelFilter] = grouped.filter((group) => statuses.includes(group.status)).reduce((sum, group) => sum + group._count._all, 0);
    }
    return { items: rows.map(toRow), total, page, pageSize: PAGE_SIZE, counts };
  }

  async find(id: string): Promise<AdminHotelBooking | null> {
    const row = await this.db.booking.findUnique({ where: { id }, include: detailInclude });
    if (!row) return null;
    const base = toRow(row);
    const snapshot = row.priceSnapshot;
    const currency = row.currency;
    const net = snapshot ? Number(snapshot.supplierAmount) : null;
    const policy = policyOf(row.rooms[0]?.cancellationPolicy, currency);
    const payment = captured(row);
    const paid = payment ? money(Number(payment.amount), payment.currency) : base.total;
    const quote = cancelQuote({ status: displayStatus(row.status), checkIn: base.checkIn, paid, policy });
    return {
      ...base,
      phone: row.contactPhone,
      address: row.hotel.address,
      supplier: row.supplier,
      supplierBookingId: (row.attempt?.supplierContext as { bookingId?: string } | null)?.bookingId ?? null,
      checkoutId: row.attemptId,
      roomsBooked: row.rooms.map((room) => ({
        name: room.roomName,
        mealPlan: room.mealPlan,
        guests: room.guests.map((guest) => `${[guest.title, guest.firstName, guest.lastName].filter(Boolean).join(" ")}${guest.type === "CHILD" ? ` (child${guest.age != null ? `, ${guest.age}` : ""})` : ""}${guest.isLead ? " · lead" : ""}`),
      })),
      specialRequests: row.specialRequests,
      money: {
        customerTotal: base.total,
        coupon: snapshot?.couponCode ? { code: snapshot.couponCode, discount: money(Number(snapshot.discount), currency) } : null,
        supplierNet: net == null ? null : money(net, currency),
        markup: snapshot ? money(Number(snapshot.markup), currency) : null,
        margin: net == null ? null : money(base.total.amount - net, currency),
        ruleVersion: snapshot?.pricingRuleVersion ?? null,
      },
      policy,
      cancelQuote: quote,
      cancellations: row.cancellations.map((item) => ({
        status: item.status,
        fee: item.penaltyAmount == null ? null : money(Number(item.penaltyAmount), item.currency ?? currency),
        refundEstimate: item.refundEstimate == null ? null : money(Number(item.refundEstimate), item.currency ?? currency),
        reason: item.reason,
        requestedBy: item.requestedBy,
        requestedAt: item.requestedAt.toISOString(),
        completedAt: item.completedAt?.toISOString() ?? null,
      })),
      payments: row.payments.map(toPayment),
      history: row.statusHistory.map((entry) => ({ from: entry.fromStatus, to: entry.toStatus, source: entry.source, reason: entry.reason, at: entry.createdAt.toISOString() })),
      confirmedAt: row.confirmedAt?.toISOString() ?? null,
      cancelledAt: row.cancelledAt?.toISOString() ?? null,
      opsAlertedAt: row.opsAlertedAt?.toISOString() ?? null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
