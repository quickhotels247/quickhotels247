"use client";

import Image from "next/image";
import Link from "next/link";
import Box from "@mui/material/Box";
import { SITE_NAME } from "@/config/site";
import { styles } from "./Logo.styles";

// The QuickHotels24/7 logo (icon, wordmark and "Find. Book. Stay."), linking home.
export default function Logo() {
  return (
    <Box component={Link} href="/" aria-label={`${SITE_NAME} home`} sx={styles.root}>
      <Image src="/brand/logo.png" alt={SITE_NAME} width={900} height={225} priority style={styles.image} />
    </Box>
  );
}
