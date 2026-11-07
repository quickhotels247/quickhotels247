import { describe, expect, it } from "vitest";
import { evaluateCoupon, type CouponCheckout, type CouponTerms } from "./coupon-rules.js";

const coupon = (changes: Partial<CouponTerms> = {}): CouponTerms => ({
  status: "ACTIVE", product: null, discountType: "PERCENTAGE", value: 10, maxDiscount: null, minBookingAmount: null,
  validFrom: new Date("2026-11-01"), validTo: new Date("2026-12-31"), usageLimit: null, perUserLimit: null, eligibleDestinations: [], ...changes,
});
const checkout = (changes: Partial<CouponCheckout> = {}): CouponCheckout => ({
  product: "HOTEL", amount: 10000, margin: 1500, city: "Panaji", usedTotal: 0, usedByCustomer: 0, signedIn: true, now: new Date("2026-11-07"), ...changes,
});

describe("evaluateCoupon", () => {
  it("takes a percentage off, capped by the coupon's maximum", () => {
    expect(evaluateCoupon(coupon(), checkout())).toEqual({ ok: true, discount: 1000 });
    expect(evaluateCoupon(coupon({ maxDiscount: 500 }), checkout())).toEqual({ ok: true, discount: 500 });
  });

  it("never takes off more than our markup on the booking", () => {
    expect(evaluateCoupon(coupon({ discountType: "FIXED", value: 2000 }), checkout())).toEqual({ ok: true, discount: 1500 });
    expect(evaluateCoupon(coupon(), checkout({ margin: 0 }))).toEqual({ ok: false, reason: "This code can't be used on this booking." });
  });

  it("checks status, dates, product, destination and minimum", () => {
    expect(evaluateCoupon(coupon({ status: "DRAFT" }), checkout()).ok).toBe(false);
    expect(evaluateCoupon(coupon({ validTo: new Date("2026-11-05") }), checkout())).toMatchObject({ reason: "This code has expired." });
    expect(evaluateCoupon(coupon({ product: "FLIGHT" }), checkout())).toMatchObject({ reason: "This code is for flight bookings." });
    expect(evaluateCoupon(coupon({ eligibleDestinations: ["Jaipur"] }), checkout()).ok).toBe(false);
    expect(evaluateCoupon(coupon({ eligibleDestinations: ["panaji"] }), checkout()).ok).toBe(true);
    expect(evaluateCoupon(coupon({ minBookingAmount: 12000 }), checkout()).ok).toBe(false);
  });

  it("enforces usage limits, per customer only when signed in", () => {
    expect(evaluateCoupon(coupon({ usageLimit: 5 }), checkout({ usedTotal: 5 })).ok).toBe(false);
    expect(evaluateCoupon(coupon({ perUserLimit: 1 }), checkout({ signedIn: false }))).toMatchObject({ reason: "Sign in to use this code." });
    expect(evaluateCoupon(coupon({ perUserLimit: 1 }), checkout({ usedByCustomer: 1 })).ok).toBe(false);
  });
});
