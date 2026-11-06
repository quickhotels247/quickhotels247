import type { SavedTraveller } from "@quickhotels/types/travellers";
import type { User } from "@quickhotels/types/users";
import { fillContact } from "@/lib/contactFill";
import type { CheckoutGuest, CheckoutGuestDetails, CheckoutRoomGuests, CheckoutSummary, GuestTitle } from "@quickhotels/types/checkout";

// The guest form's checks, mirroring the backend's (it checks again).

export const ADULT_TITLES: GuestTitle[] = ["Mr", "Mrs", "Ms", "Miss"];
export const CHILD_TITLES: GuestTitle[] = ["Master", "Miss"];

const NAME = /^[A-Za-z][A-Za-z .'-]{1,39}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const PASSPORT = /^[A-Z0-9]{6,12}$/;

const blankGuest = (child: boolean): CheckoutGuest => ({ title: child ? "Master" : "Mr", firstName: "", lastName: "" });

// Saved details, or empty rows: adults then children in each room.
export function initialDetails(checkout: CheckoutSummary): CheckoutGuestDetails {
  if (checkout.guestDetails) return { ...checkout.guestDetails, acceptTerms: false, acceptPriceChange: false };
  return {
    contact: { email: "", phoneCode: "+91", phone: "" },
    rooms: checkout.rooms.map((room) => ({
      guests: [...Array.from({ length: room.adults }, () => blankGuest(false)), ...room.childAges.map(() => blankGuest(true))],
    })),
    specialRequests: "",
    acceptTerms: false,
    acceptPriceChange: false,
  };
}

// Field ids, so the error summary can link to each field.
export const fieldId = (...parts: (string | number)[]) => `checkout-${parts.join("-")}`;

export type FormErrors = Record<string, string>;

export function validateDetails(details: CheckoutGuestDetails, checkout: CheckoutSummary): FormErrors {
  const errors: FormErrors = {};
  const { contact } = details;
  if (!EMAIL.test(contact.email.trim())) errors[fieldId("email")] = "Enter a valid email address.";
  const phone = contact.phone.replace(/[\s-]/g, "");
  if (contact.phoneCode === "+91" ? !/^[6-9]\d{9}$/.test(phone) : !/^\d{6,14}$/.test(phone)) {
    errors[fieldId("phone")] = contact.phoneCode === "+91" ? "Enter a 10-digit Indian mobile number." : "Enter a valid mobile number.";
  }
  if (!/^\+\d{1,4}$/.test(contact.phoneCode)) errors[fieldId("phone-code")] = "Country code must look like +91.";

  const leads = new Set<string>();
  details.rooms.forEach((room, r) => {
    room.guests.forEach((guest, g) => {
      const who = `Room ${r + 1}, guest ${g + 1}`;
      if (!NAME.test(guest.firstName.trim())) errors[fieldId(r, g, "first")] = `${who}: first name needs 2–40 letters (A–Z).`;
      if (!NAME.test(guest.lastName.trim())) errors[fieldId(r, g, "last")] = `${who}: last name needs 2–40 letters (A–Z).`;
      if (checkout.requirements.pan && !PAN.test((guest.pan ?? "").trim().toUpperCase())) errors[fieldId(r, g, "pan")] = `${who}: PAN must look like ABCDE1234F.`;
      if (checkout.requirements.passport && !PASSPORT.test((guest.passportNumber ?? "").trim().toUpperCase())) {
        errors[fieldId(r, g, "passport")] = `${who}: enter a passport number (6–12 letters and digits).`;
      }
    });
    const lead = room.guests[0];
    const name = lead ? `${lead.firstName} ${lead.lastName}`.trim().toLowerCase() : "";
    if (name && leads.has(name)) errors[fieldId(r, 0, "first")] = `Room ${r + 1}: each room needs a different main guest.`;
    leads.add(name);
  });
  if ((details.specialRequests ?? "").length > 500) errors[fieldId("requests")] = "Special requests can be up to 500 characters.";
  if (checkout.priceChange && !details.acceptPriceChange) errors[fieldId("accept-price")] = "Please accept the new price.";
  if (!details.acceptTerms) errors[fieldId("accept-terms")] = "Please accept the terms and the cancellation policy.";
  return errors;
}

// What's sent: trimmed names, PAN and passport in capitals, only when asked for.
export function cleanDetails(details: CheckoutGuestDetails, checkout: CheckoutSummary): CheckoutGuestDetails {
  return {
    contact: { email: details.contact.email.trim(), phoneCode: details.contact.phoneCode.trim(), phone: details.contact.phone.replace(/[\s-]/g, "") },
    rooms: details.rooms.map((room) => ({
      guests: room.guests.map((guest) => ({
        title: guest.title,
        firstName: guest.firstName.trim(),
        lastName: guest.lastName.trim(),
        ...(checkout.requirements.pan ? { pan: (guest.pan ?? "").trim().toUpperCase() } : {}),
        ...(checkout.requirements.passport ? { passportNumber: (guest.passportNumber ?? "").trim().toUpperCase() } : {}),
      })),
    })),
    specialRequests: details.specialRequests?.trim() || undefined,
    acceptTerms: details.acceptTerms,
    ...(checkout.priceChange ? { acceptPriceChange: Boolean(details.acceptPriceChange) } : {}),
  };
}

export const isChild = (room: CheckoutRoomGuests, guestIndex: number) => guestIndex >= room.adults;

// A signed-in customer's email and name, put only into fields still empty.
export function fillFromAccount(details: CheckoutGuestDetails, account: Pick<User, "email" | "phone" | "firstName" | "lastName">): CheckoutGuestDetails {
  const lead = details.rooms[0]?.guests[0];
  const fillLead = lead && !lead.firstName && !lead.lastName;
  return {
    ...details,
    contact: fillContact(details.contact, account),
    rooms: details.rooms.map((room, r) =>
      r === 0 && fillLead
        ? { guests: room.guests.map((guest, g) => (g === 0 ? { ...guest, firstName: account.firstName, lastName: account.lastName } : guest)) }
        : room,
    ),
  };
}

// Copies a saved traveller into a guest. The title is kept only when it fits
// (adult or child); the passport number only if one is saved.
export function guestFromSaved(guest: CheckoutGuest, saved: SavedTraveller, child: boolean): CheckoutGuest {
  const titles: string[] = child ? CHILD_TITLES : ADULT_TITLES;
  return {
    ...guest,
    title: titles.includes(saved.title) ? (saved.title as GuestTitle) : guest.title,
    firstName: saved.firstName,
    lastName: saved.lastName,
    passportNumber: saved.passportNumber ?? guest.passportNumber,
  };
}
