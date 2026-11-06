import type { Money } from "@quickhotels/types/hotels";

// ₹12,499 / $120: whole units, grouped the way the currency's locale expects.
export function formatPrice({ amount, currency }: Money) {
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// 4320 → "4,320"; with compact, 12000 → "12K".
export function formatCount(value: number, { compact = false } = {}) {
  return new Intl.NumberFormat("en-IN", {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}
