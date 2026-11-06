import type { SavedTraveller, SavedTravellerInput, SavedTravellerTitle } from "@quickhotels/types/travellers";

export const TITLES: SavedTravellerTitle[] = ["Mr", "Mrs", "Ms", "Miss", "Master"];

export interface TravellerFormValue {
  title: SavedTravellerTitle;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
}

export const emptyTraveller = (): TravellerFormValue => ({
  title: "Mr", firstName: "", lastName: "", dateOfBirth: "", nationality: "IN", passportNumber: "", passportExpiry: "",
});

export const toForm = (traveller: SavedTraveller): TravellerFormValue => ({
  title: traveller.title,
  firstName: traveller.firstName,
  lastName: traveller.lastName,
  dateOfBirth: traveller.dateOfBirth ?? "",
  nationality: traveller.nationality ?? "",
  passportNumber: traveller.passportNumber ?? "",
  passportExpiry: traveller.passportExpiry ?? "",
});

// Empty optional fields go as null so the server clears them.
export const toInput = (form: TravellerFormValue): SavedTravellerInput => ({
  title: form.title,
  firstName: form.firstName.trim(),
  lastName: form.lastName.trim(),
  dateOfBirth: form.dateOfBirth || null,
  nationality: form.nationality || null,
  passportNumber: form.passportNumber.replace(/\s/g, "").toUpperCase() || null,
  passportExpiry: form.passportExpiry || null,
});

export function ageOn(dateOfBirth: string, on = new Date()) {
  const birth = new Date(`${dateOfBirth}T00:00:00`);
  let age = on.getFullYear() - birth.getFullYear();
  if (on.getMonth() < birth.getMonth() || (on.getMonth() === birth.getMonth() && on.getDate() < birth.getDate())) age -= 1;
  return age;
}
