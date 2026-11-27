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
  // Total taken off bookings that used it (₹).
  discountGiven: number;
  // Past its end time (including "End now").
  expired: boolean;
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

// Admin → Coupons → a coupon's report (GET /api/admin/coupons/:id/report).
export interface CouponRedemptionRow {
  id: string;
  usedAt: string;
  product: "hotel" | "flight";
  // Opens the booking in the admin console; null if it's gone.
  bookingId: string | null;
  reference: string | null;
  // Hotel name or flight route.
  title: string | null;
  customer: { name: string | null; email: string | null; signedIn: boolean };
  // What the customer paid, after the discount.
  paid: number | null;
  discount: number;
  // Booking status (hotel BookingStatus or flight checkout status).
  status: string | null;
}

export interface CouponReport {
  coupon: Coupon;
  totals: {
    uses: number;
    discountGiven: number;
    // What customers paid on those bookings, after the discount.
    bookingValue: number;
    customers: number;
  };
  // Newest first, up to 500.
  redemptions: CouponRedemptionRow[];
}

// POST /api/admin/coupons/:id/action: pause, resume, or end it now.
export type CouponAction = "pause" | "resume" | "end";
