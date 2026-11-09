// The admin dashboard (/api/admin/*). Admins are separate accounts from users.
import type { SignedInWith } from "@quickhotels/types/users";

// Spec §1.1 roles. What each can do is decided on the server; the console
// gets the signed-in admin's permissions to show only what they can use.
export type AdminRole = "SUPER_ADMIN" | "OPERATIONS_ADMIN" | "SUPPORT_AGENT";
export type AdminPermission = "team" | "pricing" | "coupons" | "customers" | "support" | "email" | "bookings" | "refunds";

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermission[];
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

// GET /api/admin/auth/setup: true only while no admin exists yet.
export interface AdminSetupStatus {
  setupNeeded: boolean;
  // Production asks for the server's ADMIN_SETUP_TOKEN, so only the owner
  // can create the first admin.
  tokenRequired: boolean;
}

export interface AdminSetupRequest extends NewAdminRequest {
  setupToken?: string;
}

// Creating an admin: the first one (signup page) or by another admin.
export interface NewAdminRequest {
  name: string;
  email: string;
  password: string;
}

// Adding a teammate (another admin): with their role.
export interface AddAdminRequest extends NewAdminRequest {
  role: AdminRole;
}

export interface UpdateAdminRequest {
  role: AdminRole;
}

export interface ChangeAdminPasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AdminAccount extends AdminProfile {
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AdminAuthResponse {
  admin: AdminProfile;
  token: string;
  expiresAt: string;
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  username: string;
  signedInWith: SignedInWith;
  createdAt: string;
  lastActiveAt: string | null;
}

export interface AdminUserList {
  items: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuditEntry {
  id: string;
  adminName: string | null;
  action: string;
  target: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface AdminOverview {
  users: { total: number; newLast7Days: number };
  recentActivity: AuditEntry[];
}

// ---- Bookings and payments (admin → Bookings, Payments & refunds) ----

// Our flight statuses as staff see them (more detail than customers get).
export type AdminFlightStatus = "travellers" | "payment" | "paid" | "booking" | "pending" | "confirmed" | "failed";

export interface AdminMoney {
  amount: number;
  currency: string;
}

export interface AdminFlightBookingRow {
  id: string;
  status: AdminFlightStatus;
  // "HYD → CCU, CCU → HYD"
  route: string;
  departAt: string | null;
  leadTraveller: string | null;
  travellers: number;
  email: string | null;
  pnrs: string[];
  supplierBookingId: string;
  // What the customer pays (after coupon).
  payable: AdminMoney;
  paymentStatus: string | null;
  refunded: AdminMoney | null;
  createdAt: string;
  paidAt: string | null;
}

export interface AdminFlightBookingList {
  items: AdminFlightBookingRow[];
  total: number;
  page: number;
  pageSize: number;
  counts: Partial<Record<AdminFlightStatus, number>>;
}

export interface AdminRefund {
  id: string;
  amount: AdminMoney;
  status: string;
  reason: string | null;
  providerRefundId: string | null;
  by: string | null;
  createdAt: string;
}

export interface AdminPayment {
  id: string;
  providerOrderId: string;
  providerPaymentId: string | null;
  amount: AdminMoney;
  status: string;
  method: string | null;
  createdAt: string;
  refunds: AdminRefund[];
}

export interface AdminFlightBooking extends AdminFlightBookingRow {
  journeys: { from: string; to: string; departAt: string; arriveAt: string; flights: string[]; airlines: string }[];
  travellerList: { name: string; type: string; dateOfBirth: string | null }[];
  phone: string | null;
  tickets: { traveller: string; route: string; ticket: string }[];
  failureReason: string | null;
  // Money: fare shown, coupon, what the customer paid, what TripJack charges,
  // and our margin on it (paid − net).
  money: {
    fare: AdminMoney;
    coupon: { code: string; discount: AdminMoney } | null;
    payable: AdminMoney;
    supplierNet: AdminMoney | null;
    margin: AdminMoney | null;
    markupRule: { id: string; version: number } | null;
  };
  payments: AdminPayment[];
  bookedAt: string | null;
  opsAlertedAt: string | null;
  updatedAt: string;
}

export interface AdminPaymentRow extends AdminPayment {
  // The booking it paid for.
  flightBookingId: string | null;
  hotelCheckoutId: string | null;
  email: string | null;
}

export interface AdminPaymentList {
  items: AdminPaymentRow[];
  total: number;
  page: number;
  pageSize: number;
  counts: Partial<Record<string, number>>;
}

export interface AdminRefundRequest {
  // Rupees; empty for everything still refundable.
  amount?: number | null;
  reason: string;
}
