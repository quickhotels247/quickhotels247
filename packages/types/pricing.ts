// Markup rules (admin → Pricing): what we add on top of the supplier's net
// price. The best matching active rule applies; none means no markup.

export type PricingProduct = "HOTEL" | "FLIGHT";
// Hotels: ALL, COUNTRY ("India"), DESTINATION ("Goa"). Flights: ALL, AIRLINE ("6E").
export type PricingScope = "ALL" | "COUNTRY" | "DESTINATION" | "AIRLINE";
// PERCENTAGE of the net price, or FIXED rupees: per booking for hotels, per
// traveller per flight (each direction) for flights.
export type MarkupType = "PERCENTAGE" | "FIXED";
export type PricingRuleStatus = "DRAFT" | "ACTIVE" | "INACTIVE";

export interface PricingRuleInput {
  name: string;
  product: PricingProduct;
  scope: PricingScope;
  scopeValue: string | null;
  markupType: MarkupType;
  value: number;
  // Higher wins when several rules match.
  priority: number;
  validFrom: string | null;
  validTo: string | null;
  status: PricingRuleStatus;
}

export interface PricingRule extends PricingRuleInput {
  id: string;
  version: number;
  updatedAt: string;
  createdBy: string | null;
}

// Stored with each checkout (never shown to customers): what the supplier
// charges us and what we added.
export interface AppliedMarkup {
  ruleId: string | null;
  ruleVersion: number | null;
  net: { amount: number; currency: string };
  markup: { amount: number; currency: string };
  // An automatic discount taken off the selling price (out of the markup).
  promotion?: { id: string; version: number; name: string; amount: { amount: number; currency: string } } | null;
}

// ---- Promotions (admin → Promotions): automatic discounts on all hotels ----

export interface PromotionInput {
  name: string; // shown to customers, e.g. "Winter sale"
  discountType: "PERCENTAGE" | "FIXED";
  // PERCENTAGE of the regular price, or FIXED ₹ per booking.
  value: number;
  // Caps a percentage discount (₹ per booking).
  maxDiscount: number | null;
  validFrom: string | null; // YYYY-MM-DD, India days
  validTo: string | null;
  status: PricingRuleStatus;
}

export interface Promotion extends PromotionInput {
  id: string;
  version: number;
  updatedAt: string;
  createdBy: string | null;
  // Running now (active and within its dates).
  live: boolean;
}
