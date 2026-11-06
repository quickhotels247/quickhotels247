import type { FlightOption, FlightSort } from "@quickhotels/types/flights";
import { totalMinutes } from "./flight-filters.js";

// Cheapest, fastest or earliest first; ties go to the cheaper fare.
export function sortFlights(options: FlightOption[], sort: FlightSort): FlightOption[] {
  const byPrice = (a: FlightOption, b: FlightOption) => a.price.amount - b.price.amount;
  const compare: Record<FlightSort, (a: FlightOption, b: FlightOption) => number> = {
    price: byPrice,
    duration: (a, b) => totalMinutes(a) - totalMinutes(b) || byPrice(a, b),
    departure: (a, b) => (a.legs[0]?.departAt ?? "").localeCompare(b.legs[0]?.departAt ?? "") || byPrice(a, b),
  };
  return [...options].sort(compare[sort]);
}
