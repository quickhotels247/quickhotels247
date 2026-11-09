import { Injectable } from "@nestjs/common";
import type {
  AdminFlightBooking,
  AdminFlightBookingList,
  AdminFlightBookingRow,
  AdminFlightStatus,
  AdminPayment,
  AdminPaymentList,
} from "@quickhotels/types/admin";
import type { FlightBookingResult, FlightTravellerDetails } from "@quickhotels/types/flight-checkout";
import { PrismaService } from "../../../common/database/prisma.service.js";
import { Prisma } from "../../../../generated/prisma/client.js";
import { payableOf, type FlightQuote } from "../../flights/review/flight-review.repository.js";

const PAGE_SIZE = 25;
const PAID: AdminFlightStatus[] = ["paid", "booking", "pending", "confirmed", "failed"];
const money = (amount: number, currency = "INR") => ({ amount: Math.round(amount * 100) / 100, currency });

const paymentInclude = { refunds: { orderBy: { createdAt: "asc" }, include: { initiatedByAdmin: { select: { name: true } } } } } as const;
type PaymentRecord = Prisma.PaymentGetPayload<{ include: typeof paymentInclude }>;
const flightInclude = { payments: { orderBy: { createdAt: "asc" }, include: paymentInclude } } as const;
type FlightRecord = Prisma.FlightCheckoutGetPayload<{ include: typeof flightInclude }>;

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

function toRow(row: FlightRecord): AdminFlightBookingRow {
  const quote = row.quote as unknown as FlightQuote;
  const details = row.travellers as FlightTravellerDetails | null;
  const booking = row.bookingResult as FlightBookingResult | null;
  const captured = row.payments.find((payment) => ["CAPTURED", "REFUNDED", "PARTIALLY_REFUNDED"].includes(payment.status)) ?? row.payments.at(-1);
  const refunded = captured?.refunds.filter((refund) => refund.status !== "FAILED").reduce((sum, refund) => sum + Number(refund.amount), 0) ?? 0;
  const lead = details?.travellers[0];
  return {
    id: row.id,
    status: row.status as AdminFlightStatus,
    route: quote.journeys.map((leg) => `${leg.from} → ${leg.to}`).join(", "),
    departAt: quote.journeys[0]?.departAt ?? null,
    leadTraveller: lead ? `${lead.title} ${lead.firstName} ${lead.lastName}` : null,
    travellers: quote.criteria.adults + quote.criteria.children + quote.criteria.infants,
    email: row.contactEmail,
    pnrs: [...new Set(booking?.pnrs.map((item) => item.pnr) ?? [])],
    supplierBookingId: row.supplierBookingId,
    payable: payableOf(quote),
    paymentStatus: captured?.status ?? null,
    refunded: refunded > 0 ? money(refunded, captured?.currency) : null,
    createdAt: row.createdAt.toISOString(),
    paidAt: row.paidAt?.toISOString() ?? null,
  };
}

@Injectable()
export class AdminBookingsRepository {
  constructor(private readonly db: PrismaService) {}

  // Ids whose PNRs/tickets or traveller names contain the text (JSON columns).
  private async idsMatchingJson(query: string): Promise<string[]> {
    const pattern = `%${query.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
    const rows = await this.db.$queryRaw<{ id: string }[]>`
      SELECT id FROM flight_checkouts
      WHERE booking_result::text ILIKE ${pattern} OR travellers::text ILIKE ${pattern}
      LIMIT 200`;
    return rows.map((row) => row.id);
  }

  async flights(filter: string | undefined, query: string | undefined, page: number): Promise<AdminFlightBookingList> {
    const statusWhere: Prisma.FlightCheckoutWhereInput =
      !filter || filter === "all"
        ? { status: { in: PAID } }
        : filter === "unpaid"
          ? { status: { in: ["travellers", "payment"] } }
          : filter === "processing"
            ? { status: { in: ["paid", "booking", "pending"] } }
            : { status: filter };
    const jsonIds = query ? await this.idsMatchingJson(query) : [];
    const search: Prisma.FlightCheckoutWhereInput = query
      ? {
          OR: [
            { supplierBookingId: { contains: query, mode: "insensitive" } },
            { contactEmail: { contains: query, mode: "insensitive" } },
            { contactPhone: { contains: query } },
            // PNRs and names live in JSON columns.
            ...(jsonIds.length ? [{ id: { in: jsonIds } }] : []),
            ...(/^[0-9a-f-]{36}$/i.test(query) ? [{ id: query }] : []),
          ],
        }
      : {};
    const [rows, total, grouped] = await Promise.all([
      this.db.flightCheckout.findMany({ where: { ...search, ...statusWhere }, include: flightInclude, orderBy: [{ paidAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
      this.db.flightCheckout.count({ where: { ...search, ...statusWhere } }),
      this.db.flightCheckout.groupBy({ by: ["status"], where: search, _count: { _all: true } }),
    ]);
    return {
      items: rows.map(toRow),
      total,
      page,
      pageSize: PAGE_SIZE,
      counts: Object.fromEntries(grouped.map((group) => [group.status, group._count._all])),
    };
  }

  async flight(id: string): Promise<AdminFlightBooking | null> {
    const row = await this.db.flightCheckout.findUnique({ where: { id }, include: flightInclude });
    if (!row) return null;
    const quote = row.quote as unknown as FlightQuote;
    const details = row.travellers as FlightTravellerDetails | null;
    const booking = row.bookingResult as FlightBookingResult | null;
    const payable = payableOf(quote);
    const net = quote.markup?.net ?? null;
    return {
      ...toRow(row),
      journeys: quote.journeys.map((leg) => ({
        from: leg.from,
        to: leg.to,
        departAt: leg.departAt,
        arriveAt: leg.arriveAt,
        flights: leg.segments.map((segment) => segment.flightNumber),
        airlines: [...new Set(leg.segments.map((segment) => segment.airlineName))].join(", "),
      })),
      travellerList: details?.travellers.map((traveller) => ({ name: `${traveller.title} ${traveller.firstName} ${traveller.lastName}`, type: traveller.type, dateOfBirth: traveller.dateOfBirth ?? null })) ?? [],
      phone: row.contactPhone,
      tickets: booking?.tickets ?? [],
      failureReason: row.failureReason,
      money: {
        fare: quote.price.total,
        coupon: quote.coupon ? { code: quote.coupon.code, discount: quote.coupon.discount } : null,
        payable,
        supplierNet: net,
        margin: net ? money(payable.amount - net.amount, payable.currency) : null,
        markupRule: quote.markup?.ruleId ? { id: quote.markup.ruleId, version: quote.markup.ruleVersion ?? 1 } : null,
      },
      payments: row.payments.map(toPayment),
      bookedAt: row.bookedAt?.toISOString() ?? null,
      opsAlertedAt: row.opsAlertedAt?.toISOString() ?? null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async payments(status: string | undefined, query: string | undefined, page: number): Promise<AdminPaymentList> {
    const search: Prisma.PaymentWhereInput = query
      ? { OR: [{ providerOrderId: { contains: query } }, { providerPaymentId: { contains: query } }, { flightCheckout: { contactEmail: { contains: query, mode: "insensitive" } } }] }
      : {};
    const where: Prisma.PaymentWhereInput = { ...search, ...(status ? { status: status as PaymentRecord["status"] } : {}) };
    const [rows, total, grouped] = await Promise.all([
      this.db.payment.findMany({ where, include: { ...paymentInclude, flightCheckout: { select: { contactEmail: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
      this.db.payment.count({ where }),
      this.db.payment.groupBy({ by: ["status"], where: search, _count: { _all: true } }),
    ]);
    return {
      items: rows.map((row) => ({ ...toPayment(row), flightBookingId: row.flightCheckoutId, hotelCheckoutId: row.attemptId, email: row.flightCheckout?.contactEmail ?? null })),
      total,
      page,
      pageSize: PAGE_SIZE,
      counts: Object.fromEntries(grouped.map((group) => [group.status, group._count._all])),
    };
  }
}
