import { BadRequestException } from "@nestjs/common";
import type { FlightTravellerDetails, FlightTravellerTitle, FlightTravellerType } from "@quickhotels/types/flight-checkout";
import type { FlightQuote } from "./flight-review.repository.js";

// Airline rules for traveller details, checked against the fare's needs
// (TripJack's review conditions) and the trip's dates. Messages name the
// traveller ("Adult 2", "Infant 1") so the customer knows what to fix.

const TITLES: Record<FlightTravellerType, FlightTravellerTitle[]> = {
  adult: ["Mr", "Mrs", "Ms"],
  child: ["Master", "Ms"],
  infant: ["Master", "Ms"],
};
const NAME = /^[A-Za-z][A-Za-z .'-]*$/;
const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

// Whole years from `birth` to `on` (both YYYY-MM-DD).
export function ageOn(birth: string, on: string) {
  const [by, bm, bd] = birth.split("-").map(Number) as [number, number, number];
  const [oy, om, od] = on.split("-").map(Number) as [number, number, number];
  return oy - by - (om < bm || (om === bm && od < bd) ? 1 : 0);
}

const fail = (message: string): never => {
  throw new BadRequestException(message);
};

export function checkTravellers(quote: FlightQuote, details: FlightTravellerDetails, today: string) {
  const { criteria, requirements: needs, journeys } = quote;
  const expected: [FlightTravellerType, number][] = [
    ["adult", criteria.adults],
    ["child", criteria.children],
    ["infant", criteria.infants],
  ];
  const types = details.travellers.map((traveller) => traveller.type);
  const wanted = expected.flatMap(([type, count]) => Array<FlightTravellerType>(count).fill(type));
  if (types.join() !== wanted.join()) {
    fail(`Give details for ${expected.filter(([, count]) => count).map(([type, count]) => `${count} ${type}${count === 1 ? "" : type === "child" ? "ren" : "s"}`).join(", ")}, in that order.`);
  }

  const firstFlight = journeys[0]?.departAt.slice(0, 10) ?? today;
  const lastFlight = journeys.at(-1)?.departAt.slice(0, 10) ?? firstFlight;
  const counter: Record<FlightTravellerType, number> = { adult: 0, child: 0, infant: 0 };
  const names = new Set<string>();

  for (const traveller of details.travellers) {
    const who = `${traveller.type[0]!.toUpperCase()}${traveller.type.slice(1)} ${++counter[traveller.type]}`;
    if (!TITLES[traveller.type].includes(traveller.title)) fail(`${who}: choose ${TITLES[traveller.type].join(", ").replace(/, ([^,]*)$/, " or $1")}.`);
    for (const [label, value, limit] of [
      ["first name", traveller.firstName, needs.nameLimits?.first ?? 32],
      ["last name", traveller.lastName, needs.nameLimits?.last ?? 32],
    ] as const) {
      if (!NAME.test(value) || value.length < 2) fail(`${who}: the ${label} needs at least 2 letters (A–Z, spaces, . ' -).`);
      if (value.length > limit) fail(`${who}: the ${label} can be up to ${limit} letters for this airline.`);
    }
    if (needs.nameLimits && traveller.firstName.length + traveller.lastName.length > needs.nameLimits.total) {
      fail(`${who}: the full name can be up to ${needs.nameLimits.total} letters for this airline.`);
    }
    const full = `${traveller.firstName} ${traveller.lastName}`.toLowerCase();
    if (names.has(full)) fail(`${who}: each traveller needs a different name.`);
    names.add(full);

    // Date of birth: when the fare asks, and always for infants.
    const dob = traveller.dateOfBirth;
    if ((needs.dateOfBirth[traveller.type] || traveller.type === "infant") && !dob) fail(`${who}: the date of birth is needed.`);
    if (dob) {
      if (dob > today) fail(`${who}: the date of birth can't be in the future.`);
      const ageAtStart = ageOn(dob, firstFlight);
      // Infants must still be under 2 on the last flight; children 2–11 when travel starts.
      if (traveller.type === "adult" && ageAtStart < 12) fail(`${who}: adults are 12 or older on the day of travel.`);
      if (traveller.type === "child" && (ageAtStart < 2 || ageAtStart > 11)) fail(`${who}: children are 2 to 11 years old on the day of travel.`);
      if (traveller.type === "infant" && ageOn(dob, lastFlight) >= 2) fail(`${who}: infants must be under 2 for the whole trip.`);
    }

    if (needs.passport) {
      const passport = traveller.passport;
      if (!passport?.number || !passport.nationality) fail(`${who}: the passport number and nationality are needed.`);
      if (needs.passportExpiry && !passport!.expiry) fail(`${who}: the passport expiry date is needed.`);
      if (passport!.expiry && passport!.expiry <= lastFlight) fail(`${who}: the passport must be valid beyond the last flight.`);
      if (passport!.issueDate && passport!.issueDate > today) fail(`${who}: the passport issue date can't be in the future.`);
    }
    if (needs.pan && (!traveller.pan || !PAN.test(traveller.pan))) fail(`${who}: a PAN like ABCDE1234F is needed.`);
  }

  const { contact, gst, emergencyContact } = details;
  if (contact.phoneCode === "+91" && !/^[6-9]\d{9}$/.test(contact.phone)) fail("Enter a 10-digit Indian mobile number.");
  if (needs.gst === "required" && !gst) fail("This fare needs your company's GST details.");
  if (gst && !GSTIN.test(gst.number)) fail("Enter a valid 15-character GST number.");
  if (needs.emergencyContact && !emergencyContact) fail("This airline needs an emergency contact.");
  if (quote.priceChange && !details.acceptPriceChange) throw new BadRequestException("The price changed. Please accept the new price to continue.");
}
