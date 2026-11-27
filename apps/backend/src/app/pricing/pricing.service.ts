import { Injectable, Logger } from "@nestjs/common";
import type { HotelSearchRequest, HotelSearchResult, Money, RoomOption } from "@quickhotels/types/hotels";
import type { FlightPriceBreakdown } from "@quickhotels/types/flight-checkout";
import type { FlightOption, FlightSearchCriteria } from "@quickhotels/types/flights";
import type { AppliedMarkup } from "@quickhotels/types/pricing";
import { markupOn, pickRule, placeOf, type MarkupRule } from "./markup.js";
import { PricingRulesRepository } from "./pricing-rules.repository.js";
import { percentOff, pickPromotion, promotionOn, type ActivePromotion } from "./promotions.js";
import { PromotionsRepository } from "./promotions.repository.js";
import { sellHotel } from "./hotel-sale.js";
import { CompanySettingsService } from "../settings/company-settings.service.js";

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
  private promotionsCache: { promotions: ActivePromotion[]; at: number } | null = null;

  constructor(
    private readonly rules: PricingRulesRepository,
    private readonly promotions: PromotionsRepository,
    private readonly settings: CompanySettingsService,
  ) {}

  invalidate() {
    this.cache = null;
    this.promotionsCache = null;
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

  async activePromotion(): Promise<ActivePromotion | null> {
    if (!this.promotionsCache || Date.now() - this.promotionsCache.at >= CACHE_MS) {
      try {
        this.promotionsCache = { promotions: await this.promotions.active(), at: Date.now() };
      } catch (error) {
        // Never block selling on a promotions read; keep the last known ones.
        this.logger.error(`Could not load promotions: ${(error as Error).message}`);
        if (!this.promotionsCache) return null;
      }
    }
    return pickPromotion(this.promotionsCache!.promotions);
  }

  // ---- Hotels: one markup rule per search (by the searched destination) and
  // the running promotion, which applies to all hotels ----

  async hotelRule(request: HotelSearchRequest): Promise<MarkupRule | null> {
    return pickRule(await this.activeRules(), { product: "HOTEL", ...placeOf(request.destination) });
  }

  async hotelPricing(request: HotelSearchRequest): Promise<{ rule: MarkupRule | null; promotion: ActivePromotion | null; marginGstRate: number }> {
    const [rule, promotion, percent] = await Promise.all([this.hotelRule(request), this.activePromotion(), this.settings.marginGstPercent()]);
    return { rule, promotion, marginGstRate: percent / 100 };
  }

  // Agent model (Option B): customer pays the supplier's net (its GST inside)
  // + our margin + GST on that margin. A promotion shrinks the margin, and the
  // GST on it shrinks too; prices never go below the supplier's net.
  private sale(net: number, rule: MarkupRule | null, promotion: ActivePromotion | null, gstRate: number) {
    const markup = markupOn(net, rule);
    const regular = sellHotel(net, markup, gstRate);
    const offMargin = promotionOn(regular.total, regular.margin, promotion);
    // Less than ₹1 of margin left: the promotion takes it all (price = net).
    const rest = regular.margin - offMargin;
    const sold = offMargin ? sellHotel(net, rest < 1 ? 0 : rest, gstRate) : regular;
    return { regular, sold, offMargin, off: cents(regular.total - sold.total) };
  }

  markHotelResult(result: HotelSearchResult, rule: MarkupRule | null, nights: number, promotion: ActivePromotion | null = null, gstRate = 0): HotelSearchResult {
    const { regular, sold, off } = this.sale(result.totalPrice.amount, rule, promotion, gstRate);
    if (!regular.margin) return result;
    const currency = result.totalPrice.currency;
    return {
      ...result,
      totalPrice: { amount: sold.total, currency },
      pricePerNight: { amount: cents(sold.total / Math.max(1, nights)), currency },
      ...(result.taxesAndFees ? { taxesAndFees: add(result.taxesAndFees, regular.marginGst) } : {}),
      ...(off ? { strikethroughPrice: { amount: regular.total, currency }, percentOff: percentOff(off, regular.total) } : {}),
    };
  }

  // The room's price: our margin folded into the base rate, GST on the margin
  // added to taxes, any promotion as its own line; and the record of all three.
  markRoom(
    option: RoomOption,
    rule: MarkupRule | null,
    nights: number,
    promotion: ActivePromotion | null = null,
    gstRate = 0,
  ): { option: RoomOption; applied: AppliedMarkup } {
    const net = option.totalPrice.amount;
    const currency = option.totalPrice.currency;
    const { regular, sold, off } = this.sale(net, rule, promotion, gstRate);
    const applied: AppliedMarkup = {
      ruleId: regular.margin ? rule!.id : null,
      ruleVersion: regular.margin ? rule!.version : null,
      net: option.totalPrice,
      markup: { amount: regular.margin, currency },
      promotion: off
        ? { id: promotion!.id, version: promotion!.version, name: promotion!.name, amount: { amount: off, currency }, marginAmount: cents(regular.margin - sold.margin) }
        : null,
      marginGst: { amount: sold.marginGst, currency },
    };
    if (!regular.margin) return { option, applied };
    const extra = cents(regular.total - net);
    const total = { amount: sold.total, currency };
    return {
      option: {
        ...option,
        totalPrice: total,
        pricePerNight: { amount: cents(total.amount / Math.max(1, nights)), currency },
        // While a promotion runs, the crossed-out price is our regular price.
        strikethroughPrice: off ? { amount: regular.total, currency } : option.strikethroughPrice ? add(option.strikethroughPrice, extra) : null,
        promotion: off ? { name: promotion!.name, percentOff: percentOff(off, regular.total) } : null,
        priceBreakup: {
          ...option.priceBreakup,
          base: cents(option.priceBreakup.base + regular.margin),
          taxes: cents(option.priceBreakup.taxes + regular.marginGst),
          ...(off ? { promotion: off } : {}),
        },
        // A charged period keeps our margin and its GST too (never more than
        // the total); free periods stay free. Refund = what the supplier refunds us.
        cancellationCharges: (option.cancellationCharges ?? []).map((charge) => ({
          ...charge,
          amount: charge.amount.amount > 0 ? { amount: Math.min(total.amount, cents(charge.amount.amount + extra)), currency: charge.amount.currency } : charge.amount,
        })),
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
