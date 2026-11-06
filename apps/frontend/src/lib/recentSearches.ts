import type { HotelSearchCriteria } from "@quickhotels/types/hotels";

// The visitor's last few hotel searches, kept in this browser only (spec §4.1:
// recent searches for returning visitors). Storage can be blocked or full, so
// every access is guarded and failures just mean no history.
const KEY = "quickhotels.recentSearches";
const MAX = 4;

export function readRecentSearches(): HotelSearchCriteria[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as HotelSearchCriteria[]).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(criteria: HotelSearchCriteria) {
  const same = (item: HotelSearchCriteria) =>
    item.destination.toLowerCase() === criteria.destination.toLowerCase() &&
    item.checkIn === criteria.checkIn &&
    item.checkOut === criteria.checkOut;
  try {
    const next = [criteria, ...readRecentSearches().filter((item) => !same(item))].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Without storage there's simply no history.
  }
}

export function clearRecentSearches() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
