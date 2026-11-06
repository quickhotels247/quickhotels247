import { Suspense } from "react";
import type { Metadata } from "next";
import SecurityPage from "./SecurityPage";

export const metadata: Metadata = { title: "Security", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <SecurityPage />
    </Suspense>
  );
}
