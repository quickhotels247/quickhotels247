import type { Metadata } from "next";
import CustomerDetailPage from "../CustomerDetailPage";

export const metadata: Metadata = { title: "Customer" };

export default function Page() {
  return <CustomerDetailPage />;
}
