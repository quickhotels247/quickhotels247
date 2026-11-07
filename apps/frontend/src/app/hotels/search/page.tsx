import { Suspense } from "react";
import type { Metadata } from "next";
import ResultsSkeleton from "./components/ResultsSkeleton";
import SearchResultsPage from "./SearchResultsPage";

export const metadata: Metadata = {
  title: "Hotel search",
  // Results depend on the URL's search: not useful as search-engine pages.
  robots: { index: false, follow: true },
  description: "Compare hotels and live prices for your dates with QuickHotels24/7.",
};

// The results read the search from the URL in the browser, so the page
// itself stays static; Suspense covers the moment before the URL is read.
export default function Page() {
  return (
    <Suspense fallback={<ResultsSkeleton />}>
      <SearchResultsPage />
    </Suspense>
  );
}
