// Shared between the frontend and the backend. Types only: nothing here
// exists at runtime, so both apps can import it with `import type`.

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  // "+91 9876543210" (country code, space, number), or null.
  phone: string | null;
  // Personal details (all optional), used to fill checkout forms.
  dateOfBirth: string | null; // YYYY-MM-DD
  nationality: string | null; // ISO country code, "IN"
  gender: Gender | null;
  address: PostalAddress | null;
  isVerified: boolean;
  isLoggedIn: boolean;
  // How the account was first created.
  signedInWith: SignedInWith;
  // Team name, if the account belongs to one.
  workspace: string | null;
  createdAt: string;
}

export type SignedInWith = "Google" | "QuickHotels";

export type Gender = "male" | "female" | "other";

export interface PostalAddress {
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postcode: string | null;
  country: string; // ISO code
}

// Step 1 of sign-up: personal information. A 6-digit code is emailed for it.
export interface SignupDetails {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}

export interface SendSignupOtpResponse {
  email: string;
  expiresAt: string;
  // When the "Resend code" button may be used again.
  resendAvailableAt: string;
}

// Step 2: confirm the emailed code.
export interface VerifySignupOtpRequest {
  email: string;
  code: string;
}

export interface VerifySignupOtpResponse {
  // Proves the email was verified; required to create the account.
  verificationToken: string;
  expiresAt: string;
}

// Step 3: choose a password and create the verified account.
export interface SignupRequest extends SignupDetails {
  password: string;
  verificationToken: string;
}

export interface LoginRequest {
  // Username or email.
  identifier: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

// Clerk sign-in (email or Google): the Clerk session token, exchanged for a QuickHotels session.
export interface ClerkExchangeRequest {
  token: string;
}

// Sign-in methods connected to an account, shown under Settings.
export type IdentityProvider = "google";

export interface Identity {
  id: string;
  provider: IdentityProvider;
  // The email on that Google account; may differ from the QuickHotels email.
  email: string | null;
  createdAt: string;
}

export interface AccountSecurity {
  hasPassword: boolean;
  identities: Identity[];
}

export interface SetPasswordRequest {
  password: string;
  // Required when the account already has a password.
  currentPassword?: string;
}

// Profile edit on /account. phoneCode and phone go together; both empty clears the phone.
export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phoneCode?: string;
  phone?: string;
  // null or absent clears them.
  dateOfBirth?: string | null;
  nationality?: string | null;
  gender?: Gender | null;
  address?: PostalAddress | null;
}

// Which emails the customer wants (/account/preferences). Booking
// confirmations, changes and receipts are always sent.
export interface NotificationPreferences {
  dealsEmails: boolean;
  tripReminders: boolean;
  reviewRequests: boolean;
}

// A signed-in device on /account (Security).
export interface AccountSession {
  id: string;
  // "Chrome on macOS", or null when unknown.
  device: string | null;
  createdAt: string;
  lastUsedAt: string;
  // The browser making this request.
  current: boolean;
}

// Deleting the account: the customer types their email to confirm.
export interface DeleteAccountRequest {
  confirmEmail: string;
}

// Error body returned by the API (NestJS's default shape).
export interface ApiErrorBody {
  message: string | string[];
  error: string;
  statusCode: number;
}
