import { Injectable } from "@nestjs/common";
import type { AdminDashboard, DashboardAttentionItem, DashboardProductStats, DashboardRecentBooking } from "@quickhotels/types/admin";
import { PrismaService } from "../../../common/database/prisma.service.js";

// A paid hotel booking still unconfirmed after this long needs a person.
const URGENT_AFTER_MS = 30 * 60_000;
const ATTENTION_LIMIT = 25;
const RECENT_LIMIT = 8;

const num = (value: unknown) => Number(value ?? 0);
const round = (value: number) => Math.round(value * 100) / 100;

interface StatsRow {
  attempts: bigint;
  paid: bigint;
  confirmed: bigint;
  failed: bigint;
  cancelled: bigint;
  value: unknown;
  earnings: unknown;
}

const toStats = (row: StatsRow | undefined): DashboardProductStats => ({
  attempts: num(row?.attempts),
  paid: num(row?.paid),
  confirmed: num(row?.confirmed),
  failed: num(row?.failed),
  cancelled: num(row?.cancelled),
  bookingValue: round(num(row?.value)),
  earnings: round(num(row?.earnings)),
});

// The admin dashboard's numbers (spec §5.2). Every figure has one written
// definition (types/admin.ts and the page's notes); dates are India days.
@Injectable()
export class AdminDashboardRepository {
  constructor(private readonly db: PrismaService) {}

  async dashboard(from: string, to: string): Promise<AdminDashboard> {
    const start = new Date(`${from}T00:00:00+05:30`);
    const end = new Date(new Date(`${to}T00:00:00+05:30`).getTime() + 86_400_000);
    const [hotels, flights, money, trend, attention, recent, supplier] = await Promise.all([
      this.hotelStats(start, end),
      this.flightStats(start, end),
      this.money(start, end),
      this.trend(start, end, from, to),
      this.attention(),
      this.recent(),
      this.supplier(),
    ]);
    return { range: { from, to }, generatedAt: new Date().toISOString(), hotels, flights, money, trend, attention, recent, supplier };
  }

  // Hotels: a `bookings` row exists only once the customer has paid.
  private async hotelStats(start: Date, end: Date) {
    const [row] = await this.db.$queryRaw<StatsRow[]>`
      SELECT
        (SELECT count(*) FROM booking_attempts a WHERE a.created_at >= ${start} AND a.created_at < ${end} AND a.quote IS NOT NULL) AS attempts,
        count(b.id) AS paid,
        count(b.id) FILTER (WHERE b.confirmed_at IS NOT NULL) AS confirmed,
        count(b.id) FILTER (WHERE b.confirmed_at IS NULL AND b.status::text IN ('SUPPLIER_BOOKING_FAILED', 'REFUND_PENDING', 'REFUNDED', 'MANUAL_REVIEW', 'PAYMENT_FAILED')) AS failed,
        count(b.id) FILTER (WHERE b.confirmed_at IS NOT NULL AND b.status::text IN ('CANCELLATION_PENDING', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED')) AS cancelled,
        coalesce(sum(b.total_amount) FILTER (WHERE b.confirmed_at IS NOT NULL), 0) AS value,
        coalesce(sum(ps.customer_total - ps.supplier_amount) FILTER (WHERE b.status::text = 'CONFIRMED'), 0) AS earnings
      FROM bookings b
      LEFT JOIN booking_price_snapshots ps ON ps.booking_id = b.id
      WHERE b.created_at >= ${start} AND b.created_at < ${end}`;
    return toStats(row);
  }

  // Flights: one checkout row from review to ticket; `paid_at` once paid.
  private async flightStats(start: Date, end: Date) {
    const [row] = await this.db.$queryRaw<StatsRow[]>`
      SELECT
        count(*) FILTER (WHERE created_at >= ${start} AND created_at < ${end}) AS attempts,
        count(*) FILTER (WHERE paid_at >= ${start} AND paid_at < ${end}) AS paid,
        count(*) FILTER (WHERE paid_at >= ${start} AND paid_at < ${end} AND status = 'confirmed') AS confirmed,
        count(*) FILTER (WHERE paid_at >= ${start} AND paid_at < ${end} AND status = 'failed') AS failed,
        0::bigint AS cancelled,
        coalesce(sum(amount) FILTER (WHERE paid_at >= ${start} AND paid_at < ${end} AND status = 'confirmed'), 0) AS value,
        coalesce(sum(amount - (quote -> 'markup' -> 'net' ->> 'amount')::numeric)
          FILTER (WHERE paid_at >= ${start} AND paid_at < ${end} AND status = 'confirmed' AND quote -> 'markup' -> 'net' ->> 'amount' IS NOT NULL), 0) AS earnings
      FROM flight_checkouts
      WHERE (created_at >= ${start} AND created_at < ${end}) OR (paid_at >= ${start} AND paid_at < ${end})`;
    return toStats(row);
  }

  // Money in (captured payments) and out (refunds not failed), all products.
  private async money(start: Date, end: Date) {
    const [row] = await this.db.$queryRaw<{ collected: unknown; refunded: unknown }[]>`
      SELECT
        (SELECT coalesce(sum(amount), 0) FROM payments
          WHERE status::text IN ('CAPTURED', 'REFUNDED', 'PARTIALLY_REFUNDED') AND created_at >= ${start} AND created_at < ${end}) AS collected,
        (SELECT coalesce(sum(amount), 0) FROM refunds
          WHERE status::text <> 'FAILED' AND created_at >= ${start} AND created_at < ${end}) AS refunded`;
    return { collected: round(num(row?.collected)), refunded: round(num(row?.refunded)) };
  }

  // Paid bookings (hotels + flights) and their value per India day, every day present.
  private async trend(start: Date, end: Date, from: string, to: string) {
    const rows = await this.db.$queryRaw<{ day: string; bookings: bigint; value: unknown }[]>`
      SELECT to_char(day, 'YYYY-MM-DD') AS day, count(*) AS bookings, sum(amount) AS value
      FROM (
        SELECT (created_at AT TIME ZONE 'Asia/Kolkata')::date AS day, total_amount AS amount
          FROM bookings WHERE created_at >= ${start} AND created_at < ${end}
        UNION ALL
        SELECT (paid_at AT TIME ZONE 'Asia/Kolkata')::date AS day, amount
          FROM flight_checkouts WHERE paid_at >= ${start} AND paid_at < ${end}
      ) paid
      GROUP BY day ORDER BY day`;
    const byDay = new Map(rows.map((row) => [row.day, row]));
    const days: AdminDashboard["trend"] = [];
    for (let day = new Date(`${from}T00:00:00Z`); day.toISOString().slice(0, 10) <= to; day = new Date(day.getTime() + 86_400_000)) {
      const key = day.toISOString().slice(0, 10);
      const row = byDay.get(key);
      days.push({ date: key, bookings: num(row?.bookings), value: round(num(row?.value)) });
    }
    return days;
  }

  // Live work queue, oldest first within each kind; urgent items first overall.
  private async attention(): Promise<DashboardAttentionItem[]> {
    const now = Date.now();
    const [hotels, flights, refunds] = await Promise.all([
      this.db.booking.findMany({
        where: { status: { in: ["PAYMENT_PENDING", "SUPPLIER_BOOKING_PENDING", "CANCELLATION_PENDING", "REFUND_PENDING", "MANUAL_REVIEW"] } },
        select: { id: true, reference: true, status: true, totalAmount: true, updatedAt: true, createdAt: true, hotel: { select: { name: true } }, contactEmail: true },
        orderBy: { createdAt: "asc" },
        take: ATTENTION_LIMIT,
      }),
      this.db.flightCheckout.findMany({
        where: { status: { in: ["paid", "booking", "pending"] } },
        select: { id: true, supplierBookingId: true, amount: true, paidAt: true, updatedAt: true, quote: true, contactEmail: true },
        orderBy: { paidAt: "asc" },
        take: ATTENTION_LIMIT,
      }),
      this.db.refund.findMany({
        where: { status: "FAILED" },
        select: {
          id: true, amount: true, updatedAt: true,
          payment: { select: { bookingId: true, attemptId: true, flightCheckoutId: true, booking: { select: { id: true, reference: true } }, attempt: { select: { booking: { select: { id: true, reference: true } } } }, flightCheckout: { select: { id: true, supplierBookingId: true } } } },
        },
        orderBy: { updatedAt: "desc" },
        take: ATTENTION_LIMIT,
      }),
    ]);

    const items: DashboardAttentionItem[] = [];
    for (const row of hotels) {
      const waiting = row.status === "PAYMENT_PENDING" || row.status === "SUPPLIER_BOOKING_PENDING";
      const kind: DashboardAttentionItem["kind"] = waiting
        ? "awaiting_confirmation"
        : row.status === "CANCELLATION_PENDING" ? "cancellation_pending" : row.status === "REFUND_PENDING" ? "refund_pending" : "manual_review";
      const since = waiting ? row.createdAt : row.updatedAt;
      items.push({
        kind,
        product: "hotel",
        bookingId: row.id,
        reference: row.reference,
        title: row.hotel.name,
        detail: row.contactEmail,
        amount: round(Number(row.totalAmount)),
        since: since.toISOString(),
        urgent: kind === "manual_review" || (waiting && now - since.getTime() > URGENT_AFTER_MS),
      });
    }
    for (const row of flights) {
      const since = row.paidAt ?? row.updatedAt;
      items.push({
        kind: "awaiting_confirmation",
        product: "flight",
        bookingId: row.id,
        reference: row.supplierBookingId,
        title: flightTitle(row.quote),
        detail: row.contactEmail ?? "",
        amount: round(Number(row.amount)),
        since: since.toISOString(),
        urgent: now - since.getTime() > URGENT_AFTER_MS,
      });
    }
    for (const refund of refunds) {
      const hotel = refund.payment.booking ?? refund.payment.attempt?.booking ?? null;
      const flight = refund.payment.flightCheckout;
      if (!hotel && !flight) continue;
      items.push({
        kind: "refund_failed",
        product: hotel ? "hotel" : "flight",
        bookingId: hotel?.id ?? flight!.id,
        reference: hotel?.reference ?? flight!.supplierBookingId,
        title: "Refund failed",
        detail: "Refund the customer from the Razorpay dashboard, then note it on the booking.",
        amount: round(Number(refund.amount)),
        since: refund.updatedAt.toISOString(),
        urgent: true,
      });
    }
    return items.sort((a, b) => Number(b.urgent) - Number(a.urgent) || a.since.localeCompare(b.since)).slice(0, ATTENTION_LIMIT);
  }

  // The latest paid bookings across hotels and flights.
  private async recent(): Promise<DashboardRecentBooking[]> {
    const [hotels, flights] = await Promise.all([
      this.db.booking.findMany({
        select: { id: true, reference: true, status: true, totalAmount: true, createdAt: true, hotel: { select: { name: true } }, contactEmail: true },
        orderBy: { createdAt: "desc" },
        take: RECENT_LIMIT,
      }),
      this.db.flightCheckout.findMany({
        where: { paidAt: { not: null } },
        select: { id: true, supplierBookingId: true, status: true, amount: true, paidAt: true, quote: true, contactEmail: true },
        orderBy: { paidAt: "desc" },
        take: RECENT_LIMIT,
      }),
    ]);
    const list: DashboardRecentBooking[] = [
      ...hotels.map((row) => ({
        product: "hotel" as const,
        bookingId: row.id,
        reference: row.reference,
        title: row.hotel.name,
        customer: row.contactEmail,
        amount: round(Number(row.totalAmount)),
        status: row.status,
        paidAt: row.createdAt.toISOString(),
      })),
      ...flights.map((row) => ({
        product: "flight" as const,
        bookingId: row.id,
        reference: row.supplierBookingId,
        title: flightTitle(row.quote),
        customer: row.contactEmail,
        amount: round(Number(row.amount)),
        status: row.status,
        paidAt: row.paidAt!.toISOString(),
      })),
    ];
    return list.sort((a, b) => b.paidAt.localeCompare(a.paidAt)).slice(0, RECENT_LIMIT);
  }

  // TripJack health from our own call log (supplier_events), last 24 hours.
  private async supplier(): Promise<AdminDashboard["supplier"]> {
    const since = new Date(Date.now() - 86_400_000);
    const [row] = await this.db.$queryRaw<{ calls: bigint; failed: bigint; average: unknown }[]>`
      SELECT count(*) AS calls, count(*) FILTER (WHERE NOT success) AS failed, avg(duration_ms) AS average
      FROM supplier_events WHERE created_at >= ${since}`;
    const last = await this.db.supplierEvent.findFirst({
      where: { success: false, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true, operation: true, errorCode: true },
    });
    const calls = num(row?.calls);
    return {
      calls,
      failed: num(row?.failed),
      averageMs: calls ? Math.round(num(row?.average)) : null,
      lastFailureAt: last?.createdAt.toISOString() ?? null,
      lastFailure: last ? `${last.operation}${last.errorCode ? `: ${last.errorCode}` : ""}` : null,
    };
  }
}

// "HYD → DEL" (or "HYD → DEL → HYD" for a return) from a flight quote.
function flightTitle(quote: unknown): string {
  const journeys = (quote as { journeys?: { from?: string; to?: string }[] } | null)?.journeys ?? [];
  if (!journeys.length) return "Flight";
  return [journeys[0]!.from, ...journeys.map((leg) => leg.to)].filter(Boolean).join(" → ");
}
