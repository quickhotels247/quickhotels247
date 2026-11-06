import { Suspense } from "react";
import type { Metadata } from "next";
import CustomersPage from "./CustomersPage";

export const metadata: Metadata = { title: "Customers" };

export default function Page() {
  return (
    <Suspense>
      <CustomersPage />
    </Suspense>
  );
}
