import { Injectable } from "@nestjs/common";
import type { Coupon, CouponInput, CouponRedemptionRow, CouponReport, PublicOffer } from "@quickhotels/types/coupons";
import { PrismaService } from "../../common/database/prisma.service.js";
import type { Coupon as CouponRecord } from "../../../generated/prisma/client.js";
import type { CouponTerms } from "./coupon-rules.js";

const num = (value: { toString(): string } | null) => (value === null ? null : Number(value));
const day = (value: string, endOfDay: boolean) => new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}+05:30`);

export const toTerms = (row: CouponRecord): CouponTerms => ({
  status: row.status,
  product: row.product,
  discountType: row.discountType,
  value: Number(row.value),
  maxDiscount: num(row.maxDiscount),
  minBookingAmount: num(row.minBookingAmount),
  validFrom: row.validFrom,
  validTo: row.validTo,
  usageLimit: row.usageLimit,
  perUserLimit: row.perUserLimit,
  eligibleDestinations: row.eligibleDestinations,
});

// India dates (validity is by Indian calendar day).
const indiaDay = (date: Date) => new Date(date.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10);

@Injectable()
export class CouponsRepository {
  constructor(private readonly db: PrismaService) {}

  findByCode(code: string) {
    return this.db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  }

  async usage(couponId: string, userId: string | null): Promise<{ total: number; byCustomer: number }> {
    const [total, byCustomer] = await Promise.all([
      this.db.couponRedemption.count({ where: { couponId } }),
      userId ? this.db.couponRedemption.count({ where: { couponId, userId } }) : Promise.resolve(0),
    ]);
    return { total, byCustomer };
  }

  // A use of the coupon by a paid booking (counts towards its limits).
  async recordUse(code: string, paymentId: string, userId: string | null, discount: number): Promise<void> {
    const coupon = await this.findByCode(code);
    if (!coupon) return;
    await this.db.couponRedemption.upsert({
      where: { paymentId },
      create: { couponId: coupon.id, paymentId, userId, discountAmount: discount },
      update: {},
    });
  }

  // The booking didn't happen (refunded): the use no longer counts.
  async releaseUse(paymentId: string): Promise<void> {
    await this.db.couponRedemption.deleteMany({ where: { paymentId } });
  }

  async publicOffers(now = new Date()): Promise<PublicOffer[]> {
    const rows = await this.db.coupon.findMany({
      where: { public: true, status: "ACTIVE", validFrom: { lte: now }, validTo: { gte: now }, title: { not: null } },
      orderBy: { validTo: "asc" },
      take: 6,
    });
    return rows.map((row) => ({
      code: row.code,
      title: row.title!,
      description: row.description,
      product: row.product,
      discountType: row.discountType,
      value: Number(row.value),
      maxDiscount: num(row.maxDiscount),
      minBookingAmount: num(row.minBookingAmount),
      validTo: indiaDay(row.validTo),
      eligibleDestinations: row.eligibleDestinations,
    }));
  }

  async list(): Promise<Coupon[]> {
    const [rows, given] = await Promise.all([
      this.db.coupon.findMany({
        orderBy: [{ status: "asc" }, { validTo: "desc" }],
        include: { createdByAdmin: { select: { name: true } }, _count: { select: { redemptions: true } } },
      }),
      this.db.couponRedemption.groupBy({ by: ["couponId"], _sum: { discountAmount: true } }),
    ]);
    const discountBy = new Map(given.map((group) => [group.couponId, Number(group._sum.discountAmount ?? 0)]));
    return rows.map((row) => this.toCoupon(row, discountBy.get(row.id) ?? 0));
  }

  private toCoupon(
    row: CouponRecord & { createdByAdmin: { name: string } | null; _count: { redemptions: number } },
    discountGiven: number,
  ): Coupon {
    return {
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      product: row.product,
      discountType: row.discountType,
      value: Number(row.value),
      maxDiscount: num(row.maxDiscount),
      minBookingAmount: num(row.minBookingAmount),
      validFrom: indiaDay(row.validFrom),
      validTo: indiaDay(row.validTo),
      usageLimit: row.usageLimit,
      perUserLimit: row.perUserLimit,
      eligibleDestinations: row.eligibleDestinations,
      public: row.public,
      status: row.status,
      redemptions: row._count.redemptions,
      discountGiven: Math.round(discountGiven * 100) / 100,
      expired: row.validTo.getTime() < Date.now(),
      createdBy: row.createdByAdmin?.name ?? null,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  // Who used a coupon, on which booking, and what it cost us.
  async report(id: string): Promise<CouponReport | null> {
    const row = await this.db.coupon.findUnique({
      where: { id },
      include: { createdByAdmin: { select: { name: true } }, _count: { select: { redemptions: true } } },
    });
    if (!row) return null;
    const uses = await this.db.couponRedemption.findMany({
      where: { couponId: id },
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        booking: { select: { id: true, reference: true, status: true, totalAmount: true, contactEmail: true, hotel: { select: { name: true } } } },
        payment: { select: { flightCheckout: { select: { id: true, supplierBookingId: true, status: true, amount: true, contactEmail: true, quote: true } } } },
      },
    });
    const redemptions: CouponRedemptionRow[] = uses.map((use) => {
      const flight = use.payment?.flightCheckout ?? null;
      const hotel = use.booking;
      const name = use.user ? `${use.user.firstName} ${use.user.lastName}`.trim() : null;
      return {
        id: use.id,
        usedAt: use.createdAt.toISOString(),
        product: flight && !hotel ? "flight" : "hotel",
        bookingId: hotel?.id ?? flight?.id ?? null,
        reference: hotel?.reference ?? flight?.supplierBookingId ?? null,
        title: hotel?.hotel.name ?? (flight ? routeOf(flight.quote) : null),
        customer: { name, email: use.user?.email ?? hotel?.contactEmail ?? flight?.contactEmail ?? null, signedIn: Boolean(use.user) },
        paid: hotel ? Number(hotel.totalAmount) : flight ? Number(flight.amount) : null,
        discount: Number(use.discountAmount),
        status: hotel?.status ?? flight?.status ?? null,
      };
    });
    const [totals] = await this.db.$queryRaw<{ discount: unknown; customers: bigint }[]>`
      SELECT coalesce(sum(r.discount_amount), 0) AS discount,
             count(DISTINCT coalesce(r.user_id::text, b.contact_email, f.contact_email)) AS customers
      FROM coupon_redemptions r
      LEFT JOIN bookings b ON b.id = r.booking_id
      LEFT JOIN payments p ON p.id = r.payment_id
      LEFT JOIN flight_checkouts f ON f.id = p.flight_checkout_id
      WHERE r.coupon_id = ${id}::uuid`;
    const [value] = await this.db.$queryRaw<{ value: unknown }[]>`
      SELECT coalesce(sum(coalesce(b.total_amount, f.amount)), 0) AS value
      FROM coupon_redemptions r
      LEFT JOIN bookings b ON b.id = r.booking_id
      LEFT JOIN payments p ON p.id = r.payment_id
      LEFT JOIN flight_checkouts f ON f.id = p.flight_checkout_id
      WHERE r.coupon_id = ${id}::uuid`;
    const discountGiven = Number(totals?.discount ?? 0);
    return {
      coupon: this.toCoupon(row, discountGiven),
      totals: {
        uses: row._count.redemptions,
        discountGiven: Math.round(discountGiven * 100) / 100,
        bookingValue: Math.round(Number(value?.value ?? 0) * 100) / 100,
        customers: Number(totals?.customers ?? 0),
      },
      redemptions,
    };
  }

  // Pause / resume (status) or end now (valid until this moment).
  async act(id: string, action: "pause" | "resume" | "end"): Promise<boolean> {
    const data = action === "pause" ? { status: "INACTIVE" as const } : action === "resume" ? { status: "ACTIVE" as const } : { validTo: new Date() };
    const { count } = await this.db.coupon.updateMany({ where: { id }, data });
    return count > 0;
  }

  private data(input: CouponInput) {
    return {
      code: input.code,
      title: input.title,
      description: input.description,
      product: input.product,
      discountType: input.discountType,
      value: input.value,
      maxDiscount: input.discountType === "PERCENTAGE" ? input.maxDiscount : null,
      minBookingAmount: input.minBookingAmount,
      validFrom: day(input.validFrom, false),
      validTo: day(input.validTo, true),
      usageLimit: input.usageLimit,
      perUserLimit: input.perUserLimit,
      eligibleDestinations: input.eligibleDestinations,
      public: input.public,
      status: input.status,
    };
  }

  async create(input: CouponInput, adminId: string): Promise<string> {
    return (await this.db.coupon.create({ data: { ...this.data(input), createdByAdminId: adminId }, select: { id: true } })).id;
  }

  async update(id: string, input: CouponInput): Promise<boolean> {
    const { count } = await this.db.coupon.updateMany({ where: { id }, data: this.data(input) });
    return count > 0;
  }

  // Coupons already used on bookings can't be deleted, only switched off.
  async remove(id: string): Promise<"deleted" | "missing" | "used"> {
    const used = await this.db.couponRedemption.count({ where: { couponId: id } });
    if (used) return "used";
    const { count } = await this.db.coupon.deleteMany({ where: { id } });
    return count ? "deleted" : "missing";
  }
}

// "HYD → DEL" from a flight quote.
function routeOf(quote: unknown): string {
  const journeys = (quote as { journeys?: { from?: string; to?: string }[] } | null)?.journeys ?? [];
  return journeys.length ? [journeys[0]!.from, ...journeys.map((leg) => leg.to)].filter(Boolean).join(" → ") : "Flight";
}
