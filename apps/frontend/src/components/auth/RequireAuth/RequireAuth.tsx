"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { routes } from "@/config/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { styles } from "./RequireAuth.styles";

// Shows its content only to signed-in customers; others go to log in and
// come back here afterwards.
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") router.replace(`${routes.login}?${new URLSearchParams({ next: pathname })}`);
  }, [status, pathname, router]);

  if (status !== "authenticated") {
    return (
      <Box sx={styles.loading} role="status" aria-label="Checking your sign-in">
        <CircularProgress />
      </Box>
    );
  }
  return <>{children}</>;
}
