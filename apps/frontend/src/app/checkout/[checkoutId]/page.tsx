import type { Metadata } from "next";
import CheckoutPage from "../CheckoutPage";

export const metadata: Metadata = {
  title: "Secure checkout",
  robots: { index: false },
};

export default function Page() {
  return <CheckoutPage />;
}
