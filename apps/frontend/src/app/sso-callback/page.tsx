import { Suspense } from "react";
import type { Metadata } from "next";
import SsoCallbackPage from "./SsoCallbackPage";

export const metadata: Metadata = { title: "Signing in", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <SsoCallbackPage />
    </Suspense>
  );
}
