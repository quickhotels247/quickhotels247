import type { Metadata } from "next";
import FlightBookingPage from "../FlightBookingPage";

export const metadata: Metadata = { title: "Flight booking" };

export default function Page() {
  return <FlightBookingPage />;
}
