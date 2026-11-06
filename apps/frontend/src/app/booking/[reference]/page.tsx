import { Suspense } from "react";
import type { Metadata } from "next";
import BookingConfirmationPage from "../BookingConfirmationPage";

export const metadata: Metadata = { title: "Your booking", robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <BookingConfirmationPage />
    </Suspense>
  );
}
