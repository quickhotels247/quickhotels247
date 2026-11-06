import type { Metadata } from "next";
import FlightReviewPage from "../FlightReviewPage";

export const metadata: Metadata = { title: "Review your flights", robots: { index: false } };

export default function Page() {
  return <FlightReviewPage />;
}
