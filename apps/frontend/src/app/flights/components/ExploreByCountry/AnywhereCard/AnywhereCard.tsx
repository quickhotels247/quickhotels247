"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PublicRounded from "@mui/icons-material/PublicRounded";
import { styles } from "./AnywhereCard.styles";

// Last tile: jumps to the full list of flight links further down the page.
export default function AnywhereCard() {
  return (
    <Box component={Link} href="#top-flights" sx={styles.root}>
      <PublicRounded sx={styles.icon} aria-hidden="true" />
      <Typography component="h3" sx={styles.title}>
        Anywhere
      </Typography>
      <Typography sx={styles.text}>Explore all destinations</Typography>
    </Box>
  );
}
