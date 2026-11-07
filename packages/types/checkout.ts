import type { AppliedCoupon } from "@quickhotels/types/coupons";
import type { HotelSearchCriteria, Money, RoomOption, TextSection } from "@quickhotels/types/hotels";

// Checkout shapes shared by the website and the backend (spec §4.4–4.5).

// Titles TripJack accepts; children are Master or Miss.
export type GuestTitle = "Mr" | "Mrs" | "Ms" | "Miss" | "Master";

// Who sleeps in each room, in the order the supplier priced them.
export interface CheckoutRoomGuests {
  adults: number;
  childAges: number[];
}

export interface CheckoutGuest {
  title: GuestTitle;
  firstName: string;
  lastName: string;
  // Only when the rate requires them (CheckoutSummary.requirements).
  pan?: string;
  passportNumber?: string;
}

// PUT /api/v1/checkouts/:id/guests
export interface CheckoutGuestDetails {
  contact: { email: string; phoneCode: string; phone: string };
  // One entry per room, guests in order: adults first, then children.
  rooms: { guests: CheckoutGuest[] }[];
  specialRequests?: string;
  acceptTerms: boolean;
  // Required (true) when the price changed since the hotel page.
  acceptPriceChange?: boolean;
}

export type CheckoutStatus =
  // Collecting guest details.
  | "details"
  // Details saved; payment comes next.
  | "payment";

export interface CheckoutSummary {
  checkoutId: string;
  status: CheckoutStatus;
  // The re-checked rate is held until then; afterwards the visitor starts again.
  expiresAt: string;
  hotel: {
    id: string;
    name: string;
    starRating: number | null;
    address: string | null;
    city: string | null;
    imageUrl: string | null;
    checkIn: { from: string | null; until: string | null };
    checkOut: { from: string | null; until: string | null };
  };
  stay: Omit<HotelSearchCriteria, "destination">;
  nights: number;
  rooms: CheckoutRoomGuests[];
  // The rate as the supplier confirmed it just now: the price to pay.
  room: RoomOption;
  // Set when the confirmed price differs from what the hotel page showed.
  priceChange: { previous: Money; current: Money } | null;
  // A coupon code applied at checkout, and the total after it.
  coupon: AppliedCoupon | null;
  payable: Money;
  requirements: { pan: boolean; passport: boolean };
  // Fees paid at the hotel and other rules to read before paying.
  policies: TextSection[];
  termsVersion: string;
  // Saved details, to fill the form again.
  guestDetails: CheckoutGuestDetails | null;
}

// POST /api/v1/checkouts with { roomsId, optionId } and an Idempotency-Key
// header: a random key the browser makes when the visitor presses Reserve.
// The same key opens the checkout afterwards (X-Checkout-Token header); the
// server keeps only its hash. Repeating the POST with it returns the same
// checkout rather than reviewing the rate again.
export interface CreateCheckoutRequest {
  roomsId: string;
  optionId: string;
}
