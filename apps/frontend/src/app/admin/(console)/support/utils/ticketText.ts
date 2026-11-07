import type { TicketStatus } from "@quickhotels/types/support";

export const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  WAITING_ON_CUSTOMER: "Waiting on customer",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};
export const STATUSES = Object.keys(STATUS_LABEL) as TicketStatus[];

const TOPICS: Record<string, string> = {
  booking: "Booking",
  cancellation: "Cancellation / change",
  payment: "Payment / refund",
  flight: "Flights",
  account: "Account",
  other: "Other",
};
export const topicText = (topic: string) => TOPICS[topic] ?? topic;

export const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
