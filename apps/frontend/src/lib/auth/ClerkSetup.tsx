"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ClerkProvider } from "@clerk/react";

export const CLERK_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

// Clerk runs sign-up, sign-in (passwords, email codes) and Google behind our
// own forms. Without a publishable key it's skipped and the forms say
// sign-in is unavailable.
export default function ClerkSetup({ children }: { children: ReactNode }) {
  const router = useRouter();
  if (!CLERK_PUBLISHABLE_KEY) return <>{children}</>;
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      routerPush={(to) => router.push(to)}
      routerReplace={(to) => router.replace(to)}
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
