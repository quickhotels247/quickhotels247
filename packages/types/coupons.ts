// Coupons (admin → Coupons): discount codes customers enter at checkout.
import type { PricingProduct } from "@quickhotels/types/pricing";

export type CouponStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export interface CouponInput {
  code: string; // "GOA500"; stored upper-case
  title: string | null; // shown on Home offers, e.g. "₹500 off Goa stays"
  description: string | null;
  // Null: hotels and flights.
  product: PricingProduct | null;
  discountType: "PERCENTAGE" | "FIXED";
  value: number;
  // Caps a percentage discount (₹).
  maxDiscount: number | null;
  minBookingAmount: number | null;
  validFrom: string; // YYYY-MM-DD
  validTo: string;
  usageLimit: number | null;
  perUserLimit: number | null;
  // Hotel destinations (city names); empty: anywhere.
  eligibleDestinations: string[];
  // Listed on the Home page Offers.
  public: boolean;
  status: CouponStatus;
}

export interface Coupon extends CouponInput {
  id: string;
  redemptions: number;
  createdBy: string | null;
  updatedAt: string;
}

// On a checkout: the code and what it takes off.
export interface AppliedCoupon {
  code: string;
  title: string | null;
  discount: { amount: number; currency: string };
}

// PUT /api/v1/checkouts/:id/coupon and /api/v1/flights/reviews/:id/coupon
export interface ApplyCouponRequest {
  code: string;
}

// GET /api/v1/offers: public, active coupons for the Home page.
export interface PublicOffer {
  code: string;
  title: string;
  description: string | null;
  product: PricingProduct | null;
  discountType: "PERCENTAGE" | "FIXED";
  value: number;
  maxDiscount: number | null;
  minBookingAmount: number | null;
  validTo: string;
  eligibleDestinations: string[];
}
