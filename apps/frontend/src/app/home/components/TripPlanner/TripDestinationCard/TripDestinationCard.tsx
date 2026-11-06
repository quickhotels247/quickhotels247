"use client";

import Image from "next/image";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { routes } from "@/config/navigation";
import type { IndiaDestination } from "../../../data/types";
import { styles } from "./TripDestinationCard.styles";

interface TripDestinationCardProps {
  destination: IndiaDestination;
}

// Wide photo with the place and its state underneath.
export default function TripDestinationCard({ destination }: TripDestinationCardProps) {
  const href = `${routes.hotels}?${new URLSearchParams({ destination: destination.name })}`;
  return (
    <Box component={Link} href={href} sx={styles.root}>
      <Box sx={styles.media}>
        <Image src={destination.imageUrl} alt={destination.name} fill sizes="(max-width: 600px) 62vw, 290px" style={{ objectFit: "cover" }} />
      </Box>
      <Typography component="h3" sx={styles.name}>
        {destination.name}
      </Typography>
      {destination.state !== destination.name && <Typography sx={styles.state}>{destination.state}</Typography>}
    </Box>
  );
}
