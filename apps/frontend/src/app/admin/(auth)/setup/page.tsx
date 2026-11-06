import type { Metadata } from "next";
import AdminSetupPage from "./AdminSetupPage";

export const metadata: Metadata = { title: "First admin" };

export default function Page() {
  return <AdminSetupPage />;
}
