import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import RequireAdmin from "@/components/admin/RequireAdmin";

// Every console page: signed-in admins only, in the sidebar frame.
export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAdmin>
      <AdminShell>{children}</AdminShell>
    </RequireAdmin>
  );
}
