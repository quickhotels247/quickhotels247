import Chip from "@mui/material/Chip";
import type { AdminFlightStatus } from "@quickhotels/types/admin";

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
};

const chip = (label: string, tone: Tone) => <Chip size="small" variant="outlined" color={tone} label={label} sx={{ height: 22, fontSize: "0.75rem", fontWeight: 600 }} />;

export function FlightStatusChip({ status }: { status: AdminFlightStatus }) {
  const info = FLIGHT_STATUS[status] ?? { label: status, tone: "default" as const };
  return chip(info.label, info.tone);
}

export function PaymentStatusChip({ status }: { status: string }) {
  const info = PAYMENT_STATUS[status] ?? { label: status, tone: "default" as const };
  return chip(info.label, info.tone);
}
