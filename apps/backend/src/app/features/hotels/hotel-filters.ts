import type { HotelAmenity, HotelFacets, HotelFilters, HotelSearchResult } from "@quickhotels/types/hotels";

const stars = (hotel: HotelSearchResult) => Math.round(hotel.starRating ?? 0);
// Results saved before amenities and distances existed have neither.
const amenitiesOf = (hotel: HotelSearchResult) => hotel.amenities ?? [];
const distanceOf = (hotel: HotelSearchResult) => hotel.distanceKm ?? null;

// Keeps the hotels that pass every filter given; no filters keeps them all.
export function filterHotels(results: HotelSearchResult[], filters: HotelFilters = {}): HotelSearchResult[] {
  const { stars: wanted, freeCancellation, mealIncluded, minPrice, maxPrice, propertyTypes, amenities, name, maxDistanceKm } = filters;
  const types = propertyTypes?.length ? new Set(propertyTypes.map((type) => type.toLowerCase())) : null;
  const named = name?.trim().toLowerCase();
  return results.filter(
    (hotel) =>
      (!wanted?.length || wanted.includes(stars(hotel))) &&
      (!freeCancellation || hotel.freeCancellation) &&
      (!mealIncluded || hotel.mealPlan !== null) &&
      (minPrice === undefined || hotel.pricePerNight.amount >= minPrice) &&
      (maxPrice === undefined || hotel.pricePerNight.amount <= maxPrice) &&
      (!types || types.has((hotel.propertyType ?? "").toLowerCase())) &&
      (!amenities?.length || amenities.every((amenity) => amenitiesOf(hotel).includes(amenity))) &&
      (!named || hotel.name.toLowerCase().includes(named)) &&
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
  return facets;
}
