import type { AdminRole } from "@quickhotels/types/admin";

// What each role is called and can do (enforced by the server).
export const ROLE_INFO: Record<AdminRole, { label: string; description: string }> = {
  SUPER_ADMIN: { label: "Super admin", description: "Everything, including the admin team, refunds and email settings." },
  OPERATIONS_ADMIN: { label: "Operations", description: "Bookings and refunds, customers, support, pricing and coupons." },
  SUPPORT_AGENT: { label: "Support agent", description: "Bookings (view and re-check), customers and the support inbox." },
};
export const ROLES = Object.keys(ROLE_INFO) as AdminRole[];
