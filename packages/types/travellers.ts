// Saved travellers on a customer's account (/account/travellers), used to
// fill guest and traveller forms at checkout.

export type SavedTravellerTitle = "Mr" | "Mrs" | "Ms" | "Master" | "Miss";

export interface SavedTravellerInput {
  title: SavedTravellerTitle;
  firstName: string;
  lastName: string;
  // YYYY-MM-DD.
  dateOfBirth?: string | null;
  // ISO country code, e.g. "IN".
  nationality?: string | null;
  passportNumber?: string | null;
  passportExpiry?: string | null;
}

export interface SavedTraveller extends Required<SavedTravellerInput> {
  id: string;
  createdAt: string;
}
