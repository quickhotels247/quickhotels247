// Flight shapes shared by the website and the backend. The backend will map
// TripJack's flight API (search, review, book, ticket) into these.

export interface Airport {
  code: string; // IATA code, e.g. "DEL"
  city: string;
  name: string;
  country: string;
}

export type TripType = "roundTrip" | "oneWay" | "multiCity";

// One flight of a multi-city trip.
export interface FlightLeg {
  from: string; // IATA code
  to: string; // IATA code
  depart: string; // YYYY-MM-DD
}

export type CabinClass = "economy" | "premiumEconomy" | "business" | "first";

// What the flight search bar sends to /flights/search.
export interface FlightSearchCriteria {
  tripType: TripType;
  from: string; // IATA code
  to: string; // IATA code
  depart: string; // YYYY-MM-DD
  return: string; // YYYY-MM-DD, empty for one-way
  // Multi-city only: two to five flights in order. from/to/depart above are
  // unused for multi-city trips.
  legs: FlightLeg[];
  adults: number;
  children: number; // 2–11 years
  infants: number; // under 2, on an adult's lap
  cabin: CabinClass;
  directOnly: boolean;
}

// ─── Results (POST /api/v1/flights/searches and …/results) ─────────────────

export interface FlightSegment {
  airlineCode: string;
  airlineName: string;
  flightNumber: string; // e.g. "6E 6045"
  from: string; // IATA
  to: string;
  departAt: string; // local time at the departure airport, "2026-11-25T05:45"
  arriveAt: string; // local time at the arrival airport
  durationMins: number;
}

// One direction of travel in a result: its segments and the layovers between them.
export interface FlightJourney {
  from: string;
  to: string;
  departAt: string;
  arriveAt: string;
  // Flying time plus layovers.
  durationMins: number;
  stops: number;
  segments: FlightSegment[];
}

export interface FlightOption {
  // The supplier's price ID, needed to review and book this fare.
  id: string;
  legs: FlightJourney[];
  // Airline(s) shown on the card, e.g. "IndiGo" or "IndiGo, Air India".
  airlines: string;
  fareType: string; // e.g. "PUBLISHED", "SPECIAL_RETURN"
  refundable: "REFUNDABLE" | "PARTIALLY_REFUNDABLE" | "NON_REFUNDABLE";
  baggage: { checkIn: string | null; cabin: string | null };
  seatsLeft: number | null;
  cabin: string;
  // For all travellers, taxes included.
  price: { amount: number; currency: string };
  pricePerAdult: { amount: number; currency: string };
}

// Which list a result belongs to. One-way: ONWARD. Domestic return: ONWARD
// and RETURN, chosen separately. International return: COMBO (both ways in
// one fare). Multi-city: one list per flight, or COMBO.
export interface FlightTripSummary {
  key: string;
  label: string;
  total: number;
}

export type FlightSort = "price" | "duration" | "departure";

// Parts of the day a flight leaves in (local time at the airport).
export type DepartWindow = "early" | "morning" | "afternoon" | "evening"; // 00–06, 06–12, 12–18, 18–24

// Narrows one list of a search. Sent as query parameters
// (?stops=0,1&airlines=6E,AI&depart=morning&maxPrice=&refundable=true).
// Stops and departure time look at the first flight of each fare.
export interface FlightFilters {
  // 0 = non-stop, 1 = one stop, 2 = two or more.
  stops?: number[];
  airlines?: string[]; // IATA airline codes
  departWindows?: DepartWindow[];
  // Price for all travellers.
  maxPrice?: number;
  refundableOnly?: boolean;
}

// Counts (and the cheapest price) for each filter, over the whole list.
export interface FlightFacets {
  stops: { stops: number; count: number; minPrice: number }[];
  airlines: { code: string; name: string; count: number; minPrice: number }[];
  departWindows: { window: DepartWindow; count: number }[];
  price: { min: number; max: number } | null;
  refundable: number;
}

// The cheapest and fastest fare among those matching the filters, for the
// "Cheapest / Fastest" sort tabs.
export interface FlightHighlights {
  cheapest: { price: number; durationMins: number } | null;
  fastest: { price: number; durationMins: number } | null;
}

export interface FlightSearchResponse {
  searchId: string;
  expiresAt: string;
  criteria: FlightSearchCriteria;
  trips: FlightTripSummary[];
  // The page below belongs to this trip.
  trip: string;
  page: number;
  pageSize: number;
  sort: FlightSort;
  filters: FlightFilters;
  facets: FlightFacets;
  highlights: FlightHighlights;
  // Fares matching the filters in this list.
  total: number;
  hasMore: boolean;
  results: FlightOption[];
}

// GET /api/v1/flights/popular-routes: cheapest recent round-trip fare.
export interface PopularRouteFare {
  from: string;
  to: string;
  depart: string;
  return: string;
  // Round trip, per adult, taxes included.
  price: { amount: number; currency: string };
  checkedAt: string;
}

// GET /api/v1/flights/fare-calendar?from=HYD&to=CCU&cabin=economy&start=2026-12-01&days=62
// The cheapest fare per adult seen in searches on our site in the last few
// hours, by departure day. Days nobody searched are left out.
export interface FareCalendar {
  currency: string;
  days: { date: string; amount: number }[];
}
