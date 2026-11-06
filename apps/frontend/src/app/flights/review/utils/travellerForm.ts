import type { FlightReviewSummary, FlightTraveller, FlightTravellerDetails, FlightTravellerTitle, FlightTravellerType } from "@quickhotels/types/flight-checkout";
import type { SavedTraveller } from "@quickhotels/types/travellers";
import { todayIso } from "@/lib/dates";

// The travellers form's rules, mirroring the backend (which checks again).

export const TITLES: Record<FlightTravellerType, FlightTravellerTitle[]> = {
  adult: ["Mr", "Mrs", "Ms"],
  child: ["Master", "Ms"],
  infant: ["Master", "Ms"],
};
export const TYPE_LABEL: Record<FlightTravellerType, string> = { adult: "Adult", child: "Child", infant: "Infant" };
export const TYPE_HINT: Record<FlightTravellerType, string> = { adult: "12 years or older", child: "2–11 years", infant: "Under 2 years" };

const NAME = /^[A-Za-z][A-Za-z .'-]*$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const fieldId = (...parts: (string | number)[]) => `flight-${parts.join("-")}`;
export type FormErrors = Record<string, string>;

// Whole years from `birth` to `on` (YYYY-MM-DD).
export function ageOn(birth: string, on: string) {
  const [by, bm, bd] = birth.split("-").map(Number) as [number, number, number];
  const [oy, om, od] = on.split("-").map(Number) as [number, number, number];
  return oy - by - (om < bm || (om === bm && od < bd) ? 1 : 0);
}

const blank = (type: FlightTravellerType): FlightTraveller => ({ type, title: TITLES[type][0]!, firstName: "", lastName: "" });

// Saved details, or one empty row per traveller: adults, children, infants.
export function initialDetails(review: FlightReviewSummary): FlightTravellerDetails {
  if (review.travellerDetails) return { ...review.travellerDetails, acceptTerms: false, acceptPriceChange: false };
  const { adults, children, infants } = review.criteria;
  return {
    travellers: [
      ...Array.from({ length: adults }, () => blank("adult")),
      ...Array.from({ length: children }, () => blank("child")),
      ...Array.from({ length: infants }, () => blank("infant")),
    ],
    contact: { email: "", phoneCode: "+91", phone: "" },
    acceptTerms: false,
    acceptPriceChange: false,
  };
}

export const needsDob = (review: FlightReviewSummary, type: FlightTravellerType) => type === "infant" || review.requirements.dateOfBirth[type];

export function validateDetails(details: FlightTravellerDetails, review: FlightReviewSummary, wantGst: boolean): FormErrors {
  const errors: FormErrors = {};
  const needs = review.requirements;
  const firstFlight = review.journeys[0]?.departAt.slice(0, 10) ?? todayIso();
  const lastFlight = review.journeys.at(-1)?.departAt.slice(0, 10) ?? firstFlight;
  const counter: Record<FlightTravellerType, number> = { adult: 0, child: 0, infant: 0 };
  const names = new Set<string>();

  details.travellers.forEach((traveller, i) => {
    const who = `${TYPE_LABEL[traveller.type]} ${++counter[traveller.type]}`;
    const id = (field: string) => fieldId(i, field);
    const limits = needs.nameLimits;
    for (const [field, label, value, limit] of [
      ["first", "first name", traveller.firstName.trim(), limits?.first ?? 32],
      ["last", "last name", traveller.lastName.trim(), limits?.last ?? 32],
    ] as const) {
      if (!NAME.test(value) || value.length < 2) errors[id(field)] = `${who}: enter the ${label} as on their ID (at least 2 letters).`;
      else if (value.length > limit) errors[id(field)] = `${who}: the ${label} can be up to ${limit} letters.`;
    }
    const full = `${traveller.firstName.trim()} ${traveller.lastName.trim()}`.toLowerCase();
    if (traveller.firstName.trim() && names.has(full)) errors[id("first")] = `${who}: each traveller needs a different name.`;
    names.add(full);

    const dob = traveller.dateOfBirth;
    if (needsDob(review, traveller.type)) {
      if (!dob) errors[id("dob")] = `${who}: enter the date of birth.`;
      else if (dob > todayIso()) errors[id("dob")] = `${who}: the date of birth can't be in the future.`;
      else if (traveller.type === "adult" && ageOn(dob, firstFlight) < 12) errors[id("dob")] = `${who}: adults are 12 or older on the day of travel.`;
      else if (traveller.type === "child" && (ageOn(dob, firstFlight) < 2 || ageOn(dob, firstFlight) > 11)) errors[id("dob")] = `${who}: children are 2–11 on the day of travel.`;
      else if (traveller.type === "infant" && ageOn(dob, lastFlight) >= 2) errors[id("dob")] = `${who}: infants must be under 2 for the whole trip.`;
    }
    if (needs.passport) {
      const passport = traveller.passport;
      if (!/^[A-Z0-9]{6,12}$/.test((passport?.number ?? "").trim().toUpperCase())) errors[id("passport")] = `${who}: enter the passport number.`;
      if (!passport?.nationality) errors[id("nationality")] = `${who}: choose the passport's country.`;
      if (needs.passportExpiry && !passport?.expiry) errors[id("expiry")] = `${who}: enter the passport expiry date.`;
      else if (passport?.expiry && passport.expiry <= lastFlight) errors[id("expiry")] = `${who}: the passport must be valid beyond the last flight.`;
    }
    if (needs.pan && !PAN.test((traveller.pan ?? "").trim().toUpperCase())) errors[id("pan")] = `${who}: enter a PAN like ABCDE1234F.`;
  });

  const { contact } = details;
  if (!EMAIL.test(contact.email.trim())) errors[fieldId("email")] = "Enter a valid email address.";
  const phone = contact.phone.replace(/[\s-]/g, "");
  if (contact.phoneCode === "+91" ? !/^[6-9]\d{9}$/.test(phone) : !/^\d{6,14}$/.test(phone)) {
    errors[fieldId("phone")] = contact.phoneCode === "+91" ? "Enter a 10-digit Indian mobile number." : "Enter a valid mobile number.";
  }
  if (!/^\+\d{1,4}$/.test(contact.phoneCode)) errors[fieldId("phone-code")] = "Country code must look like +91.";

  if (needs.gst === "required" || wantGst) {
    if (!GSTIN.test((details.gst?.number ?? "").trim().toUpperCase())) errors[fieldId("gst-number")] = "Enter a valid 15-character GST number.";
    if (!details.gst?.companyName.trim()) errors[fieldId("gst-name")] = "Enter the company name registered for GST.";
    else if (details.gst.companyName.trim().length > 35) errors[fieldId("gst-name")] = "The company name can be up to 35 characters.";
  }
  if (needs.emergencyContact) {
    if (!details.emergencyContact?.name.trim()) errors[fieldId("emergency-name")] = "Enter the emergency contact's name.";
    if (!/^\d{6,14}$/.test((details.emergencyContact?.phone ?? "").replace(/[\s-]/g, ""))) errors[fieldId("emergency-phone")] = "Enter the emergency contact's mobile number.";
  }
  if (review.priceChange && !details.acceptPriceChange) errors[fieldId("accept-price")] = "Please accept the new price.";
  if (!details.acceptTerms) errors[fieldId("accept-terms")] = "Please accept the terms and the fare rules.";
  return errors;
}

// What's sent: trimmed names, codes in capitals, dates of birth only where
// asked, and the optional parts only when filled in.
export function cleanDetails(details: FlightTravellerDetails, review: FlightReviewSummary, wantGst: boolean): FlightTravellerDetails {
  const needs = review.requirements;
  return {
    travellers: details.travellers.map((traveller) => ({
      type: traveller.type,
      title: traveller.title,
      firstName: traveller.firstName.trim(),
      lastName: traveller.lastName.trim(),
      ...(needsDob(review, traveller.type) && traveller.dateOfBirth ? { dateOfBirth: traveller.dateOfBirth } : {}),
      ...(needs.passport && traveller.passport
        ? {
            passport: {
              number: traveller.passport.number.trim().toUpperCase(),
              nationality: traveller.passport.nationality,
              ...(traveller.passport.expiry ? { expiry: traveller.passport.expiry } : {}),
              ...(traveller.passport.issueDate ? { issueDate: traveller.passport.issueDate } : {}),
            },
          }
        : {}),
      ...(needs.pan && traveller.pan ? { pan: traveller.pan.trim().toUpperCase() } : {}),
    })),
    contact: { email: details.contact.email.trim(), phoneCode: details.contact.phoneCode.trim(), phone: details.contact.phone.replace(/[\s-]/g, "") },
    ...((needs.gst === "required" || wantGst) && details.gst
      ? { gst: { ...details.gst, number: details.gst.number.trim().toUpperCase(), companyName: details.gst.companyName.trim() } }
      : {}),
    ...(needs.emergencyContact && details.emergencyContact
      ? { emergencyContact: { ...details.emergencyContact, name: details.emergencyContact.name.trim(), phone: details.emergencyContact.phone.replace(/[\s-]/g, "") } }
      : {}),
    acceptTerms: details.acceptTerms,
    ...(review.priceChange ? { acceptPriceChange: Boolean(details.acceptPriceChange) } : {}),
  };
}

// Copies a saved traveller into a traveller card. The title is kept only when
// it fits the traveller type (adult/child/infant); passport only if saved.
export function fromSaved(traveller: FlightTraveller, saved: SavedTraveller): FlightTraveller {
  const title = (TITLES[traveller.type] as string[]).includes(saved.title) ? (saved.title as FlightTravellerTitle) : traveller.title;
  return {
    ...traveller,
    title,
    firstName: saved.firstName,
    lastName: saved.lastName,
    dateOfBirth: saved.dateOfBirth ?? traveller.dateOfBirth,
    passport: saved.passportNumber
      ? { number: saved.passportNumber, nationality: saved.nationality ?? traveller.passport?.nationality ?? "", expiry: saved.passportExpiry ?? undefined }
      : traveller.passport,
  };
}
