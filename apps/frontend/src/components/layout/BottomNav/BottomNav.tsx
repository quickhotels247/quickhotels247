"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";
import { bottomNav, isActive } from "@/config/navigation";
import { styles } from "./BottomNav.styles";

// Tab bar fixed to the bottom of phone-width screens; hidden from tablet up.
export default function BottomNav() {
  const pathname = usePathname();
  const current = bottomNav.find((item) => isActive(pathname, item.href))?.href ?? false;

  return (
    <Paper component="nav" aria-label="Quick navigation" elevation={0} sx={styles.root}>
      <BottomNavigation showLabels value={current} sx={styles.bar}>
        {bottomNav.map(({ label, href, icon: Icon }) => (
          <BottomNavigationAction
            key={href}
            label={label}
            value={href}
            icon={<Icon />}
            component={Link}
            href={href}
            sx={styles.action}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
