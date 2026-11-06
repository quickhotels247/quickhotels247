"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FlightRounded from "@mui/icons-material/FlightRounded";
import { routes } from "@/config/navigation";
import type { FlightLinkGroup } from "../../../data/types";
import { styles } from "./FlightLinkItem.styles";

interface FlightLinkItemProps {
  link: FlightLinkGroup["links"][number];
}

// Plane badge plus "Mumbai → New Delhi"; opens a flight search for it.
export default function FlightLinkItem({ link }: FlightLinkItemProps) {
  const href = `${routes.flightSearch}?${new URLSearchParams({ tripType: "roundTrip", ...(link.from ? { from: link.from } : {}), to: link.to })}`;
  return (
    <Box component={Link} href={href} sx={styles.root}>
      <Box sx={styles.badge} aria-hidden="true">
        <FlightRounded />
      </Box>
      <Typography component="span" sx={styles.label}>
        {link.label}
      </Typography>
    </Box>
  );
}
