import { addDays, todayInIndia } from "../utils/india-dates.js";

// Default dates for searches and the prices shown on the home and flights
// pages, in days from today (India).
export const STAY_DEFAULTS = {
  // A hotel search sent without dates: today → tomorrow.
  searchCheckInInDays: 0,
  searchNights: 1,
  // Home page "Top Rated Hotels" prices: one night, two weeks out.
  topHotelsCheckInInDays: 14,
  topHotelsNights: 1,
  // Flights page "Popular flights near you" fares: out in 3 weeks, back 4 nights later.
  popularRoutesDepartInDays: 21,
  popularRoutesNights: 4,
};

// The default stay for a search sent without dates.
export function defaultSearchStay() {
  const checkIn = addDays(todayInIndia(), STAY_DEFAULTS.searchCheckInInDays);
  return { checkIn, checkOut: addDays(checkIn, STAY_DEFAULTS.searchNights) };
}
