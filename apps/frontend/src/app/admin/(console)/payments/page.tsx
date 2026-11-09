import { Suspense } from "react";
import type { Metadata } from "next";
import PaymentsPage from "./PaymentsPage";

export const metadata: Metadata = { title: "Payments & refunds" };

export default function Page() {
  return (
    <Suspense>
      <PaymentsPage />
    </Suspense>
  );
}
