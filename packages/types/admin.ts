// The admin dashboard (/api/admin/*). Admins are separate accounts from users.
import type { SignedInWith } from "@quickhotels/types/users";

// Spec §1.1 roles. What each can do is decided on the server; the console
// gets the signed-in admin's permissions to show only what they can use.
export type AdminRole = "SUPER_ADMIN" | "OPERATIONS_ADMIN" | "SUPPORT_AGENT";
export type AdminPermission = "team" | "pricing" | "coupons" | "customers" | "support" | "email";

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
