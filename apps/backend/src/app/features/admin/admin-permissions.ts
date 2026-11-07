import type { AdminPermission, AdminRole } from "@quickhotels/types/admin";

// What each role can do (spec §1.1). Everyone can see the overview and manage
// their own account; the rest is by permission.
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  SUPER_ADMIN: ["team", "pricing", "coupons", "customers", "support", "email"],
  OPERATIONS_ADMIN: ["pricing", "coupons", "customers", "support"],
  SUPPORT_AGENT: ["customers", "support"],
};

export const permissionsOf = (role: AdminRole): AdminPermission[] => ROLE_PERMISSIONS[role] ?? [];
export const can = (role: AdminRole, permission: AdminPermission) => permissionsOf(role).includes(permission);
