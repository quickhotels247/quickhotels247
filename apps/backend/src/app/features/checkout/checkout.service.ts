import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  GoneException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { CheckoutGuestDetails, CheckoutSummary } from "@quickhotels/types/checkout";
import type { Money } from "@quickhotels/types/hotels";
import { BookingStatus } from "../../../generated/prisma/client.js";
import { TERMS_VERSION } from "../../common/config/terms.js";
import { hashCheckoutKey as hash, keyMatches } from "../../common/utils/checkout-key.js";
import { HOTEL_SUPPLIER, type HotelSupplier } from "../../suppliers/hotel-supplier.js";
import { SupplierError, supplierHttpError } from "../../suppliers/supplier-error.js";
import { HotelPageRepository } from "../hotels/hotel-page.repository.js";
import { splitGuests } from "../hotels/room-guests.js";
import { SearchSessionsRepository } from "../hotels/search-sessions.repository.js";
import { nightsOf } from "../hotels/stay-rules.js";
import { CheckoutRepository, type CheckoutQuote, type StoredCheckout } from "./checkout.repository.js";

// How long a reviewed rate is held for guest details and payment.
const CHECKOUT_TTL_MS = 15 * 60 * 1000;
// Differences under ₹1 are rounding, not a price change.
const PRICE_TOLERANCE = 1;

// What hotelPage rooms() saved with each rooms session.
interface RoomsSessionContext {
  kind: "rooms";
  hotelId: string;
  supplier: unknown;
  shownPrices: Record<string, Money>;
}

const ADULT_TITLES = new Set(["Mr", "Mrs", "Ms", "Miss"]);
const CHILD_TITLES = new Set(["Master", "Miss"]);
const EDITABLE: BookingStatus[] = [BookingStatus.INITIATED, BookingStatus.PRICE_REVIEW_PENDING, BookingStatus.AWAITING_PAYMENT];

// Checkout (spec §4.4): re-checks the chosen rate with the supplier, holds a
// server-owned quote, and collects guest details. Prices never come from the
// browser. Payment and booking follow in roadmap step 8.
@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);
  // Starts in progress, by key hash: a repeat of the same request (a double
  // click, a retry, React running effects twice) shares the first review.
  private readonly starting = new Map<string, Promise<CheckoutSummary>>();

  constructor(
    @Inject(HOTEL_SUPPLIER) private readonly supplier: HotelSupplier,
    private readonly checkouts: CheckoutRepository,
    private readonly sessions: SearchSessionsRepository,
    private readonly hotels: HotelPageRepository,
  ) {}

  // Starts a checkout for a rate from the hotel page. `key` is the browser's
  // random key: the same key returns the same checkout without a second review.
  create(roomsId: string, optionId: string, key: string): Promise<CheckoutSummary> {
    const keyHash = hash(key);
    const running = this.starting.get(keyHash);
    if (running) return running;
    const start = this.start(roomsId, optionId, keyHash).finally(() => this.starting.delete(keyHash));
    this.starting.set(keyHash, start);
    return start;
  }

  private async start(roomsId: string, optionId: string, keyHash: string): Promise<CheckoutSummary> {
    const existing = await this.checkouts.findByKeyHash(keyHash);
    if (existing) return this.summary(existing);

    const session = await this.sessions.find(roomsId);
    const rooms = session?.supplierContext as RoomsSessionContext | null | undefined;
    if (!session || rooms?.kind !== "rooms" || session.supplier !== this.supplier.name) {
      throw new NotFoundException("We couldn't find that room. Please choose it again on the hotel page.");
    }
    if (session.expiresAt.getTime() <= Date.now()) {
      throw new GoneException("These prices have expired. Please choose your room again for current prices.");
    }
    const shown = rooms.shownPrices?.[optionId];
    if (!shown) throw new BadRequestException("That rate isn't part of this search. Please choose your room again.");
    const hotel = await this.hotels.find(rooms.hotelId);
    if (!hotel || !hotel.isActive) throw new NotFoundException("This hotel isn't available any more.");

    let review;
    try {
      review = await this.supplier.reviewRoom(session.request, rooms.supplier, optionId, { correlationId: randomUUID() });
    } catch (error) {
      if (!(error instanceof SupplierError)) throw error;
      this.logger.warn(`${error.supplier} review for hotel ${hotel.id} failed (${error.code}, ref ${error.correlationId}): ${error.message}`);
      if (error.code === "SOLD_OUT") throw new ConflictException("This rate has just sold out. Please choose another room.");
      throw supplierHttpError(error, "Confirming your room");
    }

    const current = review.option.totalPrice;
    const changed = Math.abs(current.amount - shown.amount) >= PRICE_TOLERANCE;
    const { destination: _destination, ...stay } = session.request;
    const quote: CheckoutQuote = {
      hotel: {
        id: hotel.id,
        name: hotel.name,
        starRating: hotel.starRating,
        address: hotel.address,
        city: hotel.city,
        imageUrl: hotel.page?.images[0]?.url ?? hotel.heroImageUrl,
        checkIn: { from: hotel.page?.checkIn.from ?? null, until: hotel.page?.checkIn.until ?? null },
        checkOut: { from: hotel.page?.checkOut.from ?? null, until: hotel.page?.checkOut.until ?? null },
      },
      stay,
      nights: nightsOf(session.request),
      rooms: splitGuests(session.request),
      room: review.option,
      priceChange: changed ? { previous: shown, current } : null,
      requirements: { pan: review.option.panRequired, passport: review.option.passportRequired },
      policies: hotel.page?.policies ?? [],
      ...(review.markup ? { markup: review.markup } : {}),
    };
    const id = await this.checkouts.create({
      keyHash,
      searchSessionId: session.id,
      hotelId: hotel.id,
      optionId,
      status: changed ? BookingStatus.PRICE_REVIEW_PENDING : BookingStatus.INITIATED,
      expiresAt: new Date(Date.now() + CHECKOUT_TTL_MS),
      quote,
      supplierContext: review.context,
    });
    // Another request with this key won the race; return that checkout.
    const stored = id ? await this.checkouts.find(id) : await this.checkouts.findByKeyHash(keyHash);
    return this.summary(stored!);
  }

  async get(id: string, key: string): Promise<CheckoutSummary> {
    return this.summary(await this.open(id, key));
  }

  async saveGuests(id: string, key: string, details: CheckoutGuestDetails): Promise<CheckoutSummary> {
    const checkout = await this.open(id, key);
    if (!EDITABLE.includes(checkout.status)) throw new ConflictException("This checkout can't be changed any more.");
    if (checkout.expiresAt && checkout.expiresAt.getTime() <= Date.now()) {
      throw new GoneException("Your checkout timed out. Please choose your room again for current prices.");
    }
    const quote = checkout.quote!;
    if (quote.priceChange && !details.acceptPriceChange) {
      throw new ConflictException("The price changed. Please accept the new price to continue.");
    }
    this.checkGuests(quote, details);
    if (details.contact.phoneCode === "+91" && !/^[6-9]\d{9}$/.test(details.contact.phone)) {
      throw new BadRequestException("Enter a 10-digit Indian mobile number.");
    }
    const clean: CheckoutGuestDetails = { ...details, specialRequests: details.specialRequests || undefined };
    await this.checkouts.saveGuests(checkout.id, checkout.status, clean, TERMS_VERSION);
    return this.summary((await this.checkouts.find(checkout.id))!);
  }

  // The checkout, if the key opens it. Unknown id and wrong key look the same.
  private async open(id: string, key: string): Promise<StoredCheckout> {
    const checkout = await this.checkouts.find(id);
    if (!checkout?.quote || !keyMatches(key, checkout.accessTokenHash)) {
      throw new NotFoundException("We couldn't find this checkout. Please choose your room again.");
    }
    return checkout;
  }

  // Guests must match the rooms as priced: adults then children in each room,
  // titles that fit, PAN or passport when the rate needs them, and a
  // different lead guest name in each room (TripJack's rule).
  private checkGuests(quote: CheckoutQuote, details: CheckoutGuestDetails) {
    if (details.rooms.length !== quote.rooms.length) throw new BadRequestException(`Give guests for all ${quote.rooms.length} rooms.`);
    const leads = new Set<string>();
    quote.rooms.forEach((room, r) => {
      const guests = details.rooms[r]!.guests;
      if (guests.length !== room.adults + room.childAges.length) {
        throw new BadRequestException(`Room ${r + 1} needs ${room.adults + room.childAges.length} guests.`);
      }
      guests.forEach((guest, g) => {
        const child = g >= room.adults;
        const who = `Room ${r + 1}, guest ${g + 1}`;
        if (!(child ? CHILD_TITLES : ADULT_TITLES).has(guest.title)) {
          throw new BadRequestException(`${who}: choose ${child ? "Master or Miss" : "Mr, Mrs, Ms or Miss"}.`);
        }
        if (quote.requirements.pan && !guest.pan) throw new BadRequestException(`${who}: PAN is needed for this rate.`);
        if (quote.requirements.passport && !guest.passportNumber) throw new BadRequestException(`${who}: a passport number is needed for this rate.`);
      });
      const lead = `${guests[0]!.firstName} ${guests[0]!.lastName}`.toLowerCase();
      if (leads.has(lead)) throw new BadRequestException("Each room needs a different main guest.");
      leads.add(lead);
    });
  }

  private summary(checkout: StoredCheckout): CheckoutSummary {
    // Net price and markup stay on the server.
    const { markup: _markup, ...quote } = checkout.quote!;
    return {
      checkoutId: checkout.id,
      status: checkout.status === BookingStatus.AWAITING_PAYMENT ? "payment" : "details",
      expiresAt: (checkout.expiresAt ?? new Date()).toISOString(),
      ...quote,
      termsVersion: TERMS_VERSION,
      guestDetails: checkout.guestDetails,
    };
  }
}
