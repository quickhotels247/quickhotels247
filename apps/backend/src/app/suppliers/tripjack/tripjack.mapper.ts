import type { HotelSearchResult } from "@quickhotels/types/hotels";
import type { TripjackHotelContent, TripjackListingResponse, TripjackOption } from "./tripjack.types.js";
import { toAmenities } from "./tripjack-amenities.js";

// ─── Static content → our hotels / hotel_content_cache rows ────────────────

export interface HotelContentRow {
  supplierHotelId: string;
  regionId: string;
  name: string;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  starRating: number | null;
  propertyType: string | null;
  isActive: boolean;
  heroImageUrl: string | null;
  description: string | null;
  facilities: string[];
  images: { url: string; caption: string | null }[];
}

const MAX_IMAGES = 20;

// "MUMBAI" → "Mumbai", "NEW DELHI" → "New Delhi".
const titleCase = (text: string) => text.toLowerCase().replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());

// The largest size TripJack gives for an image (they vary by source).
const imageUrl = (links: Record<string, { href: string }>) =>
  links.XXL?.href ?? links.XL?.href ?? links.Standard?.href ?? Object.values(links)[0]?.href ?? null;

const numberOrNull = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export function contentToRow(hotel: TripjackHotelContent, regionId: string): HotelContentRow {
  const address = hotel.locale?.address;
  const images = (hotel.images ?? []).flatMap((image) => {
    const url = image.links ? imageUrl(image.links) : null;
    return url ? [{ url, caption: image.caption ?? null, hero: Boolean(image.is_hero_image) }] : [];
  });
  const hero = images.find((image) => image.hero) ?? images[0];
  const facilities = [...new Set(Object.values(hotel.amenities ?? {}).map((amenity) => amenity.name.trim()).filter(Boolean))];
  return {
    supplierHotelId: String(hotel.tjHotelId),
    regionId,
    name: hotel.name.trim(),
    address: address?.fulladdr?.trim() || null,
    city: address?.city ? titleCase(address.city) : null,
    country: address?.countryname ?? null,
    latitude: numberOrNull(hotel.locale?.coordinates?.lat),
    longitude: numberOrNull(hotel.locale?.coordinates?.long),
    starRating: numberOrNull(hotel.star_rating),
    propertyType: hotel.property_type?.name ?? null,
    isActive: hotel.is_active !== false,
    heroImageUrl: hero?.url ?? null,
    description: hotel.descriptions?.headline?.trim() || null,
    facilities,
    images: images.slice(0, MAX_IMAGES).map(({ url, caption }) => ({ url, caption })),
  };
}

// ─── Listing → our search results ──────────────────────────────────────────

// What we already know about a hotel from its cached content.
export interface CachedHotel {
  id: string;
  supplierHotelId: string;
  name: string;
  city: string | null;
  country: string | null;
  address: string | null;
  starRating: number | null;
  propertyType: string | null;
  heroImageUrl: string | null;
  // Facility names from the hotel's content, when cached.
  facilities: string[];
  latitude: number | null;
  longitude: number | null;
}

const cheapest = (options: TripjackOption[]) =>
  options.reduce<TripjackOption | undefined>((best, option) => (!best || option.pricing.totalPrice < best.pricing.totalPrice ? option : best), undefined);

// One listed hotel with its cheapest option. totalPrice already includes
// taxes and the management fee and its tax (totalPrice = base + taxes + mf + mft).
export function listingToResult(
  listed: TripjackListingResponse["hotels"][number],
  cached: CachedHotel,
  nights: number,
): HotelSearchResult | null {
  const option = cheapest(listed.options ?? []);
  if (!option) return null;
  const total = option.pricing.totalPrice;
  const currency = option.pricing.currency || "INR";
  return {
    id: cached.id,
    name: cached.name || listed.name,
    city: cached.city ?? "",
    country: cached.country ?? "",
    // TripJack has no guest reviews; the star category is in starRating.
    rating: null,
    reviewCount: null,
    starRating: cached.starRating,
    imageUrl: cached.heroImageUrl ?? "",
    address: cached.address,
    propertyType: cached.propertyType,
    mealPlan: option.mealBasis && option.mealBasis !== "Room Only" ? option.mealBasis : null,
    freeCancellation: option.cancellation?.isRefundable ?? false,
    amenities: toAmenities(cached.facilities),
    // Filled in by the supplier, which knows the search's centre.
    distanceKm: null,
    pricePerNight: { amount: Math.round((total / nights) * 100) / 100, currency },
    totalPrice: { amount: total, currency },
    taxesIncluded: true,
  };
}
