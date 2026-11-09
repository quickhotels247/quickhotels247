import Chip from "@mui/material/Chip";
import type { AdminFlightStatus, AdminHotelStatus } from "@quickhotels/types/admin";

type Tone = "success" | "warning" | "error" | "info" | "default";

export const FLIGHT_STATUS: Record<AdminFlightStatus, { label: string; tone: Tone }> = {
  travellers: { label: "Unpaid · travellers", tone: "default" },
  payment: { label: "Unpaid · at payment", tone: "default" },
  paid: { label: "Paid · not booked yet", tone: "warning" },
  booking: { label: "Booking with airline", tone: "warning" },
  pending: { label: "Ticketing pending", tone: "warning" },
  confirmed: { label: "Confirmed", tone: "success" },
  failed: { label: "Failed", tone: "error" },
};

export const HOTEL_STATUS: Record<AdminHotelStatus, { label: string; tone: Tone }> = {
  INITIATED: { label: "Unpaid", tone: "default" },
  PRICE_REVIEW_PENDING: { label: "Unpaid", tone: "default" },
  AWAITING_PAYMENT: { label: "Unpaid · at payment", tone: "default" },
  PAYMENT_PENDING: { label: "Paid · not booked yet", tone: "warning" },
  SUPPLIER_BOOKING_PENDING: { label: "Waiting for hotel", tone: "warning" },
  CONFIRMED: { label: "Confirmed", tone: "success" },
  SUPPLIER_BOOKING_FAILED: { label: "Failed", tone: "error" },
  PAYMENT_FAILED: { label: "Payment failed", tone: "error" },
  MANUAL_REVIEW: { label: "Needs review", tone: "error" },
  CANCELLATION_PENDING: { label: "Cancelling", tone: "warning" },
  CANCELLED: { label: "Cancelled", tone: "default" },
  REFUND_PENDING: { label: "Refund pending", tone: "info" },
  REFUNDED: { label: "Refunded", tone: "info" },
};

export const PAYMENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  CREATED: { label: "Not paid", tone: "default" },
  PENDING: { label: "Pending", tone: "warning" },
  CAPTURED: { label: "Paid", tone: "success" },
  FAILED: { label: "Failed", tone: "error" },
  REFUNDED: { label: "Refunded", tone: "info" },
  PARTIALLY_REFUNDED: { label: "Part refunded", tone: "info" },
  // Refund rows
  COMPLETED: { label: "Refunded", tone: "success" },
  PROCESSING: { label: "Processing", tone: "warning" },
  // Cancellation requests
  REQUESTED: { label: "Requested", tone: "warning" },
  SUPPLIER_PENDING: { label: "With supplier", tone: "warning" },
  CONFIRMED: { label: "Cancelled", tone: "success" },
  REJECTED: { label: "Rejected", tone: "error" },
};

const chip = (label: string, tone: Tone) => <Chip size="small" variant="outlined" color={tone} label={label} sx={{ height: 22, fontSize: "0.75rem", fontWeight: 600 }} />;

export function FlightStatusChip({ status }: { status: AdminFlightStatus }) {
  const info = FLIGHT_STATUS[status] ?? { label: status, tone: "default" as const };
  return chip(info.label, info.tone);
}

export function HotelStatusChip({ status }: { status: AdminHotelStatus }) {
  const info = HOTEL_STATUS[status] ?? { label: status, tone: "default" as const };
  return chip(info.label, info.tone);
}

export function PaymentStatusChip({ status }: { status: string }) {
  const info = PAYMENT_STATUS[status] ?? { label: status, tone: "default" as const };
  return chip(info.label, info.tone);
}
