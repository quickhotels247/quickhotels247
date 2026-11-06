"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import { routes } from "@/config/navigation";
import BottomNav from "../BottomNav";
import SiteFooter from "../SiteFooter";
import SiteHeader from "../SiteHeader";
import { styles } from "./SiteLayout.styles";

// Frame for every customer page: header, page content, footer, and the
// phone-width tab bar. The admin console brings its own frame.
export default function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === routes.admin || pathname.startsWith(`${routes.admin}/`)) return <>{children}</>;
  return (
    <Box sx={styles.root}>
      <SiteHeader />
      <Box component="main" sx={styles.main}>
        {children}
      </Box>
      <SiteFooter />
      <BottomNav />
    </Box>
  );
}
