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
}
