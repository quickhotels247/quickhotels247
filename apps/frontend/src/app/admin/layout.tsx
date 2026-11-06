import type { ReactNode } from "react";
import type { Metadata } from "next";
import AdminAuthProvider from "@/lib/admin/AdminAuthProvider";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin | QuickHotels24/7" },
  robots: { index: false, follow: false },
};

// The admin console: its own sign-in, separate from customers.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
