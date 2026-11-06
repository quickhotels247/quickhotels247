import { Suspense } from "react";
import type { Metadata } from "next";
import MyBookingsPage from "./MyBookingsPage";

export const metadata: Metadata = { title: "My bookings", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <MyBookingsPage />
    </Suspense>
  );
}
