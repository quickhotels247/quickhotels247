import { Suspense } from "react";
import type { Metadata } from "next";
import SsoCompletePage from "./SsoCompletePage";

export const metadata: Metadata = { title: "Signing in", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <SsoCompletePage />
    </Suspense>
  );
}
