import { Suspense } from "react";
import type { Metadata } from "next";
import StartCheckoutPage from "./StartCheckoutPage";

export const metadata: Metadata = {
  title: "Secure checkout",
  robots: { index: false },
};

export default function Page() {
  return (
    <Suspense>
      <StartCheckoutPage />
    </Suspense>
  );
}
