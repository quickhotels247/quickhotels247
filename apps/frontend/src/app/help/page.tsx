import type { Metadata } from "next";
import HelpPage from "./HelpPage";

export const metadata: Metadata = {
  title: "Help & support",
  description: "Answers about bookings, cancellations and payments, and how to contact QuickHotels24/7.",
};

export default function Page() {
  return <HelpPage />;
}
