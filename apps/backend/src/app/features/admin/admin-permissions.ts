import type { AdminPermission, AdminRole } from "@quickhotels/types/admin";

// What each role can do (spec §1.1). Everyone can see the overview and manage
// their own account; the rest is by permission.
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  SUPER_ADMIN: ["team", "pricing", "coupons", "customers", "support", "email", "bookings", "refunds"],
  OPERATIONS_ADMIN: ["pricing", "coupons", "customers", "support", "bookings", "refunds"],
  // Support can see bookings and ask the supplier again, but not move money.
  SUPPORT_AGENT: ["customers", "support", "bookings"],
};

export const permissionsOf = (role: AdminRole): AdminPermission[] => ROLE_PERMISSIONS[role] ?? [];
export const can = (role: AdminRole, permission: AdminPermission) => permissionsOf(role).includes(permission);
