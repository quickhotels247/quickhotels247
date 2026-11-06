import type { BookingDisplayStatus } from "@quickhotels/types/bookings";

// How each booking status is labelled and coloured.
export const BOOKING_STATUS: Record<BookingDisplayStatus, { label: string; color: "success" | "warning" | "error" | "default" | "info" }> = {
  confirmed: { label: "Confirmed", color: "success" },
  pending: { label: "Confirmation pending", color: "warning" },
  action_required: { label: "Action required", color: "error" },
  cancellation_pending: { label: "Cancellation requested", color: "warning" },
  cancelled: { label: "Cancelled", color: "default" },
  refund_pending: { label: "Refund pending", color: "info" },
  refunded: { label: "Refunded", color: "default" },
};
