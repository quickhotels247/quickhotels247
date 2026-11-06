import type { Metadata } from "next";
import AccountDashboardPage from "./AccountDashboardPage";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

export default function Page() {
  return <AccountDashboardPage />;
}
