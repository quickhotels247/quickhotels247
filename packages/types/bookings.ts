import type { GuestTitle } from "@quickhotels/types/checkout";
import type { Money } from "@quickhotels/types/hotels";

// Bookings as customers see them (spec §4.6–4.8).

// What the customer is told. "confirmed" only once the supplier has
// confirmed the booking; everything before that is "pending".
export type BookingDisplayStatus =
  | "pending"
  | "confirmed"
  | "action_required"
  | "cancellation_pending"
  | "cancelled"
  | "refund_pending"
  | "refunded";

export type BookingsTab = "upcoming" | "past" | "cancelled";

export interface BookingListItem {
  reference: string; // "QH-7K2M9P"
  status: BookingDisplayStatus;
  hotel: { id: string; name: string; city: string | null; imageUrl: string | null };
  checkIn: string; // YYYY-MM-DD
  checkOut: string;
  nights: number;
  rooms: number;
  adults: number;
  children: number;
  total: Money;
  bookedAt: string;
}

// GET /api/v1/bookings?tab=&q=&page=
export interface BookingsPage {
  tab: BookingsTab;
  page: number;
  pageSize: number;
  total: number;
  items: BookingListItem[];
}

export interface BookingGuestInfo {
  title: GuestTitle | null;
  firstName: string;
  lastName: string;
  child: boolean;
  lead: boolean;
}

// The cancellation terms as they were when the booking was made.
export interface BookingCancellationPolicy {
  refundable: boolean;
  // India time (ISO, no zone), when free cancellation was possible.
  freeCancellationUntil: string | null;
  charges: { from: string; to: string; amount: Money }[];
}

export type BookingPaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded";

// GET /api/v1/bookings/:reference
export interface BookingDetails extends BookingListItem {
  // The hotel's own confirmation number, once the supplier gives one.
  supplierConfirmation: string | null;
  hotel: BookingListItem["hotel"] & { address: string | null; starRating: number | null; latitude: number | null; longitude: number | null };
  roomsBooked: { name: string; mealPlan: string | null; adults: number; childAges: number[]; guests: BookingGuestInfo[] }[];
  price: { total: Money; taxes: Money; discount: Money };
  payment: { status: BookingPaymentStatus; method: string | null; amount: Money; at: string } | null;
  cancellationPolicy: BookingCancellationPolicy | null;
  cancellation: { status: "requested" | "in_progress" | "confirmed" | "rejected" | "failed"; penalty: Money | null; refundEstimate: Money | null; requestedAt: string } | null;
  refunds: { status: "pending" | "processing" | "completed" | "failed"; amount: Money; at: string }[];
  // Oldest first.
  timeline: { status: BookingDisplayStatus; at: string }[];
  contact: { email: string; phone: string };
  specialRequests: string | null;
}
