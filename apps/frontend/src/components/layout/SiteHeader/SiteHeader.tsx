"use client";

import { Suspense, useState } from "react";
import AppBar from "@mui/material/AppBar";
import Container from "@mui/material/Container";
import Skeleton from "@mui/material/Skeleton";
import Toolbar from "@mui/material/Toolbar";
import Logo from "@/components/brand/Logo";
import HeaderActions from "./HeaderActions";
import MobileMenu from "./MobileMenu";
import ProductTabs from "./ProductTabs";
import { styles } from "./SiteHeader.styles";

// Sticky top bar. Desktop: logo, then Stays / Flights, then Register and Sign
// in (or the account menu) on one row. Phones: logo, account icon and menu button, with Stays / Flights on
// a second row.
export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <AppBar position="sticky" color="inherit" elevation={0} sx={styles.appBar}>
      <Container>
        <Toolbar disableGutters sx={styles.toolbar}>
          <Logo />
          <ProductTabs placement="inline" />
          {/* The actions read the URL (to come back after signing in), which
              static pages only know in the browser. */}
          <Suspense fallback={<Skeleton variant="rounded" width={180} height={36} sx={styles.actionsLoading} />}>
            <HeaderActions onOpenMenu={() => setMenuOpen(true)} />
          </Suspense>
        </Toolbar>
        <ProductTabs placement="below" />
      </Container>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </AppBar>
  );
}
