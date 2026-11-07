import { BadRequestException, Injectable } from "@nestjs/common";
import type { AppliedCoupon, PublicOffer } from "@quickhotels/types/coupons";
import type { PricingProduct } from "@quickhotels/types/pricing";
import { evaluateCoupon } from "./coupon-rules.js";
import { CouponsRepository, toTerms } from "./coupons.repository.js";

export interface CouponTarget {
  product: PricingProduct;
  amount: number;
  currency: string;
  margin: number;
  city: string | null;
  userId: string | null;
}

@Injectable()
export class CouponsService {
  constructor(private readonly coupons: CouponsRepository) {}

  // The coupon as it applies to this checkout, or a 400 saying why not.
  async apply(code: string, target: CouponTarget): Promise<AppliedCoupon> {
    const row = await this.coupons.findByCode(code);
    if (!row) throw new BadRequestException("This code isn't valid.");
    const usage = await this.coupons.usage(row.id, target.userId);
    const result = evaluateCoupon(toTerms(row), {
      product: target.product,
      amount: target.amount,
      margin: target.margin,
      city: target.city,
      usedTotal: usage.total,
      usedByCustomer: usage.byCustomer,
      signedIn: Boolean(target.userId),
      now: new Date(),
    });
    if (!result.ok) throw new BadRequestException(result.reason);
    return { code: row.code, title: row.title, discount: { amount: result.discount, currency: target.currency } };
  }

  publicOffers(): Promise<PublicOffer[]> {
    return this.coupons.publicOffers();
  }
}
