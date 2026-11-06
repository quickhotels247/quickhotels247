import type { BookingDisplayStatus, BookingsTab } from "@quickhotels/types/bookings";
import { BookingStatus } from "../../../generated/prisma/client.js";

// Our booking states → what the customer is told. Only CONFIRMED (the
// supplier confirmed it) reads "confirmed" (spec §4.6).
const DISPLAY: Record<BookingStatus, BookingDisplayStatus> = {
  INITIATED: "pending",
  PRICE_REVIEW_PENDING: "pending",
  AWAITING_PAYMENT: "pending",
  PAYMENT_PENDING: "pending",
  SUPPLIER_BOOKING_PENDING: "pending",
  CONFIRMED: "confirmed",
  PAYMENT_FAILED: "action_required",
  SUPPLIER_BOOKING_FAILED: "action_required",
  MANUAL_REVIEW: "action_required",
  CANCELLATION_PENDING: "cancellation_pending",
  CANCELLED: "cancelled",
  REFUND_PENDING: "refund_pending",
  REFUNDED: "refunded",
};

export const displayStatus = (status: BookingStatus) => DISPLAY[status];

// Statuses listed under "Cancelled"; the rest are upcoming or past by date.
export const CANCELLED_STATUSES: BookingStatus[] = [
  BookingStatus.CANCELLATION_PENDING,
  BookingStatus.CANCELLED,
  BookingStatus.REFUND_PENDING,
  BookingStatus.REFUNDED,
];

export const BOOKINGS_TABS: BookingsTab[] = ["upcoming", "past", "cancelled"];
