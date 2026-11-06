import type { HotelSearchResult, HotelSort } from "@quickhotels/types/hotels";

// "recommended": the supplier's order (best-rated first, then cheapest).
export function sortHotels(results: HotelSearchResult[], sort: HotelSort): HotelSearchResult[] {
  if (sort === "recommended") return results;
  const sorted = [...results];
  if (sort === "price_asc") sorted.sort((a, b) => a.totalPrice.amount - b.totalPrice.amount);
  if (sort === "price_desc") sorted.sort((a, b) => b.totalPrice.amount - a.totalPrice.amount);
  // Nearest first; hotels without a known location last.
  if (sort === "distance") sorted.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
  if (sort === "stars_desc") sorted.sort((a, b) => (b.starRating ?? 0) - (a.starRating ?? 0) || a.totalPrice.amount - b.totalPrice.amount);
  return sorted;
}
