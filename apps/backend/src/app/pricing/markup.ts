import type { MarkupType, PricingProduct, PricingScope } from "@quickhotels/types/pricing";

// The parts of a rule that decide prices (loaded from pricing_rules).
export interface MarkupRule {
  id: string;
  version: number;
  product: PricingProduct;
  scope: PricingScope;
  scopeValue: string | null;
  markupType: MarkupType;
  value: number;
  priority: number;
  validFrom: Date | null;
  validTo: Date | null;
  updatedAt: Date;
}

// What a price is about, for choosing the rule.
export interface MarkupTarget {
  product: PricingProduct;
  // Hotels: the searched place, e.g. "Goa, India" → destination "goa", country "india".
  destination?: string | null;
  country?: string | null;
  // Flights: the airline(s) of the fare, e.g. ["6E"].
  airlines?: string[];
}

const norm = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

// "Jaipur, Rajasthan, India" → { destination: "jaipur", country: "india" }.
export function placeOf(searched: string): { destination: string; country: string | null } {
  const parts = searched.split(",").map((part) => part.trim()).filter(Boolean);
  return { destination: norm(parts[0]), country: parts.length > 1 ? norm(parts.at(-1)) : null };
}

// More specific scopes win a priority tie.
const SPECIFICITY: Record<PricingScope, number> = { DESTINATION: 3, AIRLINE: 2, COUNTRY: 1, ALL: 0 };

function matches(rule: MarkupRule, target: MarkupTarget, now: Date): boolean {
  if (rule.product !== target.product) return false;
  if (rule.validFrom && rule.validFrom > now) return false;
  if (rule.validTo && rule.validTo < now) return false;
  const value = norm(rule.scopeValue);
  switch (rule.scope) {
    case "ALL":
      return true;
    case "COUNTRY":
      return Boolean(value) && value === norm(target.country);
    case "DESTINATION":
      return Boolean(value) && value === norm(target.destination);
    case "AIRLINE":
      return Boolean(value) && (target.airlines ?? []).some((code) => norm(code) === value);
  }
}

// The rule for this price: highest priority, then most specific, then newest.
// Rules passed in are the active ones.
export function pickRule(rules: MarkupRule[], target: MarkupTarget, now = new Date()): MarkupRule | null {
  const candidates = rules.filter((rule) => matches(rule, target, now));
  candidates.sort(
    (a, b) => b.priority - a.priority || SPECIFICITY[b.scope] - SPECIFICITY[a.scope] || b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
  return candidates[0] ?? null;
}

const cents = (value: number) => Math.round(value * 100) / 100;

// Markup on a net amount. FIXED is per unit (a booking for hotels; a traveller
// for each flight). The selling price is rounded up to whole rupees.
export function markupOn(net: number, rule: MarkupRule | null, units = 1): number {
  if (!rule || net <= 0) return 0;
  const raw = rule.markupType === "PERCENTAGE" ? (net * rule.value) / 100 : rule.value * units;
  if (raw <= 0) return 0;
  return cents(Math.ceil(net + raw) - net);
}
