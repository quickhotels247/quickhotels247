import type { Metadata } from "next";
import PricingPage from "./PricingPage";

export const metadata: Metadata = { title: "Pricing & markup" };

export default function Page() {
  return <PricingPage />;
}
