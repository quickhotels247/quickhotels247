import type { SavedTraveller, SavedTravellerInput } from "@quickhotels/types/travellers";
import type { AccountSecurity, AccountSession, NotificationPreferences, AuthResponse, SignupDetails, UpdateProfileRequest, User } from "@quickhotels/types/users";
import { apiRequest, postJson } from "./client";

const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

// Customer accounts on our backend. Passwords, email codes and Google run
// through Clerk; the backend turns a Clerk session into our own session.
export const authApi = {
  // Sign-up step 1: is the email or username already taken?
  checkSignupDetails: (details: SignupDetails) => postJson<void>("/auth/signup/check", details),
  // Trade a Clerk session token for a QuickHotels24/7 session.
  loginWithClerk: (clerkToken: string) => postJson<AuthResponse>("/auth/oauth/clerk", { token: clerkToken }),
  me: (token: string, signal?: AbortSignal) => apiRequest<User>("/auth/me", { signal, headers: bearer(token) }),
  logout: (token: string) => apiRequest<void>("/auth/logout", { method: "POST", headers: bearer(token) }),
};

// Account settings for the signed-in customer.
export const accountApi = {
  security: (token: string, signal?: AbortSignal) => apiRequest<AccountSecurity>("/account/security", { signal, headers: bearer(token) }),
  // Attach the Google account just signed in to through Clerk.
  connect: (token: string, clerkToken: string) =>
    postJson<AccountSecurity>("/account/identities/clerk", { token: clerkToken }, { headers: bearer(token) }),
  disconnect: (token: string, identityId: string) =>
    apiRequest<AccountSecurity>(`/account/identities/${encodeURIComponent(identityId)}`, { method: "DELETE", headers: bearer(token) }),
  sessions: (token: string, signal?: AbortSignal) => apiRequest<AccountSession[]>("/account/sessions", { signal, headers: bearer(token) }),
  signOutSession: (token: string, id: string) =>
    apiRequest<void>(`/account/sessions/${encodeURIComponent(id)}`, { method: "DELETE", headers: bearer(token) }),
  signOutOthers: (token: string) => apiRequest<void>("/account/sessions/sign-out-others", { method: "POST", headers: bearer(token) }),
  // Closes the account; the customer types their email to confirm.
  deleteAccount: (token: string, confirmEmail: string) => postJson<void>("/account/delete", { confirmEmail }, { headers: bearer(token) }),
  preferences: (token: string, signal?: AbortSignal) => apiRequest<NotificationPreferences>("/account/preferences", { signal, headers: bearer(token) }),
  setPreferences: (token: string, preferences: NotificationPreferences) =>
    apiRequest<NotificationPreferences>("/account/preferences", { method: "PUT", body: JSON.stringify(preferences), headers: bearer(token) }),
  updateProfile: (token: string, request: UpdateProfileRequest) =>
    apiRequest<User>("/account/profile", { method: "PUT", body: JSON.stringify(request), headers: bearer(token) }),
};

// Saved travellers: people the customer often books for.
export const travellersApi = {
  list: (token: string, signal?: AbortSignal) => apiRequest<SavedTraveller[]>("/account/travellers", { signal, headers: bearer(token) }),
  create: (token: string, input: SavedTravellerInput) => postJson<SavedTraveller>("/account/travellers", input, { headers: bearer(token) }),
  update: (token: string, id: string, input: SavedTravellerInput) =>
    apiRequest<SavedTraveller>(`/account/travellers/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(input), headers: bearer(token) }),
  remove: (token: string, id: string) =>
    apiRequest<void>(`/account/travellers/${encodeURIComponent(id)}`, { method: "DELETE", headers: bearer(token) }),
};
