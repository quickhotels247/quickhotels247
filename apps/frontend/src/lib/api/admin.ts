import type { Coupon, CouponInput } from "@quickhotels/types/coupons";
import type { AdminTicket, AdminTicketList, TicketNoteRequest, TicketStatus, TicketUpdateRequest } from "@quickhotels/types/support";
import type { PricingRule, PricingRuleInput } from "@quickhotels/types/pricing";
import type {
  AdminAccount,
  AdminAuthResponse,
  AdminLoginRequest,
  AdminOverview,
  AdminProfile,
  AdminSetupRequest,
  AdminSetupStatus,
  AdminUserList,
  AdminUserRow,
  ChangeAdminPasswordRequest,
  AddAdminRequest,
  AdminRole,
  AdminFlightBooking,
  AdminFlightBookingList,
  AdminPaymentList,
  AdminRefundRequest,
  AdminHotelBooking,
  AdminHotelBookingList,
  AdminHotelCancelRequest,
  AdminHotelFilter,
} from "@quickhotels/types/admin";
import { apiRequest, postJson } from "./client";

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
// Query string without empty values.
const query = (params: Record<string, string | number | undefined>) =>
  new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== "").map(([key, value]) => [key, String(value)])).toString();

// The admin console's backend (/api/admin/*). Admin sessions are separate
// from customer sessions.
export const adminApi = {
  setupStatus: (signal?: AbortSignal) => apiRequest<AdminSetupStatus>("/admin/auth/setup", { signal }),
  setup: (request: AdminSetupRequest) => postJson<AdminAuthResponse>("/admin/auth/setup", request),
  login: (request: AdminLoginRequest) => postJson<AdminAuthResponse>("/admin/auth/login", request),
  me: (token: string, signal?: AbortSignal) => apiRequest<AdminProfile>("/admin/auth/me", { signal, headers: bearer(token) }),
  logout: (token: string) => apiRequest<void>("/admin/auth/logout", { method: "POST", headers: bearer(token) }),
  changePassword: (token: string, request: ChangeAdminPasswordRequest) =>
    apiRequest<void>("/admin/auth/password", { method: "PUT", body: JSON.stringify(request), headers: bearer(token) }),
  // Markup rules; every change returns the whole updated list.
  pricingRules: (token: string, signal?: AbortSignal) => apiRequest<PricingRule[]>("/admin/pricing-rules", { signal, headers: bearer(token) }),
  createPricingRule: (token: string, rule: PricingRuleInput) =>
    apiRequest<PricingRule[]>("/admin/pricing-rules", { method: "POST", body: JSON.stringify(rule), headers: bearer(token) }),
  updatePricingRule: (token: string, id: string, rule: PricingRuleInput) =>
    apiRequest<PricingRule[]>(`/admin/pricing-rules/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(rule), headers: bearer(token) }),
  deletePricingRule: (token: string, id: string) =>
    apiRequest<PricingRule[]>(`/admin/pricing-rules/${encodeURIComponent(id)}`, { method: "DELETE", headers: bearer(token) }),
  // Bookings and payments.
  flightBookings: (token: string, params: { status?: string; q?: string; page?: number }, signal?: AbortSignal) =>
    apiRequest<AdminFlightBookingList>(`/admin/bookings/flights?${query(params)}`, { signal, headers: bearer(token) }),
  flightBooking: (token: string, id: string, signal?: AbortSignal) =>
    apiRequest<AdminFlightBooking>(`/admin/bookings/flights/${encodeURIComponent(id)}`, { signal, headers: bearer(token) }),
  recheckFlightBooking: (token: string, id: string) =>
    apiRequest<{ supplierStatus: string; booking: AdminFlightBooking }>(`/admin/bookings/flights/${encodeURIComponent(id)}/recheck`, { method: "POST", headers: bearer(token) }),
  refundFlightBooking: (token: string, id: string, request: AdminRefundRequest) =>
    apiRequest<AdminFlightBooking>(`/admin/bookings/flights/${encodeURIComponent(id)}/refund`, { method: "POST", body: JSON.stringify(request), headers: bearer(token) }),
  hotelBookings: (token: string, params: { status?: AdminHotelFilter; q?: string; page?: number }, signal?: AbortSignal) =>
    apiRequest<AdminHotelBookingList>(`/admin/bookings/hotels?${query(params)}`, { signal, headers: bearer(token) }),
  hotelBooking: (token: string, id: string, signal?: AbortSignal) =>
    apiRequest<AdminHotelBooking>(`/admin/bookings/hotels/${encodeURIComponent(id)}`, { signal, headers: bearer(token) }),
  recheckHotelBooking: (token: string, id: string) =>
    apiRequest<{ supplierStatus: string; booking: AdminHotelBooking }>(`/admin/bookings/hotels/${encodeURIComponent(id)}/recheck`, { method: "POST", headers: bearer(token) }),
  refundHotelBooking: (token: string, id: string, request: AdminRefundRequest) =>
    apiRequest<AdminHotelBooking>(`/admin/bookings/hotels/${encodeURIComponent(id)}/refund`, { method: "POST", body: JSON.stringify(request), headers: bearer(token) }),
  cancelHotelBooking: (token: string, id: string, request: AdminHotelCancelRequest) =>
    apiRequest<AdminHotelBooking>(`/admin/bookings/hotels/${encodeURIComponent(id)}/cancel`, { method: "POST", body: JSON.stringify(request), headers: bearer(token) }),
  payments: (token: string, params: { status?: string; q?: string; page?: number }, signal?: AbortSignal) =>
    apiRequest<AdminPaymentList>(`/admin/payments?${query(params)}`, { signal, headers: bearer(token) }),
  // Coupons; every change returns the whole updated list.
  coupons: (token: string, signal?: AbortSignal) => apiRequest<Coupon[]>("/admin/coupons", { signal, headers: bearer(token) }),
  createCoupon: (token: string, coupon: CouponInput) =>
    apiRequest<Coupon[]>("/admin/coupons", { method: "POST", body: JSON.stringify(coupon), headers: bearer(token) }),
  updateCoupon: (token: string, id: string, coupon: CouponInput) =>
    apiRequest<Coupon[]>(`/admin/coupons/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(coupon), headers: bearer(token) }),
  deleteCoupon: (token: string, id: string) =>
    apiRequest<Coupon[]>(`/admin/coupons/${encodeURIComponent(id)}`, { method: "DELETE", headers: bearer(token) }),
  // Support inbox (tickets from /help).
  tickets: (token: string, params: { status?: TicketStatus; q?: string; page?: number }, signal?: AbortSignal) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== "").map(([key, value]) => [key, String(value)]));
    return apiRequest<AdminTicketList>(`/admin/support/tickets${query.size ? `?${query}` : ""}`, { signal, headers: bearer(token) });
  },
  ticket: (token: string, id: string, signal?: AbortSignal) => apiRequest<AdminTicket>(`/admin/support/tickets/${encodeURIComponent(id)}`, { signal, headers: bearer(token) }),
  updateTicket: (token: string, id: string, update: TicketUpdateRequest) =>
    apiRequest<AdminTicket>(`/admin/support/tickets/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(update), headers: bearer(token) }),
  addTicketNote: (token: string, id: string, note: TicketNoteRequest) =>
    apiRequest<AdminTicket>(`/admin/support/tickets/${encodeURIComponent(id)}/notes`, { method: "POST", body: JSON.stringify(note), headers: bearer(token) }),
  // Email: is sending set up, and send a test email to an address.
  mailStatus: (token: string, signal?: AbortSignal) => apiRequest<{ configured: boolean }>("/admin/mail/status", { signal, headers: bearer(token) }),
  testEmail: (token: string, to: string) =>
    apiRequest<void>("/admin/mail/test", { method: "POST", body: JSON.stringify({ to }), headers: bearer(token) }),

  overview: (token: string, signal?: AbortSignal) => apiRequest<AdminOverview>("/admin/overview", { signal, headers: bearer(token) }),
  users: (token: string, search: string, page: number, signal?: AbortSignal) => {
    const params = new URLSearchParams({ page: String(page), pageSize: "25" });
    if (search.trim()) params.set("search", search.trim());
    return apiRequest<AdminUserList>(`/admin/users?${params}`, { signal, headers: bearer(token) });
  },
  user: (token: string, id: string, signal?: AbortSignal) =>
    apiRequest<AdminUserRow>(`/admin/users/${encodeURIComponent(id)}`, { signal, headers: bearer(token) }),
  admins: (token: string, signal?: AbortSignal) => apiRequest<AdminAccount[]>("/admin/admins", { signal, headers: bearer(token) }),
  addAdmin: (token: string, request: AddAdminRequest) => postJson<AdminAccount>("/admin/admins", request, { headers: bearer(token) }),
  // Both return the whole updated team.
  setAdminRole: (token: string, id: string, role: AdminRole) =>
    apiRequest<AdminAccount[]>(`/admin/admins/${encodeURIComponent(id)}/role`, { method: "PUT", body: JSON.stringify({ role }), headers: bearer(token) }),
  removeAdmin: (token: string, id: string) =>
    apiRequest<AdminAccount[]>(`/admin/admins/${encodeURIComponent(id)}`, { method: "DELETE", headers: bearer(token) }),
};
