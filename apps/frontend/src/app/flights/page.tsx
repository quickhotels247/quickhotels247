import type { Metadata } from "next";
import FlightsPage from "./FlightsPage";

export const metadata: Metadata = {
  title: "Flights",
  description: "Search and compare flights across India and abroad with QuickHotels24/7.",
};

export default function Page() {
  return <FlightsPage />;
}
