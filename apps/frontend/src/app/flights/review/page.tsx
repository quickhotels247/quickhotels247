import { Suspense } from "react";
import type { Metadata } from "next";
import StartFlightReviewPage from "./StartFlightReviewPage";

export const metadata: Metadata = { title: "Review your flights", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <StartFlightReviewPage />
    </Suspense>
  );
}
