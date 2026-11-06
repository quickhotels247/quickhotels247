import type { Metadata } from "next";
import AdminSettingsPage from "./AdminSettingsPage";

export const metadata: Metadata = { title: "Account settings" };

export default function Page() {
  return <AdminSettingsPage />;
}
