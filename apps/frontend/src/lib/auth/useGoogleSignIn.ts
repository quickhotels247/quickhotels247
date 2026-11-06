"use client";

import { useSignIn } from "@clerk/react";
import { routes } from "@/config/navigation";
import { CLERK_PUBLISHABLE_KEY } from "./ClerkSetup";
import { completeUrl } from "./clerkFlow";

// "login" signs in (or up). "connect" attaches Google to the signed-in customer.
export type GoogleMode = "login" | "connect";

// Sends the browser to Google through Clerk; it comes back to /sso-callback
// and then to `next`. Resolves never: the page is navigating away.
function useClerkGoogle() {
  const { signIn } = useSignIn();
  return async (next: string, mode: GoogleMode = "login"): Promise<never> => {
    const query = new URLSearchParams({ next });
    if (mode === "connect") query.set("mode", "connect");
    const { error } = await signIn.sso({
      strategy: "oauth_google",
      redirectCallbackUrl: `${routes.ssoCallback}?${query}`,
      redirectUrl: completeUrl(next, mode === "connect" ? "connect" : undefined),
    });
    // A Clerk session left over from an unfinished sign-in: finish it.
    if (error?.code === "session_exists") window.location.assign(completeUrl(next, mode === "connect" ? "connect" : undefined));
    else if (error) throw new Error(error.longMessage ?? error.message);
    return new Promise<never>(() => {});
  };
}

function useGoogleUnavailable() {
  return async (): Promise<never> => {
    throw new Error("Google sign-in isn't set up yet. Use your email instead.");
  };
}

// Chosen once at load (the key can't change at runtime), so hook order stays stable.
export const useGoogleSignIn = CLERK_PUBLISHABLE_KEY ? useClerkGoogle : useGoogleUnavailable;
