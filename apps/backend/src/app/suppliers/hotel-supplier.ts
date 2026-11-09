import type {
  DestinationSuggestion,
  HotelDetails,
  HotelSearchRequest,
  HotelSearchResult,
  RoomOption,
  SearchCentre,
} from "@quickhotels/types/hotels";
import type { AppliedMarkup } from "@quickhotels/types/pricing";

// What every hotel supplier (TripJack now, others later) must provide. The rest
// of the app only talks to this, never to a supplier directly (spec §1).
export interface HotelSupplier {
  // Short name stored with searches and bookings, e.g. "tripjack".
  readonly name: string;
  // True for development data that must never reach real customers.
  readonly sample: boolean;
  // Prices one batch of hotels. Pass the previous call's nextCursor to price
  // the next batch for the same search (more pages).
  searchHotels(request: HotelSearchRequest, context: SupplierCallContext, options?: HotelSearchOptions): Promise<SupplierSearchResult>;
  // How many hotels the supplier has at a destination, or null if unknown.
  countHotels(destination: string): Promise<number | null>;
  // Places whose name starts (or has a word starting) with what was typed, best first.
  suggestDestinations(query: string, limit: number): Promise<DestinationSuggestion[]>;
  // Full content for a hotel's page; null when the supplier has none.
  hotelPage(supplierHotelId: string, context: SupplierCallContext): Promise<HotelPageContent | null>;
  // Every bookable option for one hotel and stay, cheapest first. `searchRef`
  // continues an earlier search of the same stay (see refForHotel).
  hotelRooms(
    request: HotelSearchRequest,
    supplierHotelId: string,
    context: SupplierCallContext,
    options?: { searchRef?: string | null },
  ): Promise<SupplierRoomsResult>;
  // Re-checks one rate right before payment (price, terms, availability),
  // within the rooms session it was priced in. Throws SupplierError SOLD_OUT
  // when the rate is gone.
  reviewRoom(
    request: HotelSearchRequest,
    roomsContext: unknown,
    optionId: string,
    context: SupplierCallContext,
  ): Promise<SupplierReviewResult>;
  // The reference a search's saved context holds for one of its hotels, so
  // its rooms are priced in the same supplier session; null if none.
  refForHotel(searchContext: unknown, supplierHotelId: string): string | null;
  // Books the reviewed rate (instant booking: the supplier is paid `amount`,
  // its own price). Not idempotent: never call twice for one checkout.
  bookRoom(reviewContext: unknown, amount: number, guests: SupplierHotelGuests, context: SupplierCallContext): Promise<void>;
  // The supplier's view of the booking after Book.
  hotelBooking(reviewContext: unknown, context: SupplierCallContext): Promise<SupplierHotelBooking>;
  // Asks the supplier to cancel a confirmed booking; the outcome comes from
  // hotelBooking (CANCELLED, or CANCELLATION_PENDING while handled offline).
  cancelRoom(reviewContext: unknown, context: SupplierCallContext): Promise<void>;
}

export interface SupplierHotelGuests {
  // Per room, in search order: adults then children.
  rooms: { guests: { title: string; firstName: string; lastName: string; child: boolean; pan?: string; passportNumber?: string }[] }[];
  contact: { email: string; phoneCode: string; phone: string };
}

export interface SupplierHotelBooking {
  // SUCCESS (confirmed), FAILED / ABORTED (not booked), or still pending.
  status: string;
  // The hotel's or supplier's confirmation number, once confirmed.
  confirmation: string | null;
  supplierReference: string | null;
}

// What the hotel page adds to the basics kept for search.
export type HotelPageContent = Pick<
  HotelDetails,
  "headline" | "images" | "description" | "facilities" | "amenities" | "checkIn" | "checkOut" | "policies" | "roomTypes"
>;

export interface SupplierReviewResult {
  option: RoomOption;
  // Saved with the booking attempt for booking (TripJack: its bookingId).
  context: unknown;
  // Net price and our markup (set by the pricing wrapper; kept with the checkout).
  markup?: AppliedMarkup;
}

export interface SupplierRoomsResult {
  options: RoomOption[];
  expiresAt: Date;
  // Saved with the rooms session for review and booking. Never sent to the browser.
  context: unknown;
}

export interface SupplierCallContext {
  // Ties every supplier call for one customer search together in the logs.
  correlationId: string;
}

export interface HotelSearchOptions {
  cursor?: unknown;
  // How many hotels to ask prices for in this batch.
  maxHotels?: number;
}

export interface SupplierSearchResult {
  // The supplier's own search ID, needed for its pricing and booking steps.
  supplierSearchId: string | null;
  // When the supplier stops honouring these rates.
  expiresAt: Date;
  results: HotelSearchResult[];
  // Supplier-specific details for the next steps (pricing, review, booking),
  // saved with the search session. Never sent to the browser.
  context?: unknown;
  // Pass back to continue this search; null when there are no more hotels.
  nextCursor: unknown;
  // Where each result's distanceKm is measured from, when known.
  centre?: SearchCentre | null;
}

// Nest injection token for the active hotel supplier.
export const HOTEL_SUPPLIER = Symbol("HOTEL_SUPPLIER");
