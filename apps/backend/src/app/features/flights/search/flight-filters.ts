import type { DepartWindow, FlightFacets, FlightFilters, FlightHighlights, FlightOption } from "@quickhotels/types/flights";

export const DEPART_WINDOWS: DepartWindow[] = ["early", "morning", "afternoon", "evening"];

// Stops of the fare: the most on any of its flights (a round trip in one fare
// is "non-stop" only when both ways are), two or more counted together.
export const stopsOf = (option: FlightOption) => Math.min(2, Math.max(0, ...option.legs.map((leg) => leg.stops)));

// The part of the day the first flight leaves, from its local time "…T05:45".
export function windowOf(option: FlightOption): DepartWindow {
  const hour = Number(option.legs[0]?.departAt.slice(11, 13) ?? 0);
  return hour < 6 ? "early" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
}

const airlineCodes = (option: FlightOption) => new Set(option.legs.flatMap((leg) => leg.segments.map((segment) => segment.airlineCode)));
export const totalMinutes = (option: FlightOption) => option.legs.reduce((sum, leg) => sum + leg.durationMins, 0);

// Keeps the fares that pass every filter given; no filters keeps them all.
// An airline matches when it operates any flight of the fare.
export function filterFlights(options: FlightOption[], filters: FlightFilters = {}): FlightOption[] {
  const { stops, airlines, departWindows, maxPrice, refundableOnly } = filters;
  return options.filter(
    (option) =>
      (!stops?.length || stops.includes(stopsOf(option))) &&
      (!airlines?.length || [...airlineCodes(option)].some((code) => airlines.includes(code))) &&
      (!departWindows?.length || departWindows.includes(windowOf(option))) &&
      (maxPrice === undefined || option.price.amount <= maxPrice) &&
      (!refundableOnly || option.refundable !== "NON_REFUNDABLE"),
  );
}

// Counts for the filter panel, over the whole list (before filtering).
export function flightFacets(options: FlightOption[]): FlightFacets {
  const stops = new Map<number, { count: number; minPrice: number }>();
  const airlines = new Map<string, { name: string; count: number; minPrice: number }>();
  const windows = new Map<DepartWindow, number>();
  let refundable = 0;
  for (const option of options) {
    const price = option.price.amount;
    const stop = stops.get(stopsOf(option)) ?? { count: 0, minPrice: Infinity };
    stops.set(stopsOf(option), { count: stop.count + 1, minPrice: Math.min(stop.minPrice, price) });
    for (const code of airlineCodes(option)) {
      const name = option.legs.flatMap((leg) => leg.segments).find((segment) => segment.airlineCode === code)?.airlineName ?? code;
      const seen = airlines.get(code) ?? { name, count: 0, minPrice: Infinity };
      airlines.set(code, { name: seen.name, count: seen.count + 1, minPrice: Math.min(seen.minPrice, price) });
    }
    windows.set(windowOf(option), (windows.get(windowOf(option)) ?? 0) + 1);
    if (option.refundable !== "NON_REFUNDABLE") refundable++;
  }
  const prices = options.map((option) => option.price.amount);
  return {
    stops: [...stops.entries()].sort(([a], [b]) => a - b).map(([count, value]) => ({ stops: count, ...value })),
    airlines: [...airlines.entries()].map(([code, value]) => ({ code, ...value })).sort((a, b) => a.minPrice - b.minPrice),
    departWindows: DEPART_WINDOWS.filter((window) => windows.has(window)).map((window) => ({ window, count: windows.get(window)! })),
    price: prices.length ? { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) } : null,
    refundable,
  };
}

// The cheapest and the fastest fare (cheaper wins a tie), for the sort tabs.
export function flightHighlights(options: FlightOption[]): FlightHighlights {
  const summary = (option: FlightOption | undefined) => (option ? { price: option.price.amount, durationMins: totalMinutes(option) } : null);
  const cheapest = options.reduce<FlightOption | undefined>((best, option) => (!best || option.price.amount < best.price.amount ? option : best), undefined);
  const fastest = options.reduce<FlightOption | undefined>(
    (best, option) => (!best || totalMinutes(option) < totalMinutes(best) || (totalMinutes(option) === totalMinutes(best) && option.price.amount < best.price.amount) ? option : best),
    undefined,
  );
  return { cheapest: summary(cheapest), fastest: summary(fastest) };
}
