// Hotel browsing shapes shared by the website and the backend.
// The backend will map TripJack responses into these.

export interface Destination {
  id: string;
  name: string;
  country: string;
  // From the supplier (GET /api/v1/home/destination-stats); absent until loaded.
  hotelCount?: number | null;
  imageUrl: string;
}

export interface Money {
  // Whole currency units (rupees, dollars), not paise or cents.
  amount: number;
  currency: string;
}

export interface HotelSummary {
  id: string;
  name: string;
  city: string;
  country: string;
  // Guest rating out of 5, when the supplier provides one.
  rating: number | null;
  reviewCount: number | null;
  imageUrl: string;
  pricePerNight: Money;
}

// What the home page search bar sends to /hotels/search.
export interface HotelSearchCriteria {
  destination: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  rooms: number;
  adults: number;
  children: number;
  // One age (0–17) per child, in any order. Suppliers need them to price rooms.
  childAges?: number[];
}

// ─── GET /api/v1/destinations/suggestions?q= ────────────────────────────────

// A place offered while the visitor types a destination.
export interface DestinationSuggestion {
  id: string;
  name: string; // "Hyderabad"
  detail: string; // "Telangana, India"
  kind: "city" | "area" | "region";
  // What goes in the search box when picked: "Hyderabad, India" (the country
  // tells same-named places apart).
  query: string;
  // Hotels the supplier lists there, when known.
  hotelCount: number | null;
}

// ─── POST /api/v1/searches ──────────────────────────────────────────────────

export type HotelSearchRequest = HotelSearchCriteria;

// Facilities we let visitors filter by, mapped from each supplier's own list.
export type HotelAmenity =
  | "wifi"
  | "parking"
  | "pool"
  | "spa"
  | "gym"
  | "restaurant"
  | "bar"
  | "roomService"
  | "airportShuttle"
  | "airConditioning"
  | "kitchen"
  | "petFriendly"
  | "familyRooms"
  | "wheelchair"
  | "evCharging"
  | "beach";

// One hotel in the results, with the price for the whole stay.
export interface HotelSearchResult extends HotelSummary {
  // Official star category (1–5), when known. Not a guest rating.
  starRating: number | null;
  address: string | null;
  propertyType: string | null;
  // e.g. "Breakfast included" for the cheapest rate, when the supplier says so.
  mealPlan: string | null;
  freeCancellation: boolean;
  // What the property offers, as far as the supplier says.
  amenities: HotelAmenity[];
  // Straight-line distance from the search's centre point, when the hotel's
  // location is known.
  distanceKm: number | null;
  // Every night of the stay, for all rooms; pricePerNight is the average.
  totalPrice: Money;
  taxesIncluded: boolean;
}

export type HotelSort = "recommended" | "price_asc" | "price_desc" | "stars_desc" | "distance";

// The point distances are measured from: a well-known landmark for popular
// destinations ("Charminar"), otherwise the middle of the area's hotels.
export interface SearchCentre {
  name: string;
  kind: "landmark" | "hotels";
}

// Narrows a search's results. Sent as query parameters with the paging
// options (?stars=4,5&freeCancellation=true&minPrice=&maxPrice=).
export interface HotelFilters {
  // Star categories to keep; 0 means hotels without a star category.
  stars?: number[];
  freeCancellation?: boolean;
  // A rate with a meal plan (breakfast or more), not room only.
  mealIncluded?: boolean;
  // Property types to keep ("Hotel", "Resort"…), as in HotelSearchResult.
  propertyTypes?: string[];
  // Hotels must offer every one of these.
  amenities?: HotelAmenity[];
  // Part of the property's name, any case.
  name?: string;
  // Within this many km of the search's centre.
  maxDistanceKm?: number;
  // Average price per night, in the search currency.
  minPrice?: number;
  maxPrice?: number;
}

// How many priced hotels have each feature, to label the filters. Counts
// cover every hotel priced so far, before filtering.
export interface HotelFacets {
  stars: Record<string, number>; // "5": 12, …; "0" for no star category
  freeCancellation: number;
  mealIncluded: number;
  propertyTypes: Record<string, number>;
  amenities: Partial<Record<HotelAmenity, number>>;
  // Range for the distance slider: up to what 95% of hotels are within,
  // rounded up to a whole km (the top end means "any distance"); null when
  // no hotel's distance is known.
  distanceKm: { max: number } | null;
  // Range for the budget slider in round numbers: from ₹1,000 (₹0 when
  // cheaper hotels exist) up to what 95% of hotels cost or less, rounded up to
  // a thousand (the top end means "or more"); null with no hotels.
  pricePerNight: { min: number; max: number } | null;
}

// One page of a hotel search: POST /api/v1/searches returns page 1, and
// GET /api/v1/searches/:searchId/results?page=&pageSize=&sort= the others.
export interface HotelSearchResponse {
  // Our search session ID; prices are indicative until re-checked (spec §4.2).
  searchId: string;
  expiresAt: string;
  criteria: HotelSearchRequest;
  nights: number;
  page: number;
  pageSize: number;
  sort: HotelSort;
  filters: HotelFilters;
  // Where distances are measured from; null when unknown.
  centre: SearchCentre | null;
  // Hotels matching the filters among those priced so far. Grows while
  // hasMore is true, because later pages ask the supplier about more hotels.
  total: number;
  // All hotels priced so far, before filtering.
  priced: number;
  facets: HotelFacets;
  // True once the supplier has no more hotels to price, so total is final.
  complete: boolean;
  hasMore: boolean;
  results: HotelSearchResult[];
  // True when the backend uses its sample supplier instead of TripJack.
  sample: boolean;
}

// ─── Hotel page: GET /api/v1/hotels/:id ─────────────────────────────────────

export interface HotelImage {
  url: string;
  caption: string | null;
}

// A titled block of plain text (descriptions and policies arrive as HTML from
// suppliers and are turned into paragraphs on the server).
export interface TextSection {
  title: string;
  paragraphs: string[];
}

// One kind of room at the hotel, from its content (not priced).
export interface HotelRoomType {
  id: string;
  name: string;
  paragraphs: string[];
  beds: string | null; // "1 King Bed"
  areaSqM: number | null;
  maxGuests: number | null;
  views: string[];
  amenities: string[];
  images: HotelImage[];
}

export interface HotelDetails {
  id: string;
  name: string;
  starRating: number | null;
  propertyType: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  headline: string | null;
  images: HotelImage[];
  // Overview first, then location, dining, rooms…
  description: TextSection[];
  facilities: string[];
  amenities: HotelAmenity[];
  // "14:00"-style times, when the hotel gives them.
  checkIn: { from: string | null; until: string | null; minAge: number | null };
  checkOut: { from: string | null; until: string | null };
  // Fees charged at the property come first: they must be shown before booking.
  policies: TextSection[];
  roomTypes: HotelRoomType[];
}

// ─── Hotel page rooms: GET /api/v1/hotels/:id/rooms?checkIn&…&searchId= ────

// One bookable choice: a room (or rooms) with a meal plan and rate rules.
export interface RoomOption {
  id: string;
  // Matches HotelRoomType.id when the supplier links them.
  roomTypeId: string | null;
  roomName: string; // "Deluxe Room" or "Deluxe + Suite" for mixed rooms
  mealPlan: string | null; // null = room only
  inclusions: string[];
  notes: string | null;
  freeCancellation: boolean;
  // Free cancellation ends at this India time (ISO, no zone), when refundable.
  freeCancellationUntil: string | null;
  // What cancelling costs from each moment (India time).
  cancellationCharges: { from: string; to: string; amount: Money }[];
  totalPrice: Money;
  pricePerNight: Money;
  // A crossed-out reference price, when the supplier gives one.
  strikethroughPrice: Money | null;
  priceBreakup: { base: number; taxes: number; managementFee: number; managementFeeTax: number; discount: number };
  panRequired: boolean;
  passportRequired: boolean;
}

export interface HotelRoomsResponse {
  hotelId: string;
  // Our session for these rates; checkout uses it with an option id.
  roomsId: string | null;
  expiresAt: string;
  criteria: HotelSearchCriteria;
  nights: number;
  // Cheapest first. Empty when nothing is available for the stay.
  options: RoomOption[];
  sample: boolean;
}

// ─── Home page (GET /api/v1/home/*) ─────────────────────────────────────────

// Live prices for fixed dates, so the home page can show real "from" prices.
export interface HomeHotelsResponse {
  checkIn: string;
  checkOut: string;
  nights: number;
  hotels: HotelSearchResult[];
}

// Hotels per destination, from the supplier; null when unknown.
export type DestinationStatsResponse = Record<string, number | null>;
