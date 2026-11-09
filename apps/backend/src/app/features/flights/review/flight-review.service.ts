import { randomUUID } from "node:crypto";
import { BadRequestException, ConflictException, GoneException, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { FlightBookingListItem, FlightBookingsPage, FlightBookingsTab, FlightReviewStatus, FlightReviewSummary, FlightTravellerDetails } from "@quickhotels/types/flight-checkout";
import { TERMS_VERSION } from "../../../common/config/terms.js";
import { hashCheckoutKey, keyMatches } from "../../../common/utils/checkout-key.js";
import { todayInIndia } from "../../../common/utils/india-dates.js";
import { FLIGHT_SUPPLIER, type FlightSupplier } from "../../../suppliers/flight-supplier.js";
import { SupplierError, supplierHttpError } from "../../../suppliers/supplier-error.js";
import { FlightSearchSessionsRepository } from "../search/flight-search-sessions.repository.js";
import { PricingService } from "../../../pricing/pricing.service.js";
import type { PaymentOrder } from "@quickhotels/types/payments";
import { bookingLinkValid } from "../../../common/utils/booking-links.js";
import { CouponsService } from "../../coupons/coupons.service.js";
import { PaymentsService } from "../../payments/payments.service.js";
import { FlightBookingService } from "../booking/flight-booking.service.js";
import { FlightReviewRepository, payableOf, type FlightQuote, type StoredFlightReview } from "./flight-review.repository.js";
import { checkTravellers } from "./traveller-rules.js";
import { flightTicketPdf } from "../../../documents/flight-ticket.pdf.js";
import { ticketInputOf } from "../booking/flight-booking.service.js";

// Differences under ₹1 are rounding, not a price change.
// Our row statuses as the customer sees them.
const PUBLIC_STATUS: Record<string, FlightReviewStatus> = {
  travellers: "travellers",
  payment: "payment",
  paid: "processing",
  booking: "processing",
  pending: "processing",
  confirmed: "confirmed",
  failed: "failed",
};

const PRICE_TOLERANCE = 1;

// Fare review (flights step F4): re-checks the chosen fares with the
// supplier, fetches their fare rules, and holds a server-owned quote. Prices
// never come from the browser. Travellers (F5) and payment (F6) follow.
@Injectable()
export class FlightReviewService {
  private readonly logger = new Logger(FlightReviewService.name);
  // Reviews in progress, by key hash: repeats share the first.
  private readonly starting = new Map<string, Promise<FlightReviewSummary>>();

  constructor(
    @Inject(FLIGHT_SUPPLIER) private readonly supplier: FlightSupplier,
    private readonly reviews: FlightReviewRepository,
    private readonly searches: FlightSearchSessionsRepository,
    private readonly pricing: PricingService,
    private readonly coupons: CouponsService,
    private readonly payments: PaymentsService,
    private readonly booking: FlightBookingService,
  ) {}

  // `key` is the browser's random key: the same key returns the same review.
  create(searchId: string, fares: { trip: string; id: string }[], key: string, userId: string | null = null): Promise<FlightReviewSummary> {
    const keyHash = hashCheckoutKey(key);
    const running = this.starting.get(keyHash);
    if (running) return running;
    const start = this.start(searchId, fares, keyHash, userId).finally(() => this.starting.delete(keyHash));
    this.starting.set(keyHash, start);
    return start;
  }

  async get(id: string, key: string): Promise<FlightReviewSummary> {
    const review = await this.open(id, key);
    // A paid booking left mid-way (restart, slow airline): carry on.
    this.booking.recover(review);
    return this.summary(review);
  }

  // The PDF e-ticket, for whoever can open the booking (checkout key, owner
  // or email link), once tickets are issued.
  async ticket(id: string, access: { key: string | null; userId: string | null; token: string | null }): Promise<{ pdf: Buffer; name: string }> {
    const review = access.key ? await this.open(id, access.key) : await this.reviews.find(id);
    const allowed = review && (access.key || (access.userId && review.userId === access.userId) || bookingLinkValid("flight", id, access.token));
    if (!review || !allowed) throw new NotFoundException("We couldn't find this booking.");
    const input = review.status === "confirmed" ? ticketInputOf(review) : null;
    if (!input) throw new ConflictException("The e-ticket is ready once the airline issues your tickets.");
    return { pdf: await flightTicketPdf(input), name: `e-ticket-${input.booking.pnrs[0]?.pnr ?? input.booking.bookingId}.pdf` };
  }

  // A booking for its owner (signed in) or anyone with its private email link.
  // Anything else looks like a missing booking.
  async viewForCustomer(id: string, access: { userId: string | null; token: string | null }): Promise<FlightReviewSummary> {
    const review = await this.reviews.find(id);
    const allowed = review && ((access.userId && review.userId === access.userId) || bookingLinkValid("flight", id, access.token));
    if (!review || !allowed) throw new NotFoundException("We couldn't find this booking.");
    this.booking.recover(review);
    return this.summary(review);
  }

  // My bookings → Flights: upcoming (not yet flown), past, or cancelled/failed.
  async listForCustomer(userId: string, tab: FlightBookingsTab, query: string, page: number, pageSize = 10): Promise<FlightBookingsPage> {
    const today = todayInIndia();
    const needle = query.trim().toLowerCase();
    const items = (await this.reviews.paidForUser(userId))
      .map((review) => {
        const pnrs = [...new Set(review.booking?.pnrs.map((item) => item.pnr) ?? [])];
        return {
          review,
          item: {
            id: review.id,
            status: PUBLIC_STATUS[review.status] ?? "processing",
            legs: review.quote.journeys.map((leg) => ({ from: leg.from, to: leg.to, departAt: leg.departAt, airlines: [...new Set(leg.segments.map((segment) => segment.airlineName))].join(", ") })),
            travellers: review.quote.criteria.adults + review.quote.criteria.children + review.quote.criteria.infants,
            pnrs,
            paid: payableOf(review.quote),
            paidAt: review.paidAt?.toISOString() ?? null,
          } satisfies FlightBookingListItem,
        };
      })
      .filter(({ review, item }) => {
        const lastDay = (item.legs.at(-1)?.departAt ?? "").slice(0, 10);
        if (tab === "cancelled") return review.status === "failed";
        if (review.status === "failed") return false;
        return tab === "past" ? lastDay < today : lastDay >= today;
      })
      .filter(({ item }) => !needle || item.pnrs.some((pnr) => pnr.toLowerCase().includes(needle)) || item.legs.some((leg) => `${leg.from} ${leg.to} ${leg.airlines}`.toLowerCase().includes(needle)))
      .map(({ item }) => item);
    // Upcoming: soonest first; past and cancelled: most recent first.
    items.sort((a, b) => (tab === "upcoming" ? 1 : -1) * (a.legs[0]?.departAt ?? "").localeCompare(b.legs[0]?.departAt ?? ""));
    return { tab, items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize };
  }

  // Step F6: a Razorpay order for what's payable now (travellers saved). The
  // coupon is checked again (limits or dates may have changed since it was
  // applied); if it no longer fits it's removed and the customer told.
  async startPayment(id: string, key: string, userId: string | null = null): Promise<PaymentOrder> {
    let review = await this.editable(id, key);
    if (review.status !== "payment" || !review.travellerDetails) throw new ConflictException("Add the travellers before paying.");
    if (userId) await this.reviews.claim(review.id, userId);
    if (review.quote.coupon) {
      try {
        const coupon = await this.coupons.apply(review.quote.coupon.code, {
          product: "FLIGHT",
          amount: review.quote.price.total.amount,
          currency: review.quote.price.total.currency,
          margin: review.quote.markup?.markup.amount ?? 0,
          city: null,
          userId: userId ?? review.userId,
        });
        if (coupon.discount.amount !== review.quote.coupon.discount.amount) await this.reviews.setQuote(review.id, { ...review.quote, coupon });
      } catch (error) {
        await this.reviews.setQuote(review.id, { ...review.quote, coupon: null });
        const total = payableOf({ ...review.quote, coupon: null });
        throw new ConflictException(`Coupon ${review.quote.coupon.code} can't be used any more (${(error as Error).message.replace(/\.$/, "")}), so it was removed. Your total is now ₹${total.amount.toLocaleString("en-IN")}. Press Pay again to continue.`);
      }
      review = (await this.reviews.find(review.id))!;
    }
    const details = review.travellerDetails!;
    const lead = details.travellers[0];
    const route = review.quote.journeys.map((leg) => `${leg.from}–${leg.to}`).join(", ");
    const payable = payableOf(review.quote);
    return this.payments.createOrder({
      target: { flightCheckoutId: review.id },
      amount: payable.amount,
      currency: payable.currency,
      description: `Flight ${route}`,
      prefill: {
        name: lead ? `${lead.firstName} ${lead.lastName}` : null,
        email: details.contact.email,
        contact: `${details.contact.phoneCode}${details.contact.phone}`.replace(/\s+/g, ""),
      },
    });
  }

  // Step F5: travellers and contact, checked against the fare and the trip.
  async saveTravellers(id: string, key: string, details: FlightTravellerDetails): Promise<FlightReviewSummary> {
    const review = await this.editable(id, key);
    checkTravellers(review.quote, details, todayInIndia());
    // Optional parts only when filled in; PAN or passport only when asked for.
    const clean: FlightTravellerDetails = {
      ...details,
      travellers: details.travellers.map(({ passport, pan, ...traveller }) => ({
        ...traveller,
        ...(review.quote.requirements.passport && passport ? { passport } : {}),
        ...(review.quote.requirements.pan && pan ? { pan } : {}),
      })),
    };
    await this.reviews.saveTravellers(review.id, clean, TERMS_VERSION);
    return this.summary((await this.reviews.find(review.id))!);
  }

  // A coupon code: checked against this fare (never more than our markup).
  async applyCoupon(id: string, key: string, code: string, userId: string | null): Promise<FlightReviewSummary> {
    const review = await this.editable(id, key);
    if (userId) await this.reviews.claim(review.id, userId);
    const coupon = await this.coupons.apply(code, {
      product: "FLIGHT",
      amount: review.quote.price.total.amount,
      currency: review.quote.price.total.currency,
      margin: review.quote.markup?.markup.amount ?? 0,
      city: null,
      userId,
    });
    await this.reviews.setQuote(review.id, { ...review.quote, coupon });
    return this.summary((await this.reviews.find(review.id))!);
  }

  async removeCoupon(id: string, key: string): Promise<FlightReviewSummary> {
    const review = await this.editable(id, key);
    await this.reviews.setQuote(review.id, { ...review.quote, coupon: null });
    return this.summary((await this.reviews.find(review.id))!);
  }

  // Still before payment, and within the airline's price hold.
  private async editable(id: string, key: string) {
    const review = await this.open(id, key);
    if (review.status !== "travellers" && review.status !== "payment") throw new ConflictException("This booking is already paid and can't be changed.");
    if (review.expiresAt.getTime() <= Date.now()) {
      throw new GoneException("The airline's price hold has ended. Please search again for current fares.");
    }
    return review;
  }

  // The review, if the key opens it. Unknown id and wrong key look the same.
  private async open(id: string, key: string) {
    const review = await this.reviews.find(id);
    if (!review || !keyMatches(key, review.keyHash)) throw new NotFoundException("We couldn't find this booking. Please choose your flights again.");
    return review;
  }

  private async start(searchId: string, fares: { trip: string; id: string }[], keyHash: string, userId: string | null): Promise<FlightReviewSummary> {
    const existing = await this.reviews.findByKeyHash(keyHash);
    if (existing) return this.summary(existing);

    const search = await this.searches.find(searchId);
    if (!search) throw new NotFoundException("We couldn't find that search. Please search again.");
    if (search.expiresAt.getTime() <= Date.now()) throw new GoneException("These fares have expired. Please search again for current fares.");

    // One fare per list, each from that list of this search.
    const lists = search.trips.map((trip) => trip.key);
    const byTrip = new Map(fares.map((fare) => [fare.trip, fare.id]));
    if (byTrip.size !== fares.length || lists.some((key) => !byTrip.has(key)) || fares.length !== lists.length) {
      throw new BadRequestException("Choose one flight for each part of your trip.");
    }
    const chosen = lists.map((key) => search.trips.find((trip) => trip.key === key)!.options.find((option) => option.id === byTrip.get(key)));
    if (chosen.some((option) => !option)) throw new BadRequestException("Those flights aren't part of this search. Please choose again.");
    const shownTotal = chosen.reduce((sum, option) => sum + option!.price.amount, 0);

    const correlationId = randomUUID();
    let reviewed;
    try {
      reviewed = await this.supplier.reviewFlights(chosen.map((option) => option!.id), search.criteria, lists, { correlationId });
    } catch (error) {
      if (!(error instanceof SupplierError)) throw error;
      this.logger.warn(`${error.supplier} flight review failed (${error.code}, ref ${error.correlationId}): ${error.message}`);
      if (error.code === "SOLD_OUT") throw new ConflictException("Those seats have just sold out. Please choose other flights.");
      throw supplierHttpError(error, "Confirming your fare");
    }
    const rules = await this.supplier.fareRules(reviewed.supplierBookingId, { correlationId });

    // The supplier's price is net: add our markup the way search did.
    const priced = await this.pricing.markFlightReview(reviewed.price, chosen.map((option) => option!), search.criteria);
    const current = priced.price.total;
    const quote: FlightQuote = {
      criteria: search.criteria,
      journeys: reviewed.journeys,
      fares: reviewed.fares,
      price: priced.price,
      markup: priced.applied,
      priceChange:
        Math.abs(current.amount - shownTotal) >= PRICE_TOLERANCE ? { previous: { amount: Math.round(shownTotal * 100) / 100, currency: current.currency }, current } : null,
      rules,
      requirements: reviewed.requirements,
      holdAllowed: reviewed.holdAllowed,
    };
    const id = await this.reviews.create({
      keyHash,
      userId,
      searchSessionId: search.id,
      supplier: this.supplier.name,
      supplierBookingId: reviewed.supplierBookingId,
      quote,
      expiresAt: reviewed.expiresAt,
    });
    // Another request with this key won the race; return that review.
    const stored = id ? await this.reviews.find(id) : await this.reviews.findByKeyHash(keyHash);
    return this.summary(stored!);
  }

  private summary(review: StoredFlightReview): FlightReviewSummary {
    // Net price and markup stay on the server.
    const { markup: _markup, coupon, ...quote } = review.quote;
    return {
      reviewId: review.id,
      status: PUBLIC_STATUS[review.status] ?? "travellers",
      booking: review.booking,
      expiresAt: review.expiresAt.toISOString(),
      ...quote,
      coupon: coupon ?? null,
      payable: payableOf(review.quote),
      termsVersion: TERMS_VERSION,
      travellerDetails: review.travellerDetails,
    };
  }
}
