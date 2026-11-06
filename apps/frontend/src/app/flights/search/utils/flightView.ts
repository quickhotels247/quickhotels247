import type { DepartWindow, FlightFilters, FlightSort } from "@quickhotels/types/flights";

// What the visitor is looking at within one flight search: which list, its
// order, page and filters. Kept in the URL next to the search, so it survives
// refreshes; changing it never starts a new supplier search.
export interface FlightView extends FlightFilters {
  trip?: string;
  page: number;
  sort: FlightSort;
}

export const PAGE_SIZE = 15;
const SORTS: FlightSort[] = ["price", "duration", "departure"];
const WINDOWS: DepartWindow[] = ["early", "morning", "afternoon", "evening"];
const VIEW_KEYS = ["trip", "page", "sort", "stops", "airlines", "departWindows", "maxPrice", "refundableOnly"] as const;

const list = (value: string | null) => [...new Set((value ?? "").split(",").map((item) => item.trim()).filter(Boolean))];

export function flightViewFromParams(params: URLSearchParams): FlightView {
  const stops = list(params.get("stops")).map(Number).filter((stop) => [0, 1, 2].includes(stop));
  const airlines = list(params.get("airlines")).filter((code) => /^[A-Z0-9]{2,3}$/.test(code));
  const windows = list(params.get("departWindows")).filter((window): window is DepartWindow => WINDOWS.includes(window as DepartWindow));
  const maxPrice = Number(params.get("maxPrice"));
  return {
    trip: params.get("trip") || undefined,
    page: Math.max(1, Math.floor(Number(params.get("page")) || 1)),
    sort: SORTS.find((sort) => sort === params.get("sort")) ?? "price",
    stops: stops.length ? stops : undefined,
    airlines: airlines.length ? airlines : undefined,
    departWindows: windows.length ? windows : undefined,
    maxPrice: params.get("maxPrice") && Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : undefined,
    refundableOnly: params.get("refundableOnly") === "true" || undefined,
  };
}

// The URL query with the view swapped in (defaults left out to keep links short).
export function withFlightView(params: URLSearchParams, view: FlightView) {
  const next = new URLSearchParams(params);
  // Only view keys: search criteria such as directOnly stay as they are
  // (removing one would start a new supplier search).
  VIEW_KEYS.forEach((key) => next.delete(key));
  if (view.trip) next.set("trip", view.trip);
  if (view.page > 1) next.set("page", String(view.page));
  if (view.sort !== "price") next.set("sort", view.sort);
  if (view.stops?.length) next.set("stops", [...view.stops].sort().join(","));
  if (view.airlines?.length) next.set("airlines", [...view.airlines].sort().join(","));
  if (view.departWindows?.length) next.set("departWindows", view.departWindows.join(","));
  if (view.maxPrice !== undefined) next.set("maxPrice", String(view.maxPrice));
  if (view.refundableOnly) next.set("refundableOnly", "true");
  return next.toString();
}

export const filtersOfView = ({ trip: _trip, page: _page, sort: _sort, ...filters }: FlightView): FlightFilters => filters;

export const activeFlightFilters = (filters: FlightFilters) =>
  (filters.stops?.length ? 1 : 0) +
  (filters.airlines?.length ?? 0) +
  (filters.departWindows?.length ? 1 : 0) +
  (filters.maxPrice !== undefined ? 1 : 0) +
  (filters.refundableOnly ? 1 : 0);
