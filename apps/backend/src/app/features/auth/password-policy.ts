// Same rules the sign-up form shows in the frontend.
export function checkPasswordPolicy(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password must be at most 128 characters.";
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
    return "Password must include a letter and a number.";
  }
  return null;
}
