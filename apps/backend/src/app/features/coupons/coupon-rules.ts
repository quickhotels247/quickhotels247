import type { PricingProduct } from "@quickhotels/types/pricing";

// What decides whether a coupon fits a checkout.
export interface CouponTerms {
  status: "DRAFT" | "ACTIVE" | "INACTIVE";
  product: PricingProduct | null;
  discountType: "PERCENTAGE" | "FIXED";
  value: number;
  maxDiscount: number | null;
  minBookingAmount: number | null;
  validFrom: Date;
  validTo: Date;
  usageLimit: number | null;
  perUserLimit: number | null;
  eligibleDestinations: string[];
}

export interface CouponCheckout {
  product: PricingProduct;
  // The price before the coupon.
  amount: number;
  // Our markup on this booking: the most a coupon may take off, so we never
  // sell below the supplier's net price.
  margin: number;
  // Hotel city, for destination-limited coupons.
  city: string | null;
  usedTotal: number;
  usedByCustomer: number;
  // Per-customer limits need a signed-in customer.
  signedIn: boolean;
  now: Date;
}

export type CouponResult = { ok: true; discount: number } | { ok: false; reason: string };

const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;
const norm = (value: string | null) => (value ?? "").trim().toLowerCase();

// Whether the coupon applies, and how much it takes off (whole rupees).
export function evaluateCoupon(coupon: CouponTerms, checkout: CouponCheckout): CouponResult {
  if (coupon.status !== "ACTIVE" || checkout.now < coupon.validFrom) return { ok: false, reason: "This code isn't valid." };
  if (checkout.now > coupon.validTo) return { ok: false, reason: "This code has expired." };
  if (coupon.product && coupon.product !== checkout.product) {
    return { ok: false, reason: coupon.product === "HOTEL" ? "This code is for hotel bookings." : "This code is for flight bookings." };
  }
  if (coupon.eligibleDestinations.length && !coupon.eligibleDestinations.some((place) => norm(place) === norm(checkout.city))) {
    return { ok: false, reason: `This code is for stays in ${coupon.eligibleDestinations.join(", ")}.` };
  }
  if (coupon.minBookingAmount && checkout.amount < coupon.minBookingAmount) {
    return { ok: false, reason: `This code needs a booking of at least ${rupees(coupon.minBookingAmount)}.` };
  }
  if (coupon.usageLimit !== null && checkout.usedTotal >= coupon.usageLimit) return { ok: false, reason: "This code has been fully used." };
  if (coupon.perUserLimit !== null) {
    if (!checkout.signedIn) return { ok: false, reason: "Sign in to use this code." };
    if (checkout.usedByCustomer >= coupon.perUserLimit) return { ok: false, reason: "You've already used this code." };
  }
  let discount = coupon.discountType === "PERCENTAGE" ? (checkout.amount * coupon.value) / 100 : coupon.value;
  if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.floor(Math.min(discount, checkout.margin));
  if (discount <= 0) return { ok: false, reason: "This code can't be used on this booking." };
  return { ok: true, discount };
}
