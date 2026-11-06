"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth as useClerkAuth, useClerk } from "@clerk/react";
import { routes } from "@/config/navigation";
import { accountApi } from "@/lib/api/auth";
import { safeNext } from "@/lib/auth/safeNext";
import { useAuth } from "@/lib/auth/useAuth";
import SsoStatus from "../../SsoStatus";

// Clerk has a session (password, email code or Google). Swap it for a
// QuickHotels24/7 session, or with ?mode=connect attach Google to the
// signed-in customer. Then sign out of Clerk so only our session remains.
export default function SsoCompletePage() {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const clerk = useClerk();
  const router = useRouter();
  const params = useSearchParams();
  const { loginWithClerk, token, status } = useAuth();
  const connecting = params.get("mode") === "connect";
  const next = connecting ? `${routes.accountSecurity}?connected=google` : safeNext(params.get("next"));
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    // Connecting needs our own session restored first.
    if (!isLoaded || started.current || (connecting && status === "loading")) return;
    started.current = true;
    void (async () => {
      try {
        const clerkToken = isSignedIn ? await getToken() : null;
        if (!clerkToken) throw new Error("Your sign-in didn't finish. Please try again.");
        if (connecting) {
          if (!token) throw new Error("Please log in again, then connect Google from your account.");
          await accountApi.connect(token, clerkToken);
        } else {
          await loginWithClerk(clerkToken);
        }
        // A failed Clerk sign-out mustn't turn a good sign-in into an error.
        await clerk.signOut().catch(() => undefined);
        router.replace(next);
      } catch (caught) {
        // End the Clerk session so the next attempt starts fresh.
        await clerk.session?.end().catch(() => undefined);
        setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
      }
    })();
  }, [isLoaded, isSignedIn, getToken, loginWithClerk, clerk, connecting, status, token, next, router]);

  return <SsoStatus error={error || undefined} backTo={connecting ? routes.accountSecurity : `${routes.login}?${new URLSearchParams({ next })}`} />;
}
