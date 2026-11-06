import type { FlightOption, FlightTripSummary } from "@quickhotels/types/flights";

// Flights picked per direction when each is chosen separately (round trips,
// multi-city). Kept for the browser tab, so Back from the fare check (or a
// refresh) doesn't lose them. Storage can be unavailable; then picks just
// live in memory.
export type TripPicks = Record<string, FlightOption>;

const storageKey = (searchId: string) => `quickhotels.flightPicks:${searchId}`;

export function loadPicks(searchId: string): TripPicks {
  try {
    const saved = sessionStorage.getItem(storageKey(searchId));
    return saved ? (JSON.parse(saved) as TripPicks) : {};
  } catch {
    return {};
  }
}

export function savePicks(searchId: string, picks: TripPicks) {
  try {
    if (Object.keys(picks).length) sessionStorage.setItem(storageKey(searchId), JSON.stringify(picks));
    else sessionStorage.removeItem(storageKey(searchId));
  } catch {
    // Not saved; fine.
  }
}

// Time to allow between landing and the next flight leaving.
const MIN_GAP_MS = 60 * 60 * 1000;
// Local airport times ("2026-11-07T11:15"); fine for domestic trips, which are
// the ones chosen per direction.
const at = (local: string) => new Date(`${local}:00`).getTime();

// A problem with the picks so far: a later flight that leaves before (or
// within an hour of) the earlier one landing. Null when they fit.
export function pickProblem(trips: FlightTripSummary[], picks: TripPicks): { trip: string; message: string } | null {
  for (let i = 1; i < trips.length; i++) {
    const before = picks[trips[i - 1]!.key];
    const after = picks[trips[i]!.key];
    const landed = before?.legs.at(-1)?.arriveAt;
    const leaves = after?.legs[0]?.departAt;
    if (landed && leaves && at(leaves) < at(landed) + MIN_GAP_MS) {
      return {
        trip: trips[i]!.key,
        message: `${trips[i]!.label.split(":")[0]} leaves before or within an hour of ${trips[i - 1]!.label.split(":")[0].toLowerCase()} landing. Choose a later flight.`,
      };
    }
  }
  return null;
}
