import { registerAs } from "@nestjs/config";

export interface AuthConfig {
  sessionTtlMs: number;
  otpTtlMs: number;
  otpResendCooldownMs: number;
  otpMaxAttempts: number;
  // Sign-up code emails per hour, across the server (protects the SMTP quota).
  otpEmailsPerHour: number;
  // How long after verifying the code the user has to finish creating the account.
  verificationTokenTtlMs: number;
  // Google sign-in through Clerk; disabled when the key is missing.
  clerkSecretKey?: string;
  // Frontend origins allowed to have issued the Clerk token.
  clerkAuthorizedParties: string[];
  // The website's address.
  frontendUrl: string;
}

const MINUTE = 60 * 1000;

/** FRONTEND_URL is one redirect target; CORS_ORIGINS holds the full allowlist. */
export function frontendUrlFromEnv(value = process.env.FRONTEND_URL): string {
  const firstConfigured = value
    ?.split(",")
    .map((origin) => origin.trim())
    .find(Boolean);
  return (firstConfigured ?? "http://localhost:3000").replace(/\/+$/, "");
}

export const authConfig = registerAs("auth", (): AuthConfig => ({
  sessionTtlMs: Number(process.env.SESSION_TTL_HOURS ?? 168) * 60 * MINUTE,
  otpTtlMs: 10 * MINUTE,
  otpResendCooldownMs: 60 * 1000,
  otpMaxAttempts: 5,
  otpEmailsPerHour: Number(process.env.OTP_EMAILS_PER_HOUR ?? 150),
  verificationTokenTtlMs: 30 * MINUTE,
  clerkSecretKey: process.env.CLERK_SECRET_KEY || undefined,
  clerkAuthorizedParties: (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  frontendUrl: frontendUrlFromEnv(),
}));
