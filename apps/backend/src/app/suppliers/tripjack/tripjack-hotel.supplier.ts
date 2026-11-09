import { randomUUID } from "node:crypto";
import { Inject, Injectable, Logger } from "@nestjs/common";
import type { DestinationSuggestion, HotelSearchRequest, HotelSearchResult, SearchCentre } from "@quickhotels/types/hotels";
import { distanceKm, type LatLng } from "../../common/utils/geo.js";
import { chunk, mapLimit } from "../../common/utils/map-limit.js";
import { TtlCache } from "../../common/utils/ttl-cache.js";
import type {
  HotelPageContent,
  HotelSearchOptions,
  HotelSupplier,
  SupplierCallContext,
  SupplierHotelBooking,
  SupplierHotelGuests,
  SupplierReviewResult,
  SupplierRoomsResult,
  SupplierSearchResult,
} from "../hotel-supplier.js";
import { SupplierError } from "../supplier-error.js";
import { toHotelBooking, toTripjackHotelBook, type TripjackHotelBookingDetails } from "./tripjack-hotel-booking.mapper.js";
import { TripjackClient } from "./tripjack.client.js";
import { landmarkFor } from "./city-centres.js";
import { tripjackConfig, type TripjackConfig } from "./tripjack.config.js";
import { TripjackContentRepository } from "./tripjack-content.repository.js";
import { TripjackContentService } from "./tripjack-content.service.js";
import { aliasTargets, destinationCountry, destinationNames, pickRegion, toSuggestions } from "./tripjack-destinations.js";
import { listingToResult, type CachedHotel } from "./tripjack.mapper.js";
import { toTripjackRooms } from "./tripjack-occupancy.js";
import { contentToHotelPage, toRoomOption } from "./tripjack-hotel-page.mapper.js";
import type {
  TripjackEnvelope,
  TripjackHotelContentResponse,
  TripjackListingResponse,
  TripjackPricingResponse,
  TripjackReviewResponse,
} from "./tripjack.types.js";

const LISTING_BATCH = 100; // TripJack's maximum hids per listing call
const LISTING_CONCURRENCY = 3;
const LISTING_TIMEOUT_MS = 13_000; // TripJack's suggested search timeout
// TripJack keeps a search session for about 15 minutes; stop a little early.
const SESSION_TTL_MS = 14 * 60 * 1000;
const CENTRE_TTL_MS = 24 * 60 * 60 * 1000;

const nightsBetween = (checkIn: string, checkOut: string) =>
  Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86_400_000);

// Where a search continues: the region and how many of its hotels (in star
// order) have been priced so far.
interface TripjackCursor {
  regionId: string;
  offset: number;
}

// What the next steps (Detail, Review) need: which correlationId each hotel
// was listed under. Stored on the search session.
export interface TripjackSearchContext {
  nationality: string;
  currency: string;
  batches: { correlationId: string; hotelIds: string[] }[];
}

// Hotels from TripJack (spec §7.3): destination → TripJack region → its best
// hotels from our content cache → live prices from /hms/v3/hotel/listing in
// batches of 100 → our HotelSearchResult, with cached names, photos and address.
// What hotelRooms saves for review (see its returned context).
interface TripjackRoomsContext {
  correlationId: string;
  hid: string;
  reviewHash: string | null;
}

@Injectable()
export class TripjackHotelSupplier implements HotelSupplier {
  readonly name = "tripjack";
  readonly sample = false;
  private readonly logger = new Logger(TripjackHotelSupplier.name);
  // Each region's centre point; hotel lists change slowly.
  private readonly centres = new TtlCache<(SearchCentre & LatLng) | null>();

  constructor(
    private readonly client: TripjackClient,
    private readonly content: TripjackContentService,
    private readonly hotels: TripjackContentRepository,
    @Inject(tripjackConfig.KEY) private readonly config: TripjackConfig,
  ) {}

  async searchHotels(request: HotelSearchRequest, context: SupplierCallContext, options: HotelSearchOptions = {}): Promise<SupplierSearchResult> {
    const fail = (code: "NOT_CONFIGURED" | "BAD_REQUEST", message: string) =>
      new SupplierError(code, message, this.name, context.correlationId);
    if (!this.client.configured) throw fail("NOT_CONFIGURED", "TRIPJACK_API_KEY is not set.");

    const rooms = toTripjackRooms(request);
    if (!rooms) throw fail("BAD_REQUEST", "The rooms and guests don't fit TripJack's limits (1–6 adults and up to 4 children per room).");

    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const empty = { supplierSearchId: null, expiresAt, results: [], context: null, nextCursor: null };
    const limit = Math.min(options.maxHotels ?? this.config.searchMaxHotels, this.config.searchMaxHotels);

    const cursor = options.cursor as TripjackCursor | undefined;
    let regionId = cursor?.regionId;
    if (!regionId) {
      const region = await this.resolveRegion(request.destination);
      if (!region) return empty;
      await this.content.ensureRegionHotels(region);
      regionId = region.regionId;
    }
    const offset = cursor?.offset ?? 0;
    const candidates = await this.hotels.hotelsForRegion(regionId, limit, offset);
    if (!candidates.length) return empty;
    const nextCursor: TripjackCursor | null = candidates.length === limit ? { regionId, offset: offset + limit } : null;

    const byId = new Map(candidates.map((hotel) => [hotel.supplierHotelId, hotel]));
    const batches = chunk(candidates, LISTING_BATCH).map((hotels) => ({ correlationId: randomUUID(), hotels }));
    const responses = await mapLimit(batches, LISTING_CONCURRENCY, ({ correlationId, hotels }) =>
      this.client.request<TripjackListingResponse>("listing", {
        correlationId,
        body: {
          checkIn: request.checkIn,
          checkOut: request.checkOut,
          rooms,
          currency: this.config.currency,
          correlationId,
          nationality: this.config.nationalityId,
          timeoutMs: LISTING_TIMEOUT_MS,
          hids: hotels.map((hotel) => Number(hotel.supplierHotelId)),
        },
      }),
    );

    const succeeded = responses.flatMap((response, index) => ("value" in response ? [{ batch: batches[index]!, response: response.value }] : []));
    if (!succeeded.length) throw (responses[0] as { error: unknown }).error;
    if (succeeded.length < batches.length) {
      this.logger.warn(`${batches.length - succeeded.length} of ${batches.length} listing batches failed for "${request.destination}" (ref ${context.correlationId}).`);
    }

    const nights = nightsBetween(request.checkIn, request.checkOut);
    const centre = await this.centreFor(regionId);
    const results: HotelSearchResult[] = [];
    const searchContext: TripjackSearchContext = { nationality: this.config.nationalityId, currency: this.config.currency, batches: [] };
    for (const { batch, response } of succeeded) {
      const listedIds: string[] = [];
      for (const listed of response.hotels ?? []) {
        const cached: CachedHotel | undefined = byId.get(String(listed.hotelId));
        const result = cached && listingToResult(listed, cached, nights);
        if (result) {
          if (centre && cached.latitude !== null && cached.longitude !== null) {
            result.distanceKm = distanceKm(centre, { lat: cached.latitude, lng: cached.longitude });
          }
          results.push(result);
          listedIds.push(String(listed.hotelId));
        }
      }
      searchContext.batches.push({ correlationId: batch.correlationId, hotelIds: listedIds });
    }

    // Best-rated first, then cheapest: the hotels were asked for in star order.
    results.sort((a, b) => (b.starRating ?? 0) - (a.starRating ?? 0) || a.totalPrice.amount - b.totalPrice.amount);
    return {
      supplierSearchId: batches[0]?.correlationId ?? null,
      expiresAt,
      results,
      context: searchContext,
      nextCursor,
      centre: centre && { name: centre.name, kind: centre.kind },
    };
  }

  // TripJack's hotel count for a destination (one cheap mapping call, cached
  // on the region for a week).
  async countHotels(destination: string): Promise<number | null> {
    if (!this.client.configured) return null;
    const region = await this.resolveRegion(destination);
    return region ? this.content.countRegionHotels(region) : null;
  }

  async hotelPage(supplierHotelId: string): Promise<HotelPageContent | null> {
    if (!this.client.configured) return null;
    const response = await this.client.request<TripjackHotelContentResponse>("hotelContent", {
      body: { hotelIds: [supplierHotelId], isAllImagesRequired: true },
    });
    const hotel = response.hotels?.[0];
    return hotel ? contentToHotelPage(hotel) : null;
  }

  // TripJack prices one hotel's rooms within a listing session (its
  // correlationId). Without one from the visitor's search, list just this
  // hotel first. A stale session falls back to a fresh one.
  async hotelRooms(
    request: HotelSearchRequest,
    supplierHotelId: string,
    context: SupplierCallContext,
    options: { searchRef?: string | null } = {},
  ): Promise<SupplierRoomsResult> {
    if (!this.client.configured) throw new SupplierError("NOT_CONFIGURED", "TRIPJACK_API_KEY is not set.", this.name, context.correlationId);
    const rooms = toTripjackRooms(request);
    if (!rooms) {
      throw new SupplierError("BAD_REQUEST", "The rooms and guests don't fit TripJack's limits (1–6 adults and up to 4 children per room).", this.name, context.correlationId);
    }
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const stay = { checkIn: request.checkIn, checkOut: request.checkOut, rooms, currency: this.config.currency, nationality: this.config.nationalityId };
    const nights = nightsBetween(request.checkIn, request.checkOut);

    const price = (correlationId: string) =>
      this.client.request<TripjackPricingResponse>("pricing", {
        correlationId,
        body: { ...stay, correlationId, hid: supplierHotelId, timeoutMs: LISTING_TIMEOUT_MS },
      });
    const fresh = async () => {
      const correlationId = context.correlationId;
      const listing = await this.client.request<TripjackListingResponse>("listing", {
        correlationId,
        body: { ...stay, correlationId, timeoutMs: LISTING_TIMEOUT_MS, hids: [Number(supplierHotelId)] },
      });
      if (!listing.hotels?.length) return null; // nothing available for this stay
      const session = listing.correlationId || correlationId;
      return { session, pricing: await price(session) };
    };

    let priced: { session: string; pricing: TripjackPricingResponse } | null = null;
    if (options.searchRef) {
      try {
        priced = { session: options.searchRef, pricing: await price(options.searchRef) };
      } catch (error) {
        if (!(error instanceof SupplierError) || error.code === "NOT_CONFIGURED") throw error;
        this.logger.warn(`Pricing in the search's session failed (${error.code}); listing hotel ${supplierHotelId} again.`);
      }
    }
    priced ??= await fresh();
    if (!priced) return { options: [], expiresAt, context: null };

    const roomOptions = (priced.pricing.options ?? [])
      .map((option) => toRoomOption(option, nights))
      .sort((a, b) => a.totalPrice.amount - b.totalPrice.amount);
    return {
      options: roomOptions,
      expiresAt,
      context: {
        correlationId: priced.session,
        hid: supplierHotelId,
        reviewHash: priced.pricing.reviewHash ?? null,
        nationality: this.config.nationalityId,
        currency: this.config.currency,
      },
    };
  }

  async reviewRoom(
    request: HotelSearchRequest,
    roomsContext: unknown,
    optionId: string,
    context: SupplierCallContext,
  ): Promise<SupplierReviewResult> {
    const rooms = roomsContext as TripjackRoomsContext | null;
    if (!rooms?.correlationId || !rooms.hid || !rooms.reviewHash) {
      throw new SupplierError("BAD_REQUEST", "The rooms session has no TripJack pricing to review.", this.name, context.correlationId);
    }
    const review = await this.client.request<TripjackReviewResponse>("review", {
      correlationId: rooms.correlationId,
      body: { correlationId: rooms.correlationId, optionId, reviewHash: rooms.reviewHash, hid: rooms.hid },
    });
    if (!review.option || !review.bookingId) {
      throw new SupplierError("BAD_RESPONSE", "TripJack review came back without an option or bookingId.", this.name, context.correlationId);
    }
    return {
      option: toRoomOption(review.option, nightsBetween(request.checkIn, request.checkOut)),
      context: {
        correlationId: rooms.correlationId,
        hid: rooms.hid,
        bookingId: review.bookingId,
        // Hold bookings must be confirmed before this (India time).
        holdDeadline: review.option.cancellation?.deadlineDateTime ?? null,
        holdAllowed: String(review.onholdAllowed) === "true",
        totalPrice: review.option.pricing.totalPrice,
      },
    };
  }

  refForHotel(searchContext: unknown, supplierHotelId: string): string | null {
    const batches = (searchContext as TripjackSearchContext | null)?.batches ?? [];
    return batches.find((batch) => batch.hotelIds.includes(supplierHotelId))?.correlationId ?? null;
  }

  // Where distances are measured from: the region's landmark, or else the
  // middle of its hotels. Null when neither is known.
  private centreFor(regionId: string) {
    return this.centres.getOrLoad(regionId, CENTRE_TTL_MS, async () => {
      const place = await this.hotels.regionPlace(regionId);
      if (!place) return null;
      const landmark = landmarkFor(place.name, place.countryName);
      if (landmark) return { ...landmark, kind: "landmark" as const };
      if (place.lat === null || place.lng === null) return null;
      return { name: "the centre of the area's hotels", kind: "hotels" as const, lat: place.lat, lng: place.lng };
    });
  }

  async suggestDestinations(query: string, limit: number): Promise<DestinationSuggestion[]> {
    // Extra rows, since the same place can be listed as a city and the area around it.
    const rows = await this.hotels.suggestRegions(query, aliasTargets(query), limit * 4);
    return toSuggestions(rows, limit);
  }

  private async resolveRegion(destination: string) {
    const names = destinationNames(destination);
    const regions = await this.hotels.findRegions(names);
    if (!regions.length && !(await this.content.hasRegions())) {
      throw new SupplierError(
        "NOT_CONFIGURED",
        "TripJack regions aren't loaded. Run: yarn workspace @quickhotels/backend tripjack:sync-regions",
        this.name,
        "regions",
      );
    }
    const country = destinationCountry(destination);
    // Several places share the name: learn how many hotels each has (one small
    // call per place, remembered in the database), so the real destination wins.
    const sameName = regions.filter((region) => names.includes(region.name) && (!country || region.countryName === country));
    if (sameName.length > 1) {
      const counted = await mapLimit(sameName, 4, async (region) => ({ ...region, hotelCount: await this.content.countRegionHotels(region) }));
      for (const result of counted) {
        if ("value" in result) Object.assign(regions.find((region) => region.regionId === result.value.regionId)!, { hotelCount: result.value.hotelCount });
      }
    }
    const best = pickRegion(regions, names, country);
    return best ? regions.find((region) => region.regionId === best.regionId)! : null;
  }

  async bookRoom(reviewContext: unknown, amount: number, guests: SupplierHotelGuests, context: SupplierCallContext): Promise<void> {
    const review = reviewContext as { bookingId?: string; totalPrice?: number } | null;
    if (!review?.bookingId) throw new SupplierError("BAD_REQUEST", "No TripJack bookingId from Review.", this.name, context.correlationId);
    // TripJack wants exactly its own total from Review.
    await this.client.request("book", { correlationId: context.correlationId, body: toTripjackHotelBook(review.bookingId, review.totalPrice ?? amount, guests) });
  }

  async hotelBooking(reviewContext: unknown, context: SupplierCallContext): Promise<SupplierHotelBooking> {
    const review = reviewContext as { bookingId?: string } | null;
    if (!review?.bookingId) throw new SupplierError("BAD_REQUEST", "No TripJack bookingId from Review.", this.name, context.correlationId);
    const response = await this.client.request<TripjackHotelBookingDetails & TripjackEnvelope>("bookingDetails", { correlationId: context.correlationId, body: { bookingId: review.bookingId } });
    return toHotelBooking(response);
  }

  // POST /oms/v3/hotel/cancel-booking/{bookingId}; never retried blindly.
  async cancelRoom(reviewContext: unknown, context: SupplierCallContext): Promise<void> {
    const review = reviewContext as { bookingId?: string } | null;
    if (!review?.bookingId) throw new SupplierError("BAD_REQUEST", "No TripJack bookingId from Review.", this.name, context.correlationId);
    await this.client.request("cancel", { correlationId: context.correlationId, pathSuffix: `/${encodeURIComponent(review.bookingId)}` });
  }
}
