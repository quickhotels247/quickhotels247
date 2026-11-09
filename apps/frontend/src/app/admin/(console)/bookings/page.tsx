import { Suspense } from "react";
import type { Metadata } from "next";
import BookingsPage from "./BookingsPage";

export const metadata: Metadata = { title: "Bookings" };

export default function Page() {
  return (
    <Suspense>
      <BookingsPage />
    </Suspense>
  );
}
