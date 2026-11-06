import { routes } from "@/config/navigation";

// Clerk's custom-flow calls return { error } instead of throwing; this turns
// an error into one with a message our forms can show.
export type ClerkResult = { error: { code?: string; message: string; longMessage?: string } | null };

export function check(result: ClerkResult) {
  if (!result.error) return;
  // A Clerk session left by an earlier sign-in: finish that one instead.
  if (result.error.code === "session_exists") {
    window.location.assign(`${routes.ssoCallback}/complete`);
    throw new Error("You're already signed in. Opening your account…");
  }
  throw new Error(result.error.longMessage ?? result.error.message);
}

// Where Clerk sends the browser once it has a session: our page that swaps
// it for a QuickHotels24/7 session, then continues to `next`.
export const completeUrl = (next: string, mode?: "connect") => {
  const query = new URLSearchParams({ next });
  if (mode) query.set("mode", mode);
  return `${routes.ssoCallback}/complete?${query}`;
};

export const RESEND_WAIT_MS = 30_000;
