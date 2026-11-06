import { checkPasswordPolicy } from "../auth/password-policy.js";

// Admin passwords guard the API keys, so they must be longer than users'.
export const ADMIN_PASSWORD_MIN = 12;

export function checkAdminPassword(password: string): string | null {
  if (password.length < ADMIN_PASSWORD_MIN) {
    return `Admin passwords must be at least ${ADMIN_PASSWORD_MIN} characters.`;
  }
  return checkPasswordPolicy(password);
}
