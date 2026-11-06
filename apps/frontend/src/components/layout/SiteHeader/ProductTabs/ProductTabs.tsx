"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { productNav } from "@/config/navigation";
import { styles } from "./ProductTabs.styles";

interface ProductTabsProps {
  // "inline": in the top row, desktop only. "below": under the logo, phones only.
  placement: "inline" | "below";
}

// Stays / Flights pills.
export default function ProductTabs({ placement }: ProductTabsProps) {
  const pathname = usePathname();
  return (
    <Box component="nav" aria-label="Products" sx={styles.root(placement)}>
      {productNav.map(({ id, label, href, icon: Icon, matches }) => {
        const active = matches(pathname);
        return (
          <ButtonBase
            key={id}
            component={Link}
            href={href}
            aria-current={active ? "page" : undefined}
            sx={styles.tab(active)}
          >
            <Icon sx={styles.icon} aria-hidden="true" />
            {label}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
