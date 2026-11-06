import type { FlightFareRule, FlightPriceBreakdown, FlightTravellerRequirements, ReviewedFare } from "@quickhotels/types/flight-checkout";
import type { FlightJourney, FlightSearchCriteria } from "@quickhotels/types/flights";
import type { Money } from "@quickhotels/types/hotels";
import { baggage, toLegs, tripLabel } from "./tripjack-flight.mapper.js";
import type { TripjackFareRulePolicy, TripjackFareRuleResponse, TripjackFlightReviewResponse, TripjackPaxType } from "./tripjack-flight.types.js";

const CURRENCY = "INR";
const money = (amount: number): Money => ({ amount: Math.round(amount * 100) / 100, currency: CURRENCY });
const REFUNDABILITY = { 0: "NON_REFUNDABLE", 1: "REFUNDABLE", 2: "PARTIALLY_REFUNDABLE" } as const;
const PAX: { type: "adult" | "child" | "infant"; key: TripjackPaxType; count: (criteria: FlightSearchCriteria) => number }[] = [
  { type: "adult", key: "ADULT", count: (criteria) => criteria.adults },
  { type: "child", key: "CHILD", count: (criteria) => criteria.children },
  { type: "infant", key: "INFANT", count: (criteria) => criteria.infants },
];

export interface MappedFlightReview {
  journeys: FlightJourney[];
  fares: ReviewedFare[];
  price: FlightPriceBreakdown;
  requirements: FlightTravellerRequirements;
  holdAllowed: boolean;
  // When TripJack stops holding the fare.
  expiresAt: Date;
}

// TripJack's review → journeys, fares, price breakdown and traveller needs.
// `tripKeys` are the lists the fares were chosen from, in the same order.
export function toFlightReview(review: TripjackFlightReviewResponse, criteria: FlightSearchCriteria, tripKeys: string[]): MappedFlightReview {
  const trips = review.tripInfos ?? [];
  const journeys = trips.flatMap((trip) => toLegs(trip.sI ?? []));
  const fares = trips.map((trip, i): ReviewedFare => {
    const price = trip.totalPriceList?.[0];
    const adult = price?.fd.ADULT;
    const key = tripKeys[i] ?? String(i);
    return {
      trip: key,
      label: tripLabel(key, criteria),
      airlines: [...new Set((trip.sI ?? []).map((segment) => segment.fD.aI.name))].join(", "),
      fareType: price?.fareIdentifier ?? "",
      refundable: REFUNDABILITY[(adult?.rT ?? 0) as 0 | 1 | 2] ?? "NON_REFUNDABLE",
      baggage: { checkIn: baggage(adult?.bI?.iB), cabin: baggage(adult?.bI?.cB) },
      cabin: adult?.cc ?? "ECONOMY",
    };
  });

  // Totals for everyone come from totalFareDetail; per-person fares from each trip.
  const total = review.totalPriceInfo?.totalFareDetail;
  const extras = total?.afC?.TAF ?? {};
  const serviceFee = extras.MF ?? 0;
  const serviceFeeTax = extras.MFT ?? 0;
  const perTraveller = PAX.filter((pax) => pax.count(criteria) > 0).map((pax) => ({
    type: pax.type,
    count: pax.count(criteria),
    each: money(trips.reduce((sum, trip) => sum + (trip.totalPriceList?.[0]?.fd[pax.key]?.fC.TF ?? 0), 0)),
  }));
  const conditions = review.conditions ?? {};
  return {
    journeys,
    fares,
    price: {
      base: money(total?.fC.BF ?? 0),
      taxes: money((total?.fC.TAF ?? 0) - serviceFee - serviceFeeTax),
      serviceFee: money(serviceFee),
      serviceFeeTax: money(serviceFeeTax),
      total: money(total?.fC.TF ?? 0),
      perTraveller,
    },
    requirements: {
      passport: Boolean(conditions.pcs?.pm),
      passportExpiry: Boolean(conditions.pcs?.pped),
      dateOfBirth: { adult: Boolean(conditions.dob?.adobr), child: Boolean(conditions.dob?.cdobr), infant: Boolean(conditions.dob?.idobr) },
      pan: Boolean(conditions.ipa),
      gst: conditions.gst?.igm ? "required" : conditions.gst?.gstappl ? "optional" : "none",
      emergencyContact: Boolean(conditions.iecr),
      nameLimits: conditions.anlm?.fN && conditions.anlm.lN ? { first: conditions.anlm.fN, last: conditions.anlm.lN, total: conditions.anlm.n ?? conditions.anlm.fN + conditions.anlm.lN } : null,
    },
    holdAllowed: Boolean(conditions.isBA),
    // TripJack holds the fare for `st` seconds (30 minutes by default).
    expiresAt: new Date(Date.now() + (conditions.st ?? 1800) * 1000),
  };
}

const RULE_TYPES = { CANCELLATION: "cancellation", DATECHANGE: "dateChange", NO_SHOW: "noShow" } as const;
const HOURS_IN_YEAR = 8760;

// "Any time", "More than 4 hours before departure", "Within 4 hours of departure",
// "Between 4 and 24 hours before departure", or the period TripJack names.
function when(policy: TripjackFareRulePolicy): string {
  if (policy.pp === "AFTER_DEPARTURE") return "After departure";
  if (policy.pp === "BEFORE_DEPARTURE") return "Before departure";
  if (policy.pp === "DEFAULT") return "Any time";
  const start = Number(policy.st ?? 0);
  const end = Number(policy.et ?? HOURS_IN_YEAR);
  const hours = (value: number) => `${value} hour${value === 1 ? "" : "s"}`;
  if (start <= 0 && end >= HOURS_IN_YEAR) return "Any time";
  if (end >= HOURS_IN_YEAR) return `More than ${hours(start)} before departure`;
  if (start <= 0) return `Within ${hours(end)} of departure`;
  return `Between ${hours(start)} and ${hours(end)} before departure`;
}

// Fare rules → cancellation, date change and no-show rules per route, in that
// order, each from furthest before departure to closest.
export function toFareRules(response: TripjackFareRuleResponse): FlightFareRule[] {
  const rules: (FlightFareRule & { start: number })[] = [];
  for (const [route, info] of Object.entries(response.fareRule ?? {})) {
    for (const [key, type] of Object.entries(RULE_TYPES) as [keyof typeof RULE_TYPES, FlightFareRule["type"]][]) {
      for (const policy of info.tfr?.[key] ?? []) {
        rules.push({
          start: Number(policy.st ?? 0),
          type,
          route,
          when: when(policy),
          airlineFee: typeof policy.amount === "number" ? money(policy.amount) : null,
          serviceFee: typeof policy.additionalFee === "number" && policy.additionalFee > 0 ? money(policy.additionalFee) : null,
          // TripJack separates lines with "__nls__".
          notes: (policy.policyInfo ?? "").split("__nls__").map((line) => line.trim()).filter(Boolean),
        });
      }
    }
  }
  const order = Object.values(RULE_TYPES);
  return rules
    .sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type) || a.route.localeCompare(b.route) || b.start - a.start)
    .map(({ start: _start, ...rule }) => rule);
}
