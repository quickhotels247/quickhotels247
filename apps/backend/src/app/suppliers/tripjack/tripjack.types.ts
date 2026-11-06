// TripJack Hotel API v3 shapes we use, from docs/tripjack/hotel-api-v3.txt.
// Only the fields we read are typed; TripJack may send more.

export interface TripjackStatus {
  success: boolean;
  httpStatus?: number;
}

export interface TripjackErrorItem {
  errCode?: string;
  // e.g. "OPTION_SOLD_OUT" from Review.
  errorType?: string;
  message?: string;
}

// Every response carries `status`, and `errors` when something went wrong.
export interface TripjackEnvelope {
  status?: TripjackStatus;
  errors?: TripjackErrorItem[];
}

export interface TripjackRoomRequest {
  adults: number;
  children?: number;
  childAge?: number[];
}

// POST /hms/v3/hotel/listing
export interface TripjackListingRequest {
  checkIn: string; // YYYY-MM-DD
  checkOut: string;
  rooms: TripjackRoomRequest[]; // 1–9, each 1–6 adults, 0–4 children
  currency: string;
  correlationId: string;
  nationality: string; // countryId from nationality-info
  timeoutMs?: number;
  hids: number[] | string[]; // up to 100 tjHotelIds
}

export interface TripjackPricing {
  totalPrice: number; // basePrice + taxes + mf + mft
  basePrice: number;
  discount: number;
  taxes: number;
  mf: number; // management fee
  mft: number; // management fee tax
  currency: string;
  strikethrough?: number;
}

export interface TripjackPenalty {
  from: string;
  to: string;
  amount: number;
}

export interface TripjackOption {
  optionId: string;
  optionType: "SRSM" | "SRCM" | "CRSM" | "CRCM";
  roomInfo: { id: string; name: string; adults?: number; children?: number }[];
  inclusions: string[];
  mealBasis: string;
  bookingNotes?: string;
  pricing: TripjackPricing;
  commercial?: { type: "NET" | "COMMISSIONABLE"; commission: number };
  compliance?: { gstType: string; panRequired: boolean; passportRequired: boolean };
  cancellation?: { isRefundable: boolean; penalties: TripjackPenalty[] };
}

export interface TripjackListingResponse extends TripjackEnvelope {
  correlationId: string;
  nationality: string;
  currency: string;
  totalResults: number;
  // Only hotels with availability. The docs say tjHotelId; the API sends hotelId.
  hotels: { hotelId: string; name: string; options: TripjackOption[] }[];
}

// GET /hms/v3/content/fetch-city-regionIds
export interface TripjackCityRegionsResponse extends TripjackEnvelope {
  hotelCityRegionIds: {
    cityName: string;
    cityRegionId: number;
    regionName: string;
    countryName: string;
    regionType: string;
    fullRegionName: string;
  }[];
  nextCursor?: string;
  hasMore?: boolean;
}

// POST /hms/v3/content/fetch-hotel-mapping
export interface TripjackHotelMappingRequest {
  countryName?: string;
  regionIds?: string[];
  page: number;
  size: number; // ≤ 2000
}

export interface TripjackHotelMappingResponse extends TripjackEnvelope {
  hotels: { tjHotelId: string; unicaId: string }[];
  pageable: { pageNumber: number; totalPages: number; totalElements: number };
}

// POST /hms/v3/content/fetch-hotel-content
export interface TripjackHotelContent {
  tjHotelId: string;
  name: string;
  is_active?: boolean;
  star_rating?: string;
  property_type?: { id: string; name: string };
  locale?: {
    address?: { fulladdr?: string; city?: string; statename?: string; countryname?: string; countrycode?: string };
    coordinates?: { lat: number; long: number };
  };
  amenities?: Record<string, { id: string; name: string }>;
  images?: TripjackImage[];
  // HTML strings. `default` is sometimes a JSON string of sections instead.
  descriptions?: Record<string, string | undefined>;
  policies?: {
    checkInCheckOut?: {
      checkin_from?: string;
      checkin_till?: string;
      checkout_from?: string;
      checkout_till?: string;
      checkin_min_age?: string;
    };
    instructions?: string;
    special_instructions?: string;
    know_before_you_go?: string;
    mandatory_fees?: string;
    optional_fees?: string;
    houseRules?: Record<string, string>;
  };
  rooms?: Record<string, TripjackRoomContent>;
}

export interface TripjackImage {
  caption?: string;
  is_hero_image?: boolean;
  hero_image?: boolean;
  links: Record<string, { href: string }>;
}

export interface TripjackRoomContent {
  id: string;
  name: string;
  descriptions?: { overview?: string };
  amenities?: Record<string, { id: string; name: string }>;
  images?: TripjackImage[];
  bed_config?: { description?: string };
  area?: { square_meters?: number };
  views?: Record<string, { id: string; name: string }>;
  occupancy?: { max_allowed?: { total?: number; adults?: number; children?: number } };
}

// POST /hms/v3/hotel/review: the chosen option, confirmed, and the bookingId for Book.
export interface TripjackReviewResponse extends TripjackEnvelope {
  correlationId: string;
  tjHotelId: string;
  hotelName: string;
  bookingId: string;
  option: TripjackOption & { cancellation?: { deadlineDateTime?: string } };
  onholdAllowed?: string | boolean;
}

// POST /hms/v3/hotel/pricing: every option for one hotel.
export interface TripjackPricingResponse extends TripjackEnvelope {
  tjHotelId: string;
  hotelName: string;
  options: TripjackOption[];
  reviewHash?: string;
  correlationId: string;
}

export interface TripjackHotelContentResponse extends TripjackEnvelope {
  hotels: TripjackHotelContent[];
}

// GET /hms/v3/nationality-info
export interface TripjackNationalitiesResponse extends TripjackEnvelope {
  nationalityInfos: { countryId: string; name: string; code: string; isoCode: string }[];
}
