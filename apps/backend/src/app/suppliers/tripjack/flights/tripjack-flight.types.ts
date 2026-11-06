// TripJack Flights API v2 shapes we read, from docs/tripjack/flight-api.txt
// and real UAT responses (2026-11-04). TripJack sends more fields.
import type { TripjackEnvelope } from "../tripjack.types.js";

export type TripjackPaxType = "ADULT" | "CHILD" | "INFANT";

export interface TripjackFlightSearchRequest {
  searchQuery: {
    cabinClass: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
    paxInfo: Record<TripjackPaxType, number>;
    routeInfos: { fromCityOrAirport: { code: string }; toCityOrAirport: { code: string }; travelDate: string }[];
    searchModifiers?: { isDirectFlight?: boolean };
  };
}

export interface TripjackSegment {
  id: string;
  fD: { aI: { code: string; name: string; isLcc?: boolean }; fN: string; eT?: string };
  stops: number;
  duration: number; // minutes
  da: { code: string; name?: string; city?: string } | string;
  aa: { code: string; name?: string; city?: string } | string;
  dt: string; // local departure, "2026-11-25T05:45"
  at: string; // local arrival
  isRs?: boolean; // part of the return journey
  sN?: number; // segment number within its journey (0 starts a journey)
}

export interface TripjackPaxFare {
  fC: { TF: number; BF: number; TAF: number; NF?: number };
  rT?: number; // 0 non-refundable, 1 refundable, 2 partially refundable
  bI?: { iB?: string; cB?: string };
  sR?: number;
  cc?: string;
}

export interface TripjackPrice {
  id: string; // priceId for Review, valid 15 minutes
  fareIdentifier: string;
  fd: Partial<Record<TripjackPaxType, TripjackPaxFare>>;
}

export interface TripjackTripInfo {
  sI: TripjackSegment[];
  totalPriceList: TripjackPrice[];
}

export interface TripjackFlightSearchResponse extends TripjackEnvelope {
  searchResult?: { tripInfos?: Record<string, TripjackTripInfo[]> };
}

// POST /fms/v1/review: the chosen priceIds, confirmed, and a bookingId.
export interface TripjackFlightReviewResponse extends TripjackEnvelope {
  bookingId: string;
  tripInfos: TripjackTripInfo[];
  totalPriceInfo?: {
    totalFareDetail?: {
      fC: { TF: number; BF: number; TAF: number; NF?: number };
      // Breakdown of TAF: MF (management fee), MFT (its tax), YQ, OT…
      afC?: { TAF?: Record<string, number> };
    };
  };
  conditions?: {
    st?: number; // seconds the bookingId stays valid
    sct?: string;
    isBA?: boolean; // hold allowed
    iecr?: boolean; // emergency contact required
    ipa?: boolean; // PAN applicable
    pcs?: { pm?: boolean; pped?: boolean };
    dob?: { adobr?: boolean; cdobr?: boolean; idobr?: boolean };
    gst?: { igm?: boolean; gstappl?: boolean };
    anlm?: { fN?: number; lN?: number; n?: number }; // name length limits
  };
  // FAREALERT when the fare changed since search.
  alerts?: { type: string; oldFare?: number; newFare?: number }[];
}

export interface TripjackFareRulePolicy {
  amount?: number;
  additionalFee?: number;
  policyInfo?: string;
  st?: string | number; // hours before departure the rule starts applying
  et?: string | number;
  pp?: "BEFORE_DEPARTURE" | "AFTER_DEPARTURE" | "DEFAULT";
}

// POST /fms/v2/farerule
export interface TripjackFareRuleResponse extends TripjackEnvelope {
  fareRule?: Record<string, { tfr?: Partial<Record<"CANCELLATION" | "DATECHANGE" | "NO_SHOW" | "SEAT_CHARGEABLE", TripjackFareRulePolicy[]>>; miscInfo?: unknown }>;
}
