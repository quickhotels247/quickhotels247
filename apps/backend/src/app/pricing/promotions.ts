import type { AppliedMarkup } from "@quickhotels/types/pricing";

// An active promotion as pricing needs it (loaded from `promotions`).
export interface ActivePromotion {
  id: string;
  version: number;
  name: string;
  discountType: "PERCENTAGE" | "FIXED";
  value: number;
  maxDiscount: number | null;
  validFrom: Date | null;
  validTo: Date | null;
  updatedAt: Date;
}

// The promotion running now: within its dates; the newest wins.
export function pickPromotion(promotions: ActivePromotion[], now = new Date()): ActivePromotion | null {
  return (
    promotions
      .filter((promotion) => (!promotion.validFrom || promotion.validFrom <= now) && (!promotion.validTo || promotion.validTo >= now))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0] ?? null
  );
}

// The discount on a selling price: a % of it (capped) or fixed rupees, never
// more than our markup on it (so never below the supplier's net), in whole
// rupees so the price stays whole.
export function promotionOn(selling: number, markup: number, promotion: ActivePromotion | null): number {
  if (!promotion || selling <= 0 || markup <= 0) return 0;
  let raw = promotion.discountType === "PERCENTAGE" ? (selling * promotion.value) / 100 : promotion.value;
  if (promotion.maxDiscount !== null) raw = Math.min(raw, promotion.maxDiscount);
  return Math.max(0, Math.floor(Math.min(raw, markup)));
}

// "5% off" for a discount on a regular price; at least 1 when there is one.
export const percentOff = (discount: number, regular: number) => (discount > 0 && regular > 0 ? Math.max(1, Math.round((discount / regular) * 100)) : 0);

// What's left of our margin after the promotion: the most a coupon may take off.
export const marginAfterPromotion = (applied: AppliedMarkup | null | undefined) =>
  Math.max(0, Math.round(((applied?.markup.amount ?? 0) - (applied?.promotion?.amount.amount ?? 0)) * 100) / 100);
