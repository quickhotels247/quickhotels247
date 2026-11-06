import { addDaysIso, todayIso } from "@/lib/dates";

// Default stay and guests for hotel search: what the search bar starts with,
// and what links without dates (e.g. a destination card) search for.
export const searchDefaults = {
  // Days from today until check-in (0 = today).
  checkInInDays: 0,
  nights: 1,
  rooms: 1,
  adults: 2,
};

// The default stay in the visitor's own calendar (call it in the browser).
export function defaultStay() {
  const checkIn = addDaysIso(todayIso(), searchDefaults.checkInInDays);
  return { checkIn, checkOut: addDaysIso(checkIn, searchDefaults.nights) };
}
