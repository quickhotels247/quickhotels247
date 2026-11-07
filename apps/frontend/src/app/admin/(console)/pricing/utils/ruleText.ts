import type { PricingRule, PricingRuleInput } from "@quickhotels/types/pricing";
import { formatPrice } from "@/lib/format";

export const inr = (amount: number) => formatPrice({ amount, currency: "INR" });

// "All hotels", "Destination: Goa", "Airline: 6E"…
export function scopeText(rule: Pick<PricingRuleInput, "product" | "scope" | "scopeValue">) {
  switch (rule.scope) {
    case "ALL":
      return rule.product === "HOTEL" ? "All hotels" : "All flights";
    case "COUNTRY":
      return `Hotels in ${rule.scopeValue}`;
    case "DESTINATION":
      return `Hotels in ${rule.scopeValue} (destination)`;
    case "AIRLINE":
      return `Airline ${rule.scopeValue}`;
  }
}

// "10%" or "₹150 per booking" / "₹150 per traveller per flight".
export function markupText(rule: Pick<PricingRuleInput, "product" | "markupType" | "value">) {
  if (rule.markupType === "PERCENTAGE") return `${rule.value}% of the net price`;
  return `${inr(rule.value)} ${rule.product === "HOTEL" ? "per booking" : "per traveller, per flight"}`;
}

// What the customer would pay on a sample net price, rounded up like the server.
export function preview(rule: Pick<PricingRuleInput, "markupType" | "value">, net: number, units = 1) {
  const raw = rule.markupType === "PERCENTAGE" ? (net * rule.value) / 100 : rule.value * units;
  const sell = raw > 0 ? Math.ceil(net + raw) : net;
  return { sell, earn: Math.round((sell - net) * 100) / 100 };
}

export const dateText = (rule: Pick<PricingRule, "validFrom" | "validTo">) => {
  const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  if (!rule.validFrom && !rule.validTo) return "Always";
  if (rule.validFrom && rule.validTo) return `${day(rule.validFrom)} – ${day(rule.validTo)}`;
  return rule.validFrom ? `From ${day(rule.validFrom)}` : `Until ${day(rule.validTo!)}`;
};
