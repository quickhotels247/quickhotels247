import type { HotelAmenity, HotelFacets, HotelFilters, HotelSearchResult } from "@quickhotels/types/hotels";
import { fuzzyIncludes } from "../../common/utils/fuzzy.js";

const stars = (hotel: HotelSearchResult) => Math.round(hotel.starRating ?? 0);
// Results saved before amenities and distances existed have neither.
const amenitiesOf = (hotel: HotelSearchResult) => hotel.amenities ?? [];
const distanceOf = (hotel: HotelSearchResult) => hotel.distanceKm ?? null;
// The "Property name or area" box: every word typed must appear in the hotel's
// name or address, so "taj" and "banjara hills" both work, in any case and
// with a typo or two in longer words ("shamsabad").
const searchText = (hotel: HotelSearchResult) => `${hotel.name} ${hotel.address ?? ""}`.toLowerCase();
const words = (text: string | undefined) => text?.toLowerCase().split(/[\s,]+/).filter(Boolean) ?? [];

// Keeps the hotels that pass every filter given; no filters keeps them all.
export function filterHotels(results: HotelSearchResult[], filters: HotelFilters = {}): HotelSearchResult[] {
  const { stars: wanted, freeCancellation, mealIncluded, minPrice, maxPrice, propertyTypes, amenities, name, maxDistanceKm } = filters;
  const types = propertyTypes?.length ? new Set(propertyTypes.map((type) => type.toLowerCase())) : null;
  const named = words(name);
  return results.filter(
    (hotel) =>
      (!wanted?.length || wanted.includes(stars(hotel))) &&
      (!freeCancellation || hotel.freeCancellation) &&
      (!mealIncluded || hotel.mealPlan !== null) &&
      (minPrice === undefined || hotel.pricePerNight.amount >= minPrice) &&
      (maxPrice === undefined || hotel.pricePerNight.amount <= maxPrice) &&
      (!types || types.has((hotel.propertyType ?? "").toLowerCase())) &&
      (!amenities?.length || amenities.every((amenity) => amenitiesOf(hotel).includes(amenity))) &&
      (!named.length || named.every((word) => fuzzyIncludes(word, searchText(hotel)))) &&
      // Hotels without a known location can't be shown as "within" a distance.
      (maxDistanceKm === undefined || (distanceOf(hotel) !== null && distanceOf(hotel)! <= maxDistanceKm)),
  );
}

// The budget slider: a few very dear rooms (villas at ₹15 lakh a night)
// would squash everyone else's prices into one corner, so it stops at this
// share of hotels and means "this much or more". Ends are round numbers.
const PRICE_TOP_SHARE = 0.95;
const PRICE_ROUNDING = 1000;

// The value 95% of the (sorted) list are at or under.
const topShare = (sorted: number[]) => sorted[Math.max(0, Math.ceil(sorted.length * PRICE_TOP_SHARE) - 1)]!;

// Address parts that are never an area to suggest: states and union
// territories (with their short forms) and words like "District".
const NOT_AREAS = new Set([
  "andhra pradesh", "ap", "arunachal pradesh", "assam", "bihar", "chhattisgarh", "goa", "gujarat", "haryana",
  "himachal pradesh", "jharkhand", "karnataka", "kerala", "madhya pradesh", "maharashtra", "manipur", "meghalaya",
  "mizoram", "nagaland", "odisha", "punjab", "rajasthan", "sikkim", "tamil nadu", "telangana", "ts", "tn", "tripura",
  "uttar pradesh", "up", "uttarakhand", "west bengal", "wb", "delhi", "new delhi", "nct of delhi", "jammu and kashmir",
  "ladakh", "puducherry", "chandigarh", "andaman and nicobar islands", "lakshadweep", "india",
]);
const MAX_AREAS = 150;
const MAX_HOTEL_NAMES = 400;
const titleCase = (text: string) => text.toLowerCase().replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());

// The areas in an address: its comma-separated parts, without house numbers,
// postcodes, the city, the country or the state.
export function addressAreas(address: string | null, city: string, country: string): string[] {
  if (!address) return [];
  const skip = new Set([city.toLowerCase(), country.toLowerCase()]);
  return address
    .split(",")
    // "1-156/1 Madhura Nagar" → "Madhura Nagar"
    .map((part) => part.trim().replace(/^\S*\d\S*\s+/, "").replace(/\s+/g, " "))
    .filter((part) => {
      const key = part.toLowerCase();
      return part.length >= 3 && part.length <= 40 && !/\d/.test(part) && !/^(plot|s|sy|survey|door|h)\.?\s*no\b/i.test(part)
        && !/\bdistrict$/i.test(part) && !skip.has(key) && !NOT_AREAS.has(key);
    });
}

// Counts for the filter panel, over every priced hotel.
export function hotelFacets(results: HotelSearchResult[]): HotelFacets {
  const facets: HotelFacets = {
    stars: {}, freeCancellation: 0, mealIncluded: 0, propertyTypes: {}, amenities: {}, distanceKm: null, pricePerNight: null,
  };
  const add = <K extends string>(counts: Partial<Record<K, number>>, key: K) => (counts[key] = (counts[key] ?? 0) + 1);
  for (const hotel of results) {
    add(facets.stars, String(stars(hotel)));
    if (hotel.freeCancellation) facets.freeCancellation++;
    if (hotel.mealPlan !== null) facets.mealIncluded++;
    if (hotel.propertyType) add(facets.propertyTypes, hotel.propertyType);
    amenitiesOf(hotel).forEach((amenity: HotelAmenity) => add(facets.amenities, amenity));
  }
  const prices = results.map((hotel) => hotel.pricePerNight.amount).sort((a, b) => a - b);
  if (prices.length) {
    const top = topShare(prices);
    const min = prices[0]! >= PRICE_ROUNDING ? PRICE_ROUNDING : 0;
    const max = Math.max(min + PRICE_ROUNDING, Math.ceil(top / PRICE_ROUNDING) * PRICE_ROUNDING);
    facets.pricePerNight = { min, max };
  }
  // The distance slider likewise stops before the few far-out hotels.
  const distances = results.flatMap((hotel) => distanceOf(hotel) ?? []).sort((a, b) => a - b);
  if (distances.length) facets.distanceKm = { max: Math.max(1, Math.ceil(topShare(distances))) };

  // Each area once per hotel, spelled the way most hotels spell it.
  const areas = new Map<string, { count: number; spellings: Map<string, number> }>();
  for (const hotel of results) {
    const seen = new Set<string>();
    for (const part of addressAreas(hotel.address, hotel.city, hotel.country)) {
      const key = part.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const area = areas.get(key) ?? { count: 0, spellings: new Map() };
      area.count++;
      area.spellings.set(part, (area.spellings.get(part) ?? 0) + 1);
      areas.set(key, area);
    }
  }
  facets.areas = [...areas.values()]
    .map(({ count, spellings }) => {
      const [spelling] = [...spellings].sort(([, a], [, b]) => b - a)[0]!;
      return { name: spelling === spelling.toUpperCase() ? titleCase(spelling) : spelling, count };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, MAX_AREAS);
  facets.hotelNames = [...new Set(results.map((hotel) => hotel.name.trim()))].slice(0, MAX_HOTEL_NAMES);
  return facets;
}
