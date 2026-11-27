import type { Metadata } from "next";
import PromotionsPage from "./PromotionsPage";

export const metadata: Metadata = { title: "Promotions" };

export default function Page() {
  return <PromotionsPage />;
}
