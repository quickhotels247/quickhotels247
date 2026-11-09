import { Suspense } from "react";
import type { Metadata } from "next";
import FlightBookingPage from "../FlightBookingPage";

export const metadata: Metadata = { title: "Your flight booking", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <FlightBookingPage />
    </Suspense>
  );
}
