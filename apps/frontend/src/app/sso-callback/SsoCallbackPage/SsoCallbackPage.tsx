"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HandleSSOCallback } from "@clerk/react";
import { routes } from "@/config/navigation";
import { CLERK_PUBLISHABLE_KEY } from "@/lib/auth/ClerkSetup";
import SsoStatus from "../SsoStatus";

const NEEDS_MORE = "This Google account needs sign-up details we don't collect. Please sign up with your email instead.";

// Google sends the browser here; Clerk finishes its sign-in (or sign-up),
// then our completion page takes over (keeping ?next and ?mode).
export default function SsoCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const connecting = params.get("mode") === "connect";
  const backTo = connecting ? routes.accountSecurity : routes.login;

  if (!CLERK_PUBLISHABLE_KEY) return <SsoStatus error="Google sign-in isn't set up yet." backTo={backTo} />;
  return (
    <>
      <SsoStatus error={error || undefined} backTo={backTo} />
      {!error && (
        <HandleSSOCallback
          navigateToApp={() => router.replace(`${routes.ssoCallback}/complete?${params}`)}
          navigateToSignIn={() => setError(NEEDS_MORE)}
          navigateToSignUp={() => setError(NEEDS_MORE)}
        />
      )}
    </>
  );
}
