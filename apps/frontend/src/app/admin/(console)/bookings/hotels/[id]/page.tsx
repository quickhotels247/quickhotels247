import type { Metadata } from "next";
import HotelBookingPage from "../HotelBookingPage";

export const metadata: Metadata = { title: "Hotel booking" };

export default function Page() {
  return <HotelBookingPage />;
}
