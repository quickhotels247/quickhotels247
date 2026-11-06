import { describe, expect, it } from "vitest";
import type { FlightTravellerDetails, FlightTravellerRequirements } from "@quickhotels/types/flight-checkout";
import type { FlightQuote } from "./flight-review.repository.js";
import { ageOn, checkTravellers } from "./traveller-rules.js";

const needs = (changes: Partial<FlightTravellerRequirements> = {}): FlightTravellerRequirements => ({
  passport: false, passportExpiry: false, dateOfBirth: { adult: false, child: false, infant: true }, pan: false,
  gst: "optional", emergencyContact: false, nameLimits: { first: 32, last: 32, total: 50 }, ...changes,
});

const quote = (changes: Partial<FlightQuote> = {}, requirements = needs()): FlightQuote =>
  ({
    criteria: { tripType: "roundTrip", from: "DEL", to: "GOI", depart: "2026-12-10", return: "2026-12-20", legs: [], adults: 1, children: 1, infants: 1, cabin: "economy", directOnly: false },
    journeys: [{ departAt: "2026-12-10T09:15" }, { departAt: "2026-12-20T08:00" }],
    requirements,
    priceChange: null,
    ...changes,
  }) as unknown as FlightQuote;

const details = (changes: Partial<FlightTravellerDetails> = {}): FlightTravellerDetails => ({
  travellers: [
    { type: "adult", title: "Ms", firstName: "Asha", lastName: "Rao" },
    { type: "child", title: "Master", firstName: "Kiran", lastName: "Rao", dateOfBirth: "2018-03-02" },
    { type: "infant", title: "Ms", firstName: "Mira", lastName: "Rao", dateOfBirth: "2025-12-25" },
  ],
  contact: { email: "asha@example.com", phoneCode: "+91", phone: "9876543210" },
  acceptTerms: true,
  ...changes,
});

const TODAY = "2026-11-05";
const withTraveller = (index: number, change: object) => details({ travellers: details().travellers.map((t, i) => (i === index ? { ...t, ...change } : t)) });

describe("ageOn", () => {
  it("counts whole years, birthday included", () => {
    expect(ageOn("2024-12-20", "2026-12-19")).toBe(1);
    expect(ageOn("2024-12-20", "2026-12-20")).toBe(2);
  });
});

describe("checkTravellers", () => {
  it("accepts a valid family", () => {
    expect(() => checkTravellers(quote(), details(), TODAY)).not.toThrow();
  });

  it("needs the searched travellers, in order", () => {
    expect(() => checkTravellers(quote(), details({ travellers: details().travellers.slice(0, 2) }), TODAY)).toThrow(/1 adult, 1 child, 1 infant/);
  });

  it("checks titles, names and duplicates", () => {
    expect(() => checkTravellers(quote(), withTraveller(0, { title: "Master" }), TODAY)).toThrow(/Adult 1: choose Mr, Mrs or Ms/);
    expect(() => checkTravellers(quote(), withTraveller(0, { firstName: "A" }), TODAY)).toThrow(/at least 2 letters/);
    expect(() => checkTravellers(quote(), withTraveller(0, { firstName: "Annapurnadevi Lakshminarayani", lastName: "Venkatasubramaniam Iyer" }), TODAY)).toThrow(/full name can be up to 50/);
    expect(() => checkTravellers(quote(), withTraveller(1, { firstName: "Asha" }), TODAY)).toThrow(/different name/);
  });

  it("checks ages on the travel dates", () => {
    // Turns 2 before the return flight on 20 Dec.
    expect(() => checkTravellers(quote(), withTraveller(2, { dateOfBirth: "2024-12-15" }), TODAY)).toThrow(/Infant 1: infants must be under 2/);
    expect(() => checkTravellers(quote(), withTraveller(2, { dateOfBirth: undefined }), TODAY)).toThrow(/Infant 1: the date of birth/);
    expect(() => checkTravellers(quote(), withTraveller(1, { dateOfBirth: "2012-01-01" }), TODAY)).toThrow(/children are 2 to 11/);
    expect(() => checkTravellers(quote(), withTraveller(2, { dateOfBirth: "2026-12-01" }), TODAY)).toThrow(/future/);
  });

  it("needs a passport valid beyond the trip when the fare asks", () => {
    const passports = quote({}, needs({ passport: true, passportExpiry: true }));
    const withPassports = (expiry: string) =>
      details({ travellers: details().travellers.map((t) => ({ ...t, passport: { number: "N1234567", nationality: "IN", expiry } })) });
    expect(() => checkTravellers(passports, details(), TODAY)).toThrow(/passport number and nationality/);
    expect(() => checkTravellers(passports, withPassports("2026-12-15"), TODAY)).toThrow(/valid beyond the last flight/);
    expect(() => checkTravellers(passports, withPassports("2031-01-01"), TODAY)).not.toThrow();
  });

  it("checks GST, the emergency contact and price acceptance", () => {
    expect(() => checkTravellers(quote({}, needs({ gst: "required" })), details(), TODAY)).toThrow(/GST details/);
    expect(() => checkTravellers(quote(), details({ gst: { number: "BAD", companyName: "Rao Travels" } }), TODAY)).toThrow(/valid 15-character GST/);
    expect(() => checkTravellers(quote(), details({ gst: { number: "29ABCDE1234F1Z5", companyName: "Rao Travels" } }), TODAY)).not.toThrow();
    expect(() => checkTravellers(quote({}, needs({ emergencyContact: true })), details(), TODAY)).toThrow(/emergency contact/);
    const changed = quote({ priceChange: { previous: { amount: 1, currency: "INR" }, current: { amount: 2, currency: "INR" } } });
    expect(() => checkTravellers(changed, details(), TODAY)).toThrow(/accept the new price/);
    expect(() => checkTravellers(changed, details({ acceptPriceChange: true }), TODAY)).not.toThrow();
  });
});
