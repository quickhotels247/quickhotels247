import { registerAs } from "@nestjs/config";

export interface AdminConfig {
  sessionTtlMs: number;
  // Failed sign-ins allowed per email and address before a pause.
  maxLoginAttempts: number;
  loginLockMs: number;
  // Required to create the first admin in production; without it, sign-up is
  // closed there (use `db:create-admin` instead).
  setupToken?: string;
  production: boolean;
}

const MINUTE = 60 * 1000;

export const adminConfig = registerAs("admin", (): AdminConfig => ({
  sessionTtlMs: Number(process.env.ADMIN_SESSION_TTL_HOURS ?? 12) * 60 * MINUTE,
  maxLoginAttempts: 5,
  loginLockMs: 15 * MINUTE,
  setupToken: process.env.ADMIN_SETUP_TOKEN || undefined,
  production: process.env.NODE_ENV === "production",
}));
