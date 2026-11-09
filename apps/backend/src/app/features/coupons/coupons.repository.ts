import { Injectable } from "@nestjs/common";
import type { Coupon, CouponInput, PublicOffer } from "@quickhotels/types/coupons";
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
    const rows = await this.db.coupon.findMany({
      orderBy: [{ status: "asc" }, { validTo: "desc" }],
      include: { createdByAdmin: { select: { name: true } }, _count: { select: { redemptions: true } } },
    });
    return rows.map((row) => ({
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
      createdBy: row.createdByAdmin?.name ?? null,
      updatedAt: row.updatedAt.toISOString(),
    }));
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
