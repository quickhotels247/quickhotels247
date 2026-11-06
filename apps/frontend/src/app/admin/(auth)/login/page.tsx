import type { Metadata } from "next";
import AdminLoginPage from "./AdminLoginPage";

export const metadata: Metadata = { title: "Sign in" };

export default function Page() {
  return <AdminLoginPage />;
}
