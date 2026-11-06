// Hotels a customer saved (the heart on hotel cards), shown on /account/saved.
// The card details are a snapshot taken when saving.

export interface SaveHotelRequest {
  name: string;
  city: string | null;
  country: string | null;
  imageUrl: string | null;
  starRating: number | null;
}

export interface SavedHotel extends SaveHotelRequest {
  hotelId: string;
  savedAt: string;
}
