import type { CabinClass, FlightLeg, FlightSearchCriteria } from "@quickhotels/types/flights";
import { routes } from "@/config/navigation";
import { todayIso } from "@/lib/dates";

export const TRAVELLER_LIMITS = {
  adults: { min: 1, max: 9 },
  children: { min: 0, max: 8 },
  infants: { min: 0, max: 4 },
};

export const MAX_LEGS = 5;
export const emptyLeg: FlightLeg = { from: "", to: "", depart: "" };

export const cabinLabels: Record<CabinClass, string> = {
  economy: "Economy",
  premiumEconomy: "Premium economy",
  business: "Business",
  first: "First class",
};

export const emptyFlightCriteria: FlightSearchCriteria = {
  tripType: "roundTrip",
  from: "",
  to: "",
  depart: "",
  return: "",
  legs: [emptyLeg, emptyLeg],
  adults: 1,
  children: 0,
  infants: 0,
  cabin: "economy",
  directOnly: false,
};

export type FlightSearchErrors = Partial<Record<"route" | "dates" | "travellers", string>>;

function validateLegs(legs: FlightLeg[], errors: FlightSearchErrors) {
  if (legs.some((leg) => !leg.from || !leg.to)) errors.route = "Choose where each flight leaves from and goes to.";
  else if (legs.some((leg) => leg.from === leg.to)) errors.route = "Each flight needs different From and To airports.";
  if (legs.some((leg) => !leg.depart)) errors.dates = "Choose a date for each flight.";
  else if (legs[0].depart < todayIso()) errors.dates = "The first flight can't be in the past.";
  else if (legs.some((leg, index) => index > 0 && leg.depart < legs[index - 1].depart)) {
    errors.dates = "Each flight must be on or after the one before it.";
  }
}

export function validateFlightCriteria(criteria: FlightSearchCriteria): FlightSearchErrors {
  const errors: FlightSearchErrors = {};
  if (criteria.tripType === "multiCity") {
    validateLegs(criteria.legs, errors);
    if (criteria.infants > criteria.adults) errors.travellers = "Each infant needs an adult to travel with.";
    return errors;
  }
  if (!criteria.from || !criteria.to) errors.route = "Choose where you're flying from and to.";
  else if (criteria.from === criteria.to) errors.route = "From and To must be different airports.";

  const roundTrip = criteria.tripType === "roundTrip";
  if (!criteria.depart || (roundTrip && !criteria.return)) {
    errors.dates = roundTrip ? "Choose your departure and return dates." : "Choose your departure date.";
  } else if (criteria.depart < todayIso()) {
    errors.dates = "Departure can't be in the past.";
  } else if (roundTrip && criteria.return < criteria.depart) {
    errors.dates = "Return can't be before departure.";
  }

  // Airlines seat each infant on an adult's lap.
  if (criteria.infants > criteria.adults) errors.travellers = "Each infant needs an adult to travel with.";
  return errors;
}

// Criteria live in the URL so results can be refreshed and shared.
// Multi-city flights go in one "legs" value: DEL-BOM-2026-12-20,BOM-GOI-2026-12-24.
export function flightSearchUrl(criteria: FlightSearchCriteria) {
  const route: Record<string, string> =
    criteria.tripType === "multiCity"
      ? { legs: criteria.legs.map((leg) => `${leg.from}-${leg.to}-${leg.depart}`).join(",") }
      : {
          from: criteria.from,
          to: criteria.to,
          depart: criteria.depart,
          ...(criteria.tripType === "roundTrip" ? { return: criteria.return } : {}),
        };
  const params = new URLSearchParams({
    tripType: criteria.tripType,
    ...route,
    adults: String(criteria.adults),
    children: String(criteria.children),
    infants: String(criteria.infants),
    cabin: criteria.cabin,
    ...(criteria.directOnly ? { directOnly: "true" } : {}),
  });
  return `${routes.flightSearch}?${params}`;
}

const CABINS = Object.keys(cabinLabels) as CabinClass[];
const IATA = /^[A-Z]{3}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const count = (value: string | null, fallback: number, { min, max }: { min: number; max: number }) => {
  const number = Number(value);
  return value !== null && Number.isInteger(number) ? Math.min(max, Math.max(min, number)) : fallback;
};

// Reads criteria back from a flight search URL (the opposite of
// flightSearchUrl). Odd values fall back to defaults; validateFlightCriteria
// says whether the result can be searched.
export function flightCriteriaFromParams(params: URLSearchParams): FlightSearchCriteria {
  const tripType = (["roundTrip", "oneWay", "multiCity"] as const).find((type) => type === params.get("tripType")) ?? "roundTrip";
  const code = (key: string) => {
    const value = (params.get(key) ?? "").toUpperCase();
    return IATA.test(value) ? value : "";
  };
  const date = (key: string) => {
    const value = params.get(key) ?? "";
    return DATE.test(value) ? value : "";
  };
  const legs =
    tripType === "multiCity"
      ? (params.get("legs") ?? "")
          .split(",")
          .slice(0, MAX_LEGS)
          .map((leg) => {
            const [from = "", to = "", ...day] = leg.split("-");
            const depart = day.join("-");
            return { from: IATA.test(from) ? from : "", to: IATA.test(to) ? to : "", depart: DATE.test(depart) ? depart : "" };
          })
      : [emptyLeg, emptyLeg];
  const adults = count(params.get("adults"), 1, TRAVELLER_LIMITS.adults);
  return {
    tripType,
    from: code("from"),
    to: code("to"),
    depart: date("depart"),
    return: tripType === "roundTrip" ? date("return") : "",
    legs: legs.length >= 2 ? legs : [...legs, emptyLeg].slice(0, 2),
    adults,
    children: count(params.get("children"), 0, TRAVELLER_LIMITS.children),
    infants: Math.min(adults, count(params.get("infants"), 0, TRAVELLER_LIMITS.infants)),
    cabin: CABINS.find((cabin) => cabin === params.get("cabin")) ?? "economy",
    directOnly: params.get("directOnly") === "true",
  };
}
