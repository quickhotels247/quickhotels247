import { describe, expect, it } from "vitest";
import type { RoomOption } from "@quickhotels/types/hotels";
import type { FlightOption } from "@quickhotels/types/flights";
import type { MarkupRule } from "./markup.js";
import type { PricingRulesRepository } from "./pricing-rules.repository.js";
import { PricingService } from "./pricing.service.js";

const rule = (changes: Partial<MarkupRule>): MarkupRule => ({
  id: "r1", version: 3, product: "HOTEL", scope: "ALL", scopeValue: null, markupType: "PERCENTAGE", value: 10,
  priority: 0, validFrom: null, validTo: null, updatedAt: new Date(), ...changes,
});
const service = (rules: MarkupRule[]) => new PricingService({ active: async () => rules } as unknown as PricingRulesRepository);
const inr = (amount: number) => ({ amount, currency: "INR" });

describe("PricingService", () => {
  it("marks up a room, folding the markup into the base rate and recording it", async () => {
    const pricing = service([rule({})]);
    const r = await pricing.hotelRule({ destination: "Goa, India", checkIn: "2026-12-01", checkOut: "2026-12-03", rooms: 1, adults: 2, children: 0 });
    const room = { totalPrice: inr(5000), pricePerNight: inr(2500), strikethroughPrice: inr(6000), priceBreakup: { base: 4200, taxes: 800, managementFee: 0, managementFeeTax: 0, discount: 0 } } as RoomOption;
    const { option, applied } = pricing.markRoom(room, r, 2);
    expect(option.totalPrice.amount).toBe(5500);
    expect(option.pricePerNight.amount).toBe(2750);
    expect(option.priceBreakup.base).toBe(4700);
    expect(option.strikethroughPrice?.amount).toBe(6500);
    expect(applied).toEqual({ ruleId: "r1", ruleVersion: 3, net: inr(5000), markup: inr(500) });
  });

  it("marks up flights per traveller and matches the review to search", async () => {
    const pricing = service([rule({ product: "FLIGHT", markupType: "FIXED", value: 100 })]);
    const criteria = { adults: 2, children: 0, infants: 0 } as never;
    const option = { legs: [{ segments: [{ airlineCode: "6E" }] }], price: inr(10000), pricePerAdult: inr(5000) } as unknown as FlightOption;
    const [marked] = await pricing.markFlightOptions([option], criteria);
    expect(marked!.price.amount).toBe(10200);
    expect(marked!.pricePerAdult.amount).toBe(5100);
    const price = { base: inr(8000), taxes: inr(2000), serviceFee: inr(0), serviceFeeTax: inr(0), total: inr(10000), perTraveller: [{ type: "adult" as const, count: 2, each: inr(5000) }] };
    const reviewed = await pricing.markFlightReview(price, [marked!], criteria);
    expect(reviewed.price.total.amount).toBe(10200);
    expect(reviewed.price.base.amount).toBe(8200);
    expect(reviewed.price.perTraveller[0]!.each.amount).toBe(5100);
    expect(reviewed.applied.markup.amount).toBe(200);
  });

  it("changes nothing without rules", async () => {
    const pricing = service([]);
    const option = { legs: [], price: inr(4000), pricePerAdult: inr(4000) } as unknown as FlightOption;
    expect(await pricing.markFlightOptions([option], { adults: 1, children: 0, infants: 0 } as never)).toEqual([option]);
  });
});
