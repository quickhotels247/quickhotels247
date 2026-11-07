import { Suspense } from "react";
import type { Metadata } from "next";
import FlightResultsPage from "./FlightResultsPage";

export const metadata: Metadata = {
  title: "Flight search",
  // Results depend on the URL's search: not useful as search-engine pages.
  robots: { index: false, follow: true },
  description: "Compare flights and live fares across airlines with QuickHotels24/7.",
};

// The results read the search from the URL in the browser; Suspense covers
// the moment before the URL is read.
export default function Page() {
  return (
    <Suspense>
      <FlightResultsPage />
    </Suspense>
  );
}
