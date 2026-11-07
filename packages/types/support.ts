// Help & support: tickets from the /help contact form, handled in admin.

export const SUPPORT_TOPICS = ["booking", "cancellation", "payment", "flight", "account", "other"] as const;
export type SupportTopic = (typeof SUPPORT_TOPICS)[number];

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_ON_CUSTOMER" | "RESOLVED" | "CLOSED";

// POST /api/v1/support/tickets
export interface CreateTicketRequest {
  name: string;
  email: string;
  phone?: string | null;
  topic: SupportTopic;
  bookingReference?: string | null;
  message: string;
}

export interface CreateTicketResponse {
  reference: string; // "T-482913"
}

export interface AdminTicketRow {
  id: string;
  reference: string;
  name: string | null;
  email: string;
  topic: string;
  status: TicketStatus;
  bookingReference: string | null;
  // The start of the message, for the list.
  preview: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTicketList {
  items: AdminTicketRow[];
  total: number;
  page: number;
  pageSize: number;
  counts: Partial<Record<TicketStatus, number>>;
}

export interface TicketNote {
  id: string;
  // "note": staff only; "reply": emailed to the customer.
  kind: "note" | "reply";
  body: string;
  adminName: string | null;
  createdAt: string;
}

export interface AdminTicket extends AdminTicketRow {
  phone: string | null;
  message: string;
  userId: string | null;
  bookingFound: boolean;
  notes: TicketNote[];
}

export interface TicketNoteRequest {
  kind: "note" | "reply";
  body: string;
}

export interface TicketUpdateRequest {
  status?: TicketStatus;
  // Assign to the signed-in admin, or unassign (null).
  assignToMe?: boolean | null;
}
