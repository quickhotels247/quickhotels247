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
  NewAdminRequest,
} from "@quickhotels/types/admin";
import { apiRequest, postJson } from "./client";

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

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
  addAdmin: (token: string, request: NewAdminRequest) => postJson<AdminAccount>("/admin/admins", request, { headers: bearer(token) }),
};
