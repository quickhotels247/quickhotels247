import type { HotelSearchCriteria } from "@quickhotels/types/hotels";
import { routes } from "@/config/navigation";
import { defaultStay, searchDefaults } from "@/config/searchDefaults";
import { todayIso } from "@/lib/dates";

export const GUEST_LIMITS = {
  rooms: { min: 1, max: 8 },
  adults: { min: 1, max: 16 },
  children: { min: 0, max: 8 },
  childAge: { min: 0, max: 17 },
};

// A child whose age hasn't been chosen yet (the form asks before searching).
export const AGE_NOT_SET = -1;

// A blank search. Dates start empty and the search bar fills in the default
// stay in the browser, where "today" is the visitor's own day.
export const emptyCriteria: HotelSearchCriteria = {
  destination: "",
  checkIn: "",
  checkOut: "",
  rooms: searchDefaults.rooms,
  adults: searchDefaults.adults,
  children: 0,
  childAges: [],
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Usable stay dates: real days, check-in from today, check-out after it.
export const hasUsableDates = ({ checkIn, checkOut }: Pick<HotelSearchCriteria, "checkIn" | "checkOut">) =>
  ISO_DATE.test(checkIn) && ISO_DATE.test(checkOut) && checkIn >= todayIso() && checkOut > checkIn;

// Keeps one age per child: drops ages of removed children and adds unset
// ones for new children.
export function resizeAges(ages: number[] = [], children: number) {
  return Array.from({ length: children }, (_, child) => ages[child] ?? AGE_NOT_SET);
}

export type SearchErrors = Partial<Record<"destination" | "dates" | "guests", string>>;

export function validateCriteria(criteria: HotelSearchCriteria): SearchErrors {
  const errors: SearchErrors = {};
  if (!criteria.destination.trim()) errors.destination = "Enter a city, area or hotel name.";
  if (!criteria.checkIn || !criteria.checkOut) {
    errors.dates = "Choose your check-in and check-out dates.";
  } else if (criteria.checkIn < todayIso()) {
    errors.dates = "Check-in can't be in the past.";
  } else if (criteria.checkOut <= criteria.checkIn) {
    errors.dates = "Check-out must be after check-in.";
  }
  if (criteria.adults < criteria.rooms) {
    errors.guests = "Each room needs at least one adult.";
  } else if (resizeAges(criteria.childAges, criteria.children).some((age) => age === AGE_NOT_SET)) {
    errors.guests = "Choose the age of each child.";
  }
  return errors;
}

// Search criteria live in the URL so results can be refreshed and shared (spec §4.1).
export function criteriaParams(criteria: HotelSearchCriteria) {
  const params = new URLSearchParams({
    destination: criteria.destination.trim(),
    checkIn: criteria.checkIn,
    checkOut: criteria.checkOut,
    rooms: String(criteria.rooms),
    adults: String(criteria.adults),
    children: String(criteria.children),
  });
  if (criteria.children > 0) params.set("childAges", resizeAges(criteria.childAges, criteria.children).join(","));
  return params;
}

export const searchUrl = (criteria: HotelSearchCriteria) => `${routes.hotels}?${criteriaParams(criteria)}`;

const whole = (value: string | null, fallback: number, { min, max }: { min: number; max: number }) => {
  const number = Number(value);
  return value !== null && Number.isInteger(number) ? Math.min(max, Math.max(min, number)) : fallback;
};

// Reads criteria back from a search URL. Missing or odd values fall back to
// defaults (no dates, or dates in the past, mean the default stay);
// validateCriteria says whether the result can be searched.
export function criteriaFromParams(params: URLSearchParams): HotelSearchCriteria {
  const children = whole(params.get("children"), 0, GUEST_LIMITS.children);
  const ages = (params.get("childAges") ?? "")
    .split(",")
    .filter(Boolean)
    .map((age) => whole(age, AGE_NOT_SET, GUEST_LIMITS.childAge));
  const dates = { checkIn: params.get("checkIn") ?? "", checkOut: params.get("checkOut") ?? "" };
  return {
    destination: params.get("destination")?.trim() ?? "",
    ...(hasUsableDates(dates) ? dates : defaultStay()),
    rooms: whole(params.get("rooms"), searchDefaults.rooms, GUEST_LIMITS.rooms),
    adults: whole(params.get("adults"), searchDefaults.adults, GUEST_LIMITS.adults),
    children,
    childAges: resizeAges(ages, children),
  };
}
