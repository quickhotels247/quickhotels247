import { BadRequestException } from "@nestjs/common";
import type { HotelSearchRequest } from "@quickhotels/types/hotels";

const DAY = 86_400_000;
const MAX_NIGHTS = 30;
const MAX_DAYS_AHEAD = 365;

const utcDay = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

export const nightsOf = ({ checkIn, checkOut }: Pick<HotelSearchRequest, "checkIn" | "checkOut">) =>
  Math.round((utcDay(checkOut) - utcDay(checkIn)) / DAY);

// The rules every hotel search and room lookup follows. Check-in from today
// (UTC, with a day's leeway for time zones ahead of UTC), up to a year ahead,
// for 1–30 nights; each child's age; an adult in every room. Returns the
// number of nights.
export function checkStay(request: HotelSearchRequest): number {
  const start = utcDay(request.checkIn);
  const end = utcDay(request.checkOut);
  if (Number.isNaN(start) || Number.isNaN(end)) throw new BadRequestException("Dates must be real days.");
  const today = utcDay(new Date().toISOString().slice(0, 10));
  if (start < today - DAY) throw new BadRequestException("Check-in can't be in the past.");
  if (start > today + MAX_DAYS_AHEAD * DAY) throw new BadRequestException("Check-in must be within a year.");
  const nights = Math.round((end - start) / DAY);
  if (nights < 1) throw new BadRequestException("Check-out must be after check-in.");
  if (nights > MAX_NIGHTS) throw new BadRequestException(`A stay can be at most ${MAX_NIGHTS} nights.`);
  // Suppliers price rooms by each child's age.
  if (request.children > 0 && (request.childAges?.length ?? 0) !== request.children) {
    throw new BadRequestException("Give the age of each child.");
  }
  if (request.adults < request.rooms) throw new BadRequestException("Each room needs at least one adult.");
  return nights;
}
