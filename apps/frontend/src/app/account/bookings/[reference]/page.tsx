import type { Metadata } from "next";
import BookingDetailsPage from "../BookingDetailsPage";

export const metadata: Metadata = { title: "Booking details", robots: { index: false } };

export default function Page() {
  return <BookingDetailsPage />;
}
