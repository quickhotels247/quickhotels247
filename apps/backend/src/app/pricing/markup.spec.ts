import { describe, expect, it } from "vitest";
import { markupOn, pickRule, placeOf, type MarkupRule } from "./markup.js";

const rule = (changes: Partial<MarkupRule>): MarkupRule => ({
  id: "r", version: 1, product: "HOTEL", scope: "ALL", scopeValue: null, markupType: "PERCENTAGE", value: 10,
  priority: 0, validFrom: null, validTo: null, updatedAt: new Date("2026-11-01"), ...changes,
});

describe("pickRule", () => {
  const all = rule({ id: "all" });
  const india = rule({ id: "india", scope: "COUNTRY", scopeValue: "India" });
  const goa = rule({ id: "goa", scope: "DESTINATION", scopeValue: "Goa" });
  const flights = rule({ id: "flights", product: "FLIGHT" });
  const indigo = rule({ id: "indigo", product: "FLIGHT", scope: "AIRLINE", scopeValue: "6E" });

  it("prefers the most specific rule at equal priority", () => {
    const rules = [all, india, goa];
    expect(pickRule(rules, { product: "HOTEL", ...placeOf("Goa, India") })?.id).toBe("goa");
    expect(pickRule(rules, { product: "HOTEL", ...placeOf("Jaipur, Rajasthan, India") })?.id).toBe("india");
    expect(pickRule(rules, { product: "HOTEL", ...placeOf("Dubai, United Arab Emirates") })?.id).toBe("all");
  });

  it("lets a higher priority win over a more specific rule", () => {
    expect(pickRule([goa, rule({ id: "promo", priority: 5 })], { product: "HOTEL", ...placeOf("Goa, India") })?.id).toBe("promo");
  });

  it("keeps hotels and flights apart, and matches airlines", () => {
    expect(pickRule([all, flights, indigo], { product: "FLIGHT", airlines: ["AI"] })?.id).toBe("flights");
    expect(pickRule([all, flights, indigo], { product: "FLIGHT", airlines: ["6E"] })?.id).toBe("indigo");
    expect(pickRule([flights], { product: "HOTEL", ...placeOf("Goa, India") })).toBeNull();
  });

  it("ignores rules outside their dates", () => {
    const now = new Date("2026-11-07");
    expect(pickRule([rule({ validTo: new Date("2026-11-01") })], { product: "HOTEL" }, now)).toBeNull();
    expect(pickRule([rule({ validFrom: new Date("2026-12-01") })], { product: "HOTEL" }, now)).toBeNull();
  });
});

describe("markupOn", () => {
  it("adds a percentage, rounding the price up to whole rupees", () => {
    expect(markupOn(4999.5, rule({ value: 10 }))).toBe(500.5); // 5499.45 → 5500
    expect(markupOn(1000, rule({ value: 0 }))).toBe(0);
  });

  it("adds a fixed amount per unit", () => {
    expect(markupOn(5864, rule({ markupType: "FIXED", value: 150 }), 2)).toBe(300);
  });

  it("adds nothing without a rule", () => {
    expect(markupOn(5000, null)).toBe(0);
  });
});
