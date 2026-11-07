import { Injectable, Logger } from "@nestjs/common";
import type { HotelSearchRequest, HotelSearchResult, Money, RoomOption } from "@quickhotels/types/hotels";
import type { FlightPriceBreakdown } from "@quickhotels/types/flight-checkout";
import type { FlightOption, FlightSearchCriteria } from "@quickhotels/types/flights";
import type { AppliedMarkup } from "@quickhotels/types/pricing";
import { markupOn, pickRule, placeOf, type MarkupRule } from "./markup.js";
import { PricingRulesRepository } from "./pricing-rules.repository.js";

// Active rules are re-read at most this often (and right after an admin edit).
const CACHE_MS = 60_000;
const cents = (value: number) => Math.round(value * 100) / 100;
const add = (money: Money, amount: number): Money => ({ amount: cents(money.amount + amount), currency: money.currency });

const travellersOf = (criteria: FlightSearchCriteria) => criteria.adults + criteria.children + criteria.infants;
const airlinesOf = (option: FlightOption) => [...new Set(option.legs.flatMap((leg) => leg.segments.map((segment) => segment.airlineCode)))];

// Our markup on supplier prices (admin → Pricing). Applied once, where prices
// come in from the supplier, so search, the hotel page and checkout agree.
@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  private cache: { rules: MarkupRule[]; at: number } | null = null;

  constructor(private readonly rules: PricingRulesRepository) {}

  invalidate() {
    this.cache = null;
  }

  async activeRules(): Promise<MarkupRule[]> {
    if (this.cache && Date.now() - this.cache.at < CACHE_MS) return this.cache.rules;
    try {
      this.cache = { rules: await this.rules.active(), at: Date.now() };
    } catch (error) {
      // Never block selling on a rules read; keep the last known rules.
      this.logger.error(`Could not load pricing rules: ${(error as Error).message}`);
      if (!this.cache) return [];
    }
    return this.cache!.rules;
  }

  // ---- Hotels (one rule per search: by the searched destination) ----

  async hotelRule(request: HotelSearchRequest): Promise<MarkupRule | null> {
    return pickRule(await this.activeRules(), { product: "HOTEL", ...placeOf(request.destination) });
  }

  markHotelResult(result: HotelSearchResult, rule: MarkupRule | null, nights: number): HotelSearchResult {
    const extra = markupOn(result.totalPrice.amount, rule);
    if (!extra) return result;
    const total = add(result.totalPrice, extra);
    return { ...result, totalPrice: total, pricePerNight: { amount: cents(total.amount / Math.max(1, nights)), currency: total.currency } };
  }

  // The room's price with markup (folded into the base rate), and the record of it.
  markRoom(option: RoomOption, rule: MarkupRule | null, nights: number): { option: RoomOption; applied: AppliedMarkup } {
    const extra = markupOn(option.totalPrice.amount, rule);
    const applied: AppliedMarkup = {
      ruleId: extra ? rule!.id : null,
      ruleVersion: extra ? rule!.version : null,
      net: option.totalPrice,
      markup: { amount: extra, currency: option.totalPrice.currency },
    };
    if (!extra) return { option, applied };
    const total = add(option.totalPrice, extra);
    return {
      option: {
        ...option,
        totalPrice: total,
        pricePerNight: { amount: cents(total.amount / Math.max(1, nights)), currency: total.currency },
        strikethroughPrice: option.strikethroughPrice ? add(option.strikethroughPrice, extra) : null,
        priceBreakup: { ...option.priceBreakup, base: cents(option.priceBreakup.base + extra) },
      },
      applied,
    };
  }

  // ---- Flights (a rule per fare: by its airline) ----

  async markFlightOptions(options: FlightOption[], criteria: FlightSearchCriteria): Promise<FlightOption[]> {
    const rules = await this.activeRules();
    const travellers = travellersOf(criteria);
    return options.map((option) => {
      const rule = pickRule(rules, { product: "FLIGHT", airlines: airlinesOf(option) });
      const extra = markupOn(option.price.amount, rule, travellers);
      if (!extra) return option;
      const perAdult = rule!.markupType === "PERCENTAGE" ? option.pricePerAdult.amount * (1 + rule!.value / 100) : option.pricePerAdult.amount + rule!.value;
      return { ...option, price: add(option.price, extra), pricePerAdult: { amount: Math.ceil(perAdult), currency: option.pricePerAdult.currency } };
    });
  }

  // Markup on a reviewed (net) fare total for the chosen fares. Each fare uses
  // its own rule; the net is shared out by each fare's share of the shown price.
  async markFlightReview(
    price: FlightPriceBreakdown,
    chosen: FlightOption[],
    criteria: FlightSearchCriteria,
  ): Promise<{ price: FlightPriceBreakdown; applied: AppliedMarkup }> {
    const rules = await this.activeRules();
    const travellers = travellersOf(criteria);
    const net = price.total.amount;
    const shown = chosen.reduce((sum, option) => sum + option.price.amount, 0) || 1;
    let extra = 0;
    let used: MarkupRule | null = null;
    for (const option of chosen) {
      const rule = pickRule(rules, { product: "FLIGHT", airlines: airlinesOf(option) });
      const share = (net * option.price.amount) / shown;
      const part = markupOn(share, rule, travellers);
      if (part) used ??= rule;
      extra += part;
    }
    extra = cents(extra);
    const applied: AppliedMarkup = {
      ruleId: used?.id ?? null,
      ruleVersion: used?.version ?? null,
      net: price.total,
      markup: { amount: extra, currency: price.total.currency },
    };
    if (!extra) return { price, applied };
    const factor = (net + extra) / (net || 1);
    return {
      price: {
        ...price,
        base: add(price.base, extra),
        total: add(price.total, extra),
        perTraveller: price.perTraveller.map((line) => ({ ...line, each: { amount: cents(line.each.amount * factor), currency: line.each.currency } })),
      },
      applied,
    };
  }
}
