import type { SignupDetails } from "@quickhotels/types/users";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type DetailsField = keyof SignupDetails;

export function validateDetails(values: SignupDetails): Record<DetailsField, string> {
  const { firstName, lastName, email, username } = values;
  return {
    firstName: firstName.trim() ? "" : "Enter your first name.",
    lastName: lastName.trim() ? "" : "Enter your last name.",
    email: !email.trim() ? "Enter your email." : EMAIL_PATTERN.test(email.trim()) ? "" : "Enter a valid email address.",
    username: !username.trim()
      ? "Choose a username."
      : /^[a-zA-Z0-9_.-]{3,20}$/.test(username.trim())
        ? ""
        : "Use 3–20 letters, numbers, dots, dashes or underscores.",
  };
}

export function validatePassword(password: string, confirmPassword: string) {
  return {
    password: password.length >= 8 ? "" : "Use at least 8 characters.",
    confirmPassword: !confirmPassword ? "Re-enter your password." : confirmPassword === password ? "" : "Passwords don't match.",
  };
}

// 0 = too short; otherwise one point each for length, mixed case, digits, symbols.
export function passwordStrength(password: string) {
  if (password.length < 8) return 0;
  return [true, /[a-z]/.test(password) && /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
}

export const trimDetails = (values: SignupDetails): SignupDetails => ({
  firstName: values.firstName.trim(),
  lastName: values.lastName.trim(),
  email: values.email.trim().toLowerCase(),
  username: values.username.trim(),
});
