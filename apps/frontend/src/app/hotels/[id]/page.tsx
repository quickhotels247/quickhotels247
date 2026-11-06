import { Suspense } from "react";
import type { Metadata } from "next";
import HotelDetailsPage from "./HotelDetailsPage";

export const metadata: Metadata = {
  title: "Hotel",
  description: "Photos, facilities, policies and live room prices on QuickHotels24/7.",
};

// The page reads the stay from the URL in the browser; Suspense covers the
// moment before that.
export default function Page() {
  return (
    <Suspense>
      <HotelDetailsPage />
    </Suspense>
  );
}
