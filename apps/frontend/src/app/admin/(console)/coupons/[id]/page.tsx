import type { Metadata } from "next";
import CouponReportPage from "../CouponReportPage";

export const metadata: Metadata = { title: "Coupon report" };

export default function Page() {
  return <CouponReportPage />;
}
