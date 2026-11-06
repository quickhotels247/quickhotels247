"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { routes } from "@/config/navigation";
import { useAdminAuth } from "@/lib/admin/AdminAuthProvider";
import { styles } from "./RequireAdmin.styles";

// Console pages are for signed-in admins only; others go to the admin login.
export default function RequireAdmin({ children }: { children: ReactNode }) {
  const { status } = useAdminAuth();
  const router = useRouter();
  useEffect(() => {
    if (status === "anonymous") router.replace(routes.adminLogin);
  }, [status, router]);
  if (status !== "authenticated") {
    return (
      <Box sx={styles.loading} role="status" aria-label="Checking your admin sign-in">
        <CircularProgress />
      </Box>
    );
  }
  return <>{children}</>;
}
