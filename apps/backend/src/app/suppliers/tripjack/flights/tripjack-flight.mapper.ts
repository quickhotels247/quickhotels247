import type { FlightJourney, FlightOption, FlightSearchCriteria, FlightSegment } from "@quickhotels/types/flights";
import type { TripjackFlightSearchRequest, TripjackPaxType, TripjackPrice, TripjackSegment, TripjackTripInfo } from "./tripjack-flight.types.js";

const CABINS = {
  economy: "ECONOMY",
  premiumEconomy: "PREMIUM_ECONOMY",
  business: "BUSINESS",
  first: "FIRST",
} as const;

// Our search → TripJack's air-search-all request.
export function toTripjackFlightSearch(criteria: FlightSearchCriteria): TripjackFlightSearchRequest {
  const route = (from: string, to: string, travelDate: string) => ({
    fromCityOrAirport: { code: from },
    toCityOrAirport: { code: to },
    travelDate,
  });
  const routeInfos =
    criteria.tripType === "multiCity"
      ? criteria.legs.map((leg) => route(leg.from, leg.to, leg.depart))
      : [
          route(criteria.from, criteria.to, criteria.depart),
          ...(criteria.tripType === "roundTrip" ? [route(criteria.to, criteria.from, criteria.return)] : []),
        ];
  return {
    searchQuery: {
      cabinClass: CABINS[criteria.cabin],
      paxInfo: { ADULT: criteria.adults, CHILD: criteria.children, INFANT: criteria.infants },
      routeInfos,
      ...(criteria.directOnly ? { searchModifiers: { isDirectFlight: true } } : {}),
    },
  };
}

const code = (place: TripjackSegment["da"]) => (typeof place === "string" ? place : place.code);
// Local times have no zone; both ends of a layover are at the same airport.
const minutesBetween = (from: string, to: string) => Math.round((Date.parse(`${to}Z`) - Date.parse(`${from}Z`)) / 60_000);

function toSegment(segment: TripjackSegment): FlightSegment {
  return {
    airlineCode: segment.fD.aI.code,
    airlineName: segment.fD.aI.name,
    flightNumber: `${segment.fD.aI.code} ${segment.fD.fN}`,
    from: code(segment.da),
    to: code(segment.aa),
    departAt: segment.dt,
    arriveAt: segment.at,
    durationMins: segment.duration,
  };
}

// Segments → journeys: a new journey starts at segment number 0 (or when the
// return flag flips), as in TripJack's COMBO and multi-city fares.
export function toLegs(segments: TripjackSegment[]): FlightJourney[] {
  const groups: TripjackSegment[][] = [];
  segments.forEach((segment, index) => {
    const previous = segments[index - 1];
    const startsJourney = index === 0 || segment.sN === 0 || Boolean(segment.isRs) !== Boolean(previous?.isRs);
    if (startsJourney) groups.push([segment]);
    else groups[groups.length - 1]!.push(segment);
  });
  return groups.map((group) => {
    const legSegments = group.map(toSegment);
    const first = legSegments[0]!;
    const last = legSegments[legSegments.length - 1]!;
    const layovers = legSegments.slice(1).reduce((sum, segment, i) => sum + Math.max(0, minutesBetween(legSegments[i]!.arriveAt, segment.departAt)), 0);
    return {
      from: first.from,
      to: last.to,
      departAt: first.departAt,
      arriveAt: last.arriveAt,
      durationMins: legSegments.reduce((sum, segment) => sum + segment.durationMins, 0) + layovers,
      stops: legSegments.length - 1 + group.reduce((sum, segment) => sum + (segment.stops ?? 0), 0),
      segments: legSegments,
    };
  });
}

const PAX: TripjackPaxType[] = ["ADULT", "CHILD", "INFANT"];

// Total for every traveller (TF is the per-person total including taxes).
const priceTotal = (price: TripjackPrice, counts: Record<TripjackPaxType, number>) =>
  PAX.reduce((sum, pax) => sum + (price.fd[pax]?.fC.TF ?? 0) * counts[pax], 0);

const REFUNDABILITY = { 0: "NON_REFUNDABLE", 1: "REFUNDABLE", 2: "PARTIALLY_REFUNDABLE" } as const;

// Baggage as airlines write it ("15 Kg", "15 KG (01 Piece only)"), with a
// unit added when TripJack sends a bare number ("5" means 5 Kg) and units
// written one way ("15Kilograms", "15 KGS" → "15 Kg").
export function baggage(value: string | undefined): string | null {
  const text = value?.trim();
  if (!text) return null;
  return /^\d+(\.\d+)?$/.test(text) ? `${text} Kg` : text.replace(/(\d)\s*(kilograms?|kgs?)\b/gi, "$1 Kg");
}

// One TripJack trip with its cheapest fare → our FlightOption.
export function toFlightOption(trip: TripjackTripInfo, criteria: FlightSearchCriteria): FlightOption | null {
  const counts = { ADULT: criteria.adults, CHILD: criteria.children, INFANT: criteria.infants };
  // Special Return fares are only valid paired with a matching return (their
  // sri/msri codes), which separate outbound and return lists can't ensure,
  // so they're left out and each flight shows its cheapest regular fare.
  const prices = (trip.totalPriceList ?? []).filter((price) => price.fareIdentifier !== "SPECIAL_RETURN");
  if (!trip.sI?.length || !prices.length) return null;
  const cheapest = prices.reduce((best, price) => (priceTotal(price, counts) < priceTotal(best, counts) ? price : best));
  const adult = cheapest.fd.ADULT;
  if (!adult) return null;
  const legs = toLegs(trip.sI);
  const airlines = [...new Set(legs.flatMap((leg) => leg.segments.map((segment) => segment.airlineName)))].join(", ");
  return {
    id: cheapest.id,
    legs,
    airlines,
    fareType: cheapest.fareIdentifier,
    refundable: REFUNDABILITY[(adult.rT ?? 0) as 0 | 1 | 2] ?? "NON_REFUNDABLE",
    baggage: { checkIn: baggage(adult.bI?.iB), cabin: baggage(adult.bI?.cB) },
    seatsLeft: adult.sR ?? null,
    cabin: adult.cc ?? CABINS[criteria.cabin],
    price: { amount: Math.round(priceTotal(cheapest, counts) * 100) / 100, currency: "INR" },
    pricePerAdult: { amount: adult.fC.TF, currency: "INR" },
  };
}

// Human labels for TripJack's trip keys.
export function tripLabel(key: string, criteria: FlightSearchCriteria): string {
  if (key === "ONWARD") return criteria.tripType === "roundTrip" ? `Departure: ${criteria.from} → ${criteria.to}` : `${criteria.from} → ${criteria.to}`;
  if (key === "RETURN") return `Return: ${criteria.to} → ${criteria.from}`;
  if (key === "COMBO") return criteria.tripType === "multiCity" ? "All flights" : `Round trip: ${criteria.from} ⇄ ${criteria.to}`;
  const leg = criteria.legs[Number(key)];
  return leg ? `Flight ${Number(key) + 1}: ${leg.from} → ${leg.to}` : key;
}
