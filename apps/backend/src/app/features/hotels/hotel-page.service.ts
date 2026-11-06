import { randomUUID } from "node:crypto";
import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import type { HotelDetails, HotelRoomsResponse, HotelSearchCriteria } from "@quickhotels/types/hotels";
import { HOTEL_SUPPLIER, type HotelPageContent, type HotelSupplier } from "../../suppliers/hotel-supplier.js";
import { SupplierError, supplierHttpError } from "../../suppliers/supplier-error.js";
import { HotelPageRepository, type StoredHotel } from "./hotel-page.repository.js";
import { SearchSessionsRepository } from "./search-sessions.repository.js";
import { checkStay } from "./stay-rules.js";

// Hotel content changes rarely; fetch the full page content again after this.
const PAGE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const sameStay = (a: HotelSearchCriteria, b: HotelSearchCriteria) =>
  a.checkIn === b.checkIn &&
  a.checkOut === b.checkOut &&
  a.rooms === b.rooms &&
  a.adults === b.adults &&
  a.children === b.children &&
  [...(a.childAges ?? [])].sort().join() === [...(b.childAges ?? [])].sort().join();

// The hotel page (spec §4.3): the hotel's content, and its rooms with live
// rates for the visitor's stay.
@Injectable()
export class HotelPageService {
  private readonly logger = new Logger(HotelPageService.name);
  // One content fetch per hotel at a time, however many visitors open it.
  private readonly fetching = new Map<string, Promise<HotelPageContent | null>>();

  constructor(
    @Inject(HOTEL_SUPPLIER) private readonly supplier: HotelSupplier,
    private readonly hotels: HotelPageRepository,
    private readonly sessions: SearchSessionsRepository,
  ) {}

  async details(id: string): Promise<HotelDetails> {
    const hotel = await this.findHotel(id);
    const stale = !hotel.pageFetchedAt || Date.now() - hotel.pageFetchedAt.getTime() > PAGE_MAX_AGE_MS;
    const page = (stale && hotel.supplier === this.supplier.name ? await this.fetchPage(hotel) : null) ?? hotel.page;
    return {
      id: hotel.id,
      name: hotel.name,
      starRating: hotel.starRating,
      propertyType: hotel.propertyType,
      address: hotel.address,
      city: hotel.city,
      country: hotel.country,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      headline: page?.headline ?? hotel.headline,
      images: page?.images.length ? page.images : hotel.images.length ? hotel.images : hotel.heroImageUrl ? [{ url: hotel.heroImageUrl, caption: null }] : [],
      description: page?.description ?? [],
      facilities: page?.facilities.length ? page.facilities : hotel.facilities,
      amenities: page?.amenities ?? [],
      checkIn: page?.checkIn ?? { from: null, until: null, minAge: null },
      checkOut: page?.checkOut ?? { from: null, until: null },
      policies: page?.policies ?? [],
      roomTypes: page?.roomTypes ?? [],
    };
  }

  // Live rooms and rates. With the visitor's searchId (same stay), prices in
  // that supplier session; otherwise the supplier starts one for this hotel.
  async rooms(id: string, criteria: HotelSearchCriteria, searchId?: string): Promise<HotelRoomsResponse> {
    const nights = checkStay(criteria);
    const hotel = await this.findHotel(id);
    const request = { ...criteria, destination: hotel.name };
    const searchRef = searchId ? await this.searchRef(searchId, hotel, criteria) : null;
    const correlationId = randomUUID();
    let found;
    try {
      found = await this.supplier.hotelRooms(request, hotel.supplierHotelId, { correlationId }, { searchRef });
    } catch (error) {
      if (!(error instanceof SupplierError)) throw error;
      this.logger.warn(`${error.supplier} rooms for hotel ${hotel.id} failed (${error.code}, ref ${error.correlationId}): ${error.message}`);
      throw supplierHttpError(error, "Checking room prices");
    }
    // Checkout continues from this session with the chosen option (step 4d).
    const roomsId = found.options.length
      ? await this.sessions.create({
          request,
          userId: null,
          supplier: this.supplier.name,
          supplierSearchId: null,
          // The prices shown, so checkout can tell the visitor if the confirmed one differs.
          supplierContext: {
            kind: "rooms",
            hotelId: hotel.id,
            supplier: found.context,
            shownPrices: Object.fromEntries(found.options.map((option) => [option.id, option.totalPrice])),
          },
          results: [],
          nextCursor: null,
          centre: null,
          expiresAt: found.expiresAt,
        })
      : null;
    return {
      hotelId: hotel.id,
      roomsId,
      expiresAt: found.expiresAt.toISOString(),
      criteria,
      nights,
      options: found.options,
      sample: this.supplier.sample,
    };
  }

  private async findHotel(id: string): Promise<StoredHotel> {
    const hotel = await this.hotels.find(id);
    if (!hotel || !hotel.isActive) throw new NotFoundException("This hotel isn't available any more.");
    return hotel;
  }

  // The full content from the supplier, saved for next time. A failure only
  // means the page shows what we already have.
  private fetchPage(hotel: StoredHotel): Promise<HotelPageContent | null> {
    const running = this.fetching.get(hotel.id);
    if (running) return running;
    const load = this.supplier
      .hotelPage(hotel.supplierHotelId, { correlationId: randomUUID() })
      .then(async (page) => {
        if (page) await this.hotels.savePage(hotel.id, page);
        return page;
      })
      .catch((error: Error) => {
        this.logger.warn(`Content for hotel ${hotel.id} couldn't be fetched: ${error.message}`);
        return null;
      })
      .finally(() => this.fetching.delete(hotel.id));
    this.fetching.set(hotel.id, load);
    return load;
  }

  private async searchRef(searchId: string, hotel: StoredHotel, criteria: HotelSearchCriteria) {
    const search = await this.sessions.find(searchId).catch(() => null);
    if (!search || search.supplier !== this.supplier.name || search.expiresAt.getTime() <= Date.now()) return null;
    if (!sameStay(search.request, criteria)) return null;
    return this.supplier.refForHotel(search.supplierContext, hotel.supplierHotelId);
  }
}
