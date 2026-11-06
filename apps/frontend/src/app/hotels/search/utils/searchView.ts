import type { HotelAmenity, HotelFilters, HotelSort } from "@quickhotels/types/hotels";
import { AMENITY_LABELS } from "@/config/hotelAmenities";

// What the visitor is looking at within one search: page, order and filters.
// It lives in the URL next to the search criteria, so it survives refreshes
// and can be shared; changing it never starts a new supplier search.
export interface SearchView extends HotelFilters {
  page: number;
  sort: HotelSort;
}

export const PAGE_SIZE = 20;

export const SORT_OPTIONS: { value: HotelSort; label: string }[] = [
  { value: "recommended", label: "Our top picks" },
  { value: "price_asc", label: "Price (lowest first)" },
  { value: "price_desc", label: "Price (highest first)" },
  { value: "stars_desc", label: "Stars (highest first)" },
  { value: "distance", label: "Distance from centre" },
];

const VIEW_KEYS = [
  "page", "sort", "stars", "freeCancellation", "mealIncluded", "minPrice", "maxPrice", "propertyTypes", "amenities", "name",
  "maxDistanceKm",
] as const;

const list = (value: string | null) => [...new Set((value ?? "").split(",").map((item) => item.trim()).filter(Boolean))];

const positive = (value: string | null) => {
  const number = Number(value);
  return value !== null && value !== "" && Number.isFinite(number) && number >= 0 ? number : undefined;
};

export function viewFromParams(params: URLSearchParams): SearchView {
  const sort = params.get("sort") as HotelSort | null;
  const stars = (params.get("stars") ?? "")
    .split(",")
    .map(Number)
    .filter((star) => Number.isInteger(star) && star >= 0 && star <= 5);
  return {
    page: Math.max(1, Math.floor(positive(params.get("page")) ?? 1)),
    sort: SORT_OPTIONS.some((option) => option.value === sort) ? sort! : "recommended",
    stars: params.get("stars") ? [...new Set(stars)] : undefined,
    freeCancellation: params.get("freeCancellation") === "true" || undefined,
    mealIncluded: params.get("mealIncluded") === "true" || undefined,
    minPrice: positive(params.get("minPrice")),
    maxPrice: positive(params.get("maxPrice")),
    propertyTypes: list(params.get("propertyTypes")).length ? list(params.get("propertyTypes")) : undefined,
    amenities: (() => {
      const known = list(params.get("amenities")).filter((id) => AMENITY_LABELS.some((amenity) => amenity.id === id));
      return known.length ? (known as HotelAmenity[]) : undefined;
    })(),
    name: params.get("name")?.trim() || undefined,
    maxDistanceKm: positive(params.get("maxDistanceKm")) || undefined,
  };
}

// The URL query with the view swapped in (defaults left out to keep links short).
export function withView(params: URLSearchParams, view: SearchView) {
  const next = new URLSearchParams(params);
  VIEW_KEYS.forEach((key) => next.delete(key));
  if (view.page > 1) next.set("page", String(view.page));
  if (view.sort !== "recommended") next.set("sort", view.sort);
  if (view.stars?.length) next.set("stars", [...view.stars].sort().join(","));
  if (view.freeCancellation) next.set("freeCancellation", "true");
  if (view.mealIncluded) next.set("mealIncluded", "true");
  if (view.minPrice !== undefined) next.set("minPrice", String(view.minPrice));
  if (view.maxPrice !== undefined) next.set("maxPrice", String(view.maxPrice));
  if (view.propertyTypes?.length) next.set("propertyTypes", [...view.propertyTypes].sort().join(","));
  if (view.amenities?.length) next.set("amenities", [...view.amenities].sort().join(","));
  if (view.name?.trim()) next.set("name", view.name.trim());
  if (view.maxDistanceKm !== undefined) next.set("maxDistanceKm", String(view.maxDistanceKm));
  return next.toString();
}

export const filtersOf = ({ page: _page, sort: _sort, ...filters }: SearchView): HotelFilters => filters;

// How many filters are on, for the "Filters (2)" button.
export function activeFilterCount(filters: HotelFilters) {
  return (
    (filters.stars?.length ? 1 : 0) +
    (filters.freeCancellation ? 1 : 0) +
    (filters.mealIncluded ? 1 : 0) +
    (filters.minPrice !== undefined || filters.maxPrice !== undefined ? 1 : 0) +
    (filters.propertyTypes?.length ?? 0) +
    (filters.amenities?.length ?? 0) +
    (filters.name ? 1 : 0) +
    (filters.maxDistanceKm !== undefined ? 1 : 0)
  );
}
